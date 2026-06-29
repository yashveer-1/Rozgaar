import mongoose from 'mongoose';

const jobSchema = new mongoose.Schema({
  employer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true }, description: { type: String, required: true },
  skills: [String], location: { city: String, state: String, remote: Boolean },
  pay: { min: Number, max: Number, unit: { type: String, enum: ['day', 'month', 'project'], default: 'month' } },
  type: { type: String, enum: ['full-time', 'part-time', 'contract', 'daily-wage'] },
  experienceYears: Number, status: { type: String, enum: ['draft', 'open', 'closed'], default: 'open' },
}, { timestamps: true });
jobSchema.index({ title: 'text', skills: 'text', 'location.city': 1 });
export const Job = mongoose.model('Job', jobSchema);
