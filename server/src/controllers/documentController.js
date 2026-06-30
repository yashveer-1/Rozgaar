import { Document, IncomeRecord } from '../models/Record.js';
import { uploadDocument, runOcr } from '../services/documentService.js';
import { HttpError, notFound } from '../utils/httpError.js';

export async function listDocuments(req, res, next) {
  try { return res.json(await Document.find({ worker: req.user.sub }).sort('-createdAt')); } catch (error) { return next(error); }
}

export async function uploadAndExtract(req, res, next) {
  try {
    if (!req.file) throw new HttpError(400, 'A document file is required');
    const uploaded = await uploadDocument(req.file.buffer, req.file.mimetype);
    const document = await Document.create({
      worker: req.user.sub, name: req.file.originalname, type: req.body.type || 'payment_receipt',
      url: uploaded.secure_url, cloudinaryId: uploaded.public_id, status: 'processing',
    });
    try {
      const extractedData = await runOcr(req.file.buffer, req.file.mimetype);
      document.extractedData = extractedData;
      if (extractedData.amount && extractedData.date) {
        await IncomeRecord.create({
          worker: req.user.sub, sourceDocument: document.id, amount: extractedData.amount,
          date: extractedData.date, employerName: extractedData.employer,
          paymentMethod: document.type === 'upi' ? 'upi' : 'other',
          referenceNumber: extractedData.referenceNumber, verified: false,
        });
      }
      document.status = 'verified';
      await document.save();
    } catch (ocrError) {
      document.extractedData = { error: 'OCR extraction failed' };
      document.status = 'verified';
      await document.save();
      console.error('OCR failed', ocrError);
    }
    return res.status(201).json(document);
  } catch (error) { return next(error); }
}

export async function deleteDocument(req, res, next) {
  try {
    const document = await Document.findOne({ _id: req.params.id, worker: req.user.sub });
    if (!document) throw notFound('Document');
    await IncomeRecord.deleteMany({ sourceDocument: document.id, verified: false });
    await document.deleteOne();
    return res.status(204).end();
  } catch (error) { return next(error); }
}
