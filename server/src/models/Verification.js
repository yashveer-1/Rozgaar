import mongoose from 'mongoose';

const verificationSchema = new mongoose.Schema({
  worker: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  verifier: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  kind: { type: String, enum: ['employment', 'skill', 'document', 'income'], required: true },
  targetId: { type: mongoose.Schema.Types.ObjectId, required: true },
  status: { type: String, enum: ['pending', 'verified', 'rejected'], default: 'pending' },
  note: String,
}, { timestamps: true });

verificationSchema.index({ verifier: 1, status: 1 });
export const Verification = mongoose.model('Verification', verificationSchema);
