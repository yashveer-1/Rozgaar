import { Document, IncomeRecord } from '../models/Record.js';
import { uploadDocument, runOcr } from '../services/documentService.js';
import { recalculateWorkerMetrics } from '../services/metricsService.js';
import { refreshExistingPassport } from '../services/passportService.js';
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
    let incomeRecord = null;
    let extractedData = null;
    try {
      extractedData = await runOcr(req.file.buffer, req.file.mimetype);
      document.extractedData = extractedData;
    } catch (ocrError) {
      document.extractedData = { error: 'OCR extraction failed' };
      console.error('OCR failed', ocrError);
    }
    document.status = 'verified';
    await document.save();

    if (extractedData?.amount && extractedData.date) {
      incomeRecord = await IncomeRecord.findOneAndUpdate(
        { sourceDocument: document._id },
        {
          $setOnInsert: {
            worker: req.user.sub,
            sourceDocument: document._id,
            amount: extractedData.amount,
            date: extractedData.date,
            employerName: extractedData.employer,
            paymentMethod: extractedData.paymentMethod || (document.type === 'upi' ? 'upi' : 'other'),
            referenceNumber: extractedData.referenceNumber,
            verified: true,
          },
        },
        { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true },
      );
    }

    const metrics = await recalculateWorkerMetrics(req.user.sub);
    await refreshExistingPassport(req.user.sub);
    return res.status(201).json({
      ...document.toObject(),
      incomeRecord,
      metrics: metrics ? {
        monthlyIncome: metrics.income.monthlyIncome,
        financialReadiness: metrics.scores.financialReadiness,
        trust: metrics.scores.trust,
        profileCompletion: metrics.profile.profileCompletion,
      } : null,
    });
  } catch (error) { return next(error); }
}

export async function deleteDocument(req, res, next) {
  try {
    const document = await Document.findOne({ _id: req.params.id, worker: req.user.sub });
    if (!document) throw notFound('Document');
    await IncomeRecord.deleteMany({ sourceDocument: document.id });
    await document.deleteOne();
    await recalculateWorkerMetrics(req.user.sub);
    await refreshExistingPassport(req.user.sub);
    return res.status(204).end();
  } catch (error) { return next(error); }
}
