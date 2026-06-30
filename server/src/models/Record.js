import mongoose from 'mongoose';

const documentSchema = new mongoose.Schema({
  worker: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: String,
  type: { type: String, enum: ['upi', 'bank_statement', 'salary_slip', 'payment_receipt', 'salary_sms', 'certificate', 'id_proof'] },
  url: { type: String, required: true }, cloudinaryId: String,
  status: { type: String, enum: ['processing', 'verified', 'rejected'], default: 'processing' },
  extractedData: mongoose.Schema.Types.Mixed,
  verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

const incomeSchema = new mongoose.Schema({
  worker: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  sourceDocument: { type: mongoose.Schema.Types.ObjectId, ref: 'Document' },
  amount: { type: Number, required: true, min: 0 }, date: { type: Date, required: true },
  employer: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, employerName: String,
  paymentMethod: { type: String, enum: ['upi', 'cash', 'bank_transfer', 'cheque', 'other'], default: 'other' },
  referenceNumber: String,
  verified: { type: Boolean, default: false },
}, { timestamps: true });
incomeSchema.index({ worker: 1, date: -1 });

const applicationSchema = new mongoose.Schema({
  worker: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  job: { type: mongoose.Schema.Types.ObjectId, ref: 'Job', required: true },
  matchScore: Number, status: { type: String, enum: ['applied','shortlisted','interview','hired','rejected'], default: 'applied' },
}, { timestamps: true });
applicationSchema.index({ worker: 1, job: 1 }, { unique: true });

export const Document = mongoose.model('Document', documentSchema);
export const IncomeRecord = mongoose.model('IncomeRecord', incomeSchema);
export const Application = mongoose.model('Application', applicationSchema);
