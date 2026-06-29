import mongoose from 'mongoose';

const documentSchema = new mongoose.Schema({
  worker: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, enum: ['upi', 'bank_statement', 'salary_sms', 'certificate', 'id_proof'] },
  url: String, cloudinaryId: String, status: { type: String, enum: ['processing', 'verified', 'rejected'], default: 'processing' },
  extractedData: mongoose.Schema.Types.Mixed,
}, { timestamps: true });

const incomeSchema = new mongoose.Schema({
  worker: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  document: { type: mongoose.Schema.Types.ObjectId, ref: 'Document' },
  amount: Number, transactionDate: Date, employerName: String, upiReference: String,
  verified: { type: Boolean, default: false },
}, { timestamps: true });

const applicationSchema = new mongoose.Schema({
  worker: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  job: { type: mongoose.Schema.Types.ObjectId, ref: 'Job', required: true },
  matchScore: Number, status: { type: String, enum: ['applied','shortlisted','interview','hired','rejected'], default: 'applied' },
}, { timestamps: true });
applicationSchema.index({ worker: 1, job: 1 }, { unique: true });

export const Document = mongoose.model('Document', documentSchema);
export const IncomeRecord = mongoose.model('IncomeRecord', incomeSchema);
export const Application = mongoose.model('Application', applicationSchema);
