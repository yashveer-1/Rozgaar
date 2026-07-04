import { v2 as cloudinary } from 'cloudinary';
import { createWorker } from 'tesseract.js';
import { structureTransaction } from './aiService.js';
import { HttpError } from '../utils/httpError.js';

const configured = () => process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET;

export async function uploadDocument(buffer, mimetype) {
  if (!configured()) throw new HttpError(503, 'Cloudinary is not configured');
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: 'shramik-lens/documents', resource_type: mimetype === 'application/pdf' ? 'raw' : 'image' },
      (error, result) => error ? reject(error) : resolve(result),
    );
    stream.end(buffer);
  });
}

const amountPattern = /(?:₹|rs\.?|inr|amount)\s*[:.-]?\s*([\d,]+(?:\.\d{1,2})?)/i;
const datePatterns = [/\b(\d{4}-\d{2}-\d{2})\b/, /\b(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})\b/];
const referencePattern = /(?:utr|ref(?:erence)?(?:\s*no)?|transaction\s*id)\s*[:#.-]?\s*([a-z0-9-]{6,})/i;

function parseTransactionDate(value) {
  if (!value) return null;
  const normalized = String(value).trim();
  const isoMatch = normalized.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  const localMatch = normalized.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{2}|\d{4})$/);
  const parts = isoMatch
    ? { year: Number(isoMatch[1]), month: Number(isoMatch[2]), day: Number(isoMatch[3]) }
    : localMatch
      ? {
          year: Number(localMatch[3].length === 2 ? `20${localMatch[3]}` : localMatch[3]),
          month: Number(localMatch[2]),
          day: Number(localMatch[1]),
        }
      : null;
  if (!parts) return null;
  const date = new Date(Date.UTC(parts.year, parts.month - 1, parts.day));
  return date.getUTCFullYear() === parts.year
    && date.getUTCMonth() === parts.month - 1
    && date.getUTCDate() === parts.day
    ? date
    : null;
}

function normalizePaymentMethod(value, text = '') {
  const method = String(value || '').toLowerCase();
  if (method === 'upi' || /\b(?:upi|gpay|phonepe|paytm)\b/i.test(text)) return 'upi';
  if (method === 'cash' || /\bcash\b/i.test(text)) return 'cash';
  if (method === 'bank_transfer' || /\b(?:neft|imps|rtgs|bank transfer)\b/i.test(text)) return 'bank_transfer';
  if (method === 'cheque' || /\bcheque\b/i.test(text)) return 'cheque';
  return 'other';
}

export function extractTransaction(text) {
  const amount = text.match(amountPattern)?.[1]?.replaceAll(',', '');
  const rawDate = datePatterns.map(pattern => text.match(pattern)?.[1]).find(Boolean);
  const lines = text.split('\n').map(line => line.trim()).filter(Boolean);
  const employerLine = lines.find(line => /(?:paid by|from|employer|company)\s*[:.-]/i.test(line));
  return {
    amount: amount ? Number(amount) : null,
    date: parseTransactionDate(rawDate),
    employer: employerLine?.replace(/^.*?(?:paid by|from|employer|company)\s*[:.-]\s*/i, '') || null,
    referenceNumber: text.match(referencePattern)?.[1] || null,
    paymentMethod: normalizePaymentMethod(null, text),
    rawText: text,
  };
}

export async function runOcr(buffer, mimetype) {
  if (!mimetype.startsWith('image/')) return { rawText: '', amount: null, date: null, employer: null, referenceNumber: null };
  const worker = await createWorker('eng');
  try {
    const { data } = await worker.recognize(buffer);
    const extracted = extractTransaction(data.text);
    if (extracted.amount && extracted.date) return extracted;

    try {
      const structured = await structureTransaction(data.text);
      if (!structured) return extracted;
      return {
        amount: Number.isFinite(Number(structured.amount)) && Number(structured.amount) > 0
          ? Number(structured.amount)
          : extracted.amount,
        date: parseTransactionDate(structured.date) || extracted.date,
        employer: structured.employer?.trim() || extracted.employer,
        referenceNumber: structured.referenceNumber?.trim() || extracted.referenceNumber,
        paymentMethod: normalizePaymentMethod(structured.paymentMethod, data.text),
        rawText: data.text,
      };
    } catch (error) {
      console.error('Gemini transaction structuring failed', error);
      return extracted;
    }
  } finally {
    await worker.terminate();
  }
}
