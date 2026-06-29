import mongoose from 'mongoose';

const workerProfileSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  phone: String, photo: String,
  location: { city: String, district: String, state: String, coordinates: [Number] },
  occupation: String, experienceYears: Number,
  skills: [{ name: String, level: String, verified: Boolean }],
  languages: [String], education: String, upiId: String,
  bank: { accountLast4: String, ifsc: String, verified: Boolean },
  availability: { type: String, enum: ['available', 'open', 'unavailable'], default: 'open' },
  profileCompletion: { type: Number, min: 0, max: 100, default: 10 },
  publicId: { type: String, unique: true, sparse: true },
}, { timestamps: true });
export const WorkerProfile = mongoose.model('WorkerProfile', workerProfileSchema);
