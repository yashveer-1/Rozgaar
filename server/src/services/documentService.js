import { v2 as cloudinary } from 'cloudinary';
import { createWorker } from 'tesseract.js';
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

const amountPattern = /(?:₹|rs\.?|inr)\s*[:.-]?\s*([\d,]+(?:\.\d{1,2})?)/i;
const datePatterns = [/\b(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})\b/, /\b(\d{4}-\d{2}-\d{2})\b/];
const referencePattern = /(?:utr|ref(?:erence)?(?:\s*no)?|transaction\s*id)\s*[:#.-]?\s*([a-z0-9-]{6,})/i;

export function extractTransaction(text) {
  const amount = text.match(amountPattern)?.[1]?.replaceAll(',', '');
  const rawDate = datePatterns.map(pattern => text.match(pattern)?.[1]).find(Boolean);
  const lines = text.split('\n').map(line => line.trim()).filter(Boolean);
  const employerLine = lines.find(line => /(?:paid by|from|employer|company)\s*[:.-]/i.test(line));
  return {
    amount: amount ? Number(amount) : null,
    date: rawDate && !Number.isNaN(Date.parse(rawDate)) ? new Date(rawDate) : null,
    employer: employerLine?.replace(/^.*?(?:paid by|from|employer|company)\s*[:.-]\s*/i, '') || null,
    referenceNumber: text.match(referencePattern)?.[1] || null,
    rawText: text,
  };
}

export async function runOcr(buffer, mimetype) {
  if (!mimetype.startsWith('image/')) return { rawText: '', amount: null, date: null, employer: null, referenceNumber: null };
  const worker = await createWorker('eng');
  try {
    const { data } = await worker.recognize(buffer);
    return extractTransaction(data.text);
  } finally {
    await worker.terminate();
  }
}
