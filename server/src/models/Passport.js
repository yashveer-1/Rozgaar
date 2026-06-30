import mongoose from 'mongoose';

const passportSchema = new mongoose.Schema({
  worker: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  publicId: { type: String, required: true, unique: true, index: true },
  snapshot: { type: mongoose.Schema.Types.Mixed, required: true },
  generatedAt: { type: Date, default: Date.now },
}, { timestamps: true });

export const Passport = mongoose.model('Passport', passportSchema);
