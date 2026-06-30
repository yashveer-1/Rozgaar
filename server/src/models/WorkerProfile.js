import mongoose from 'mongoose';

const workerProfileSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  phone: String, photo: String,
  gender: { type: String, enum: ['female', 'male', 'non-binary', 'prefer-not-to-say'] },
  dateOfBirth: Date,
  location: { city: String, district: String, state: String, coordinates: [Number] },
  occupation: String, experienceYears: { type: Number, min: 0, max: 80 },
  skills: [{ name: String, level: { type: String, enum: ['beginner', 'proficient', 'advanced', 'expert'], default: 'proficient' }, verified: { type: Boolean, default: false } }],
  languages: [String], education: String, upiId: String,
  bank: { accountLast4: String, ifsc: String, verified: Boolean },
  aadhaar: { last4: String, verified: { type: Boolean, default: false } },
  employmentHistory: [{
    employer: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    employerName: String, title: String, startDate: Date, endDate: Date,
    verified: { type: Boolean, default: false },
  }],
  references: [{ name: String, phone: String, verified: { type: Boolean, default: false } }],
  expectedMonthlySalary: { type: Number, min: 0 },
  availability: { type: String, enum: ['available', 'open', 'unavailable'], default: 'open' },
  profileCompletion: { type: Number, min: 0, max: 100, default: 0 },
  publicId: { type: String, unique: true, sparse: true },
}, { timestamps: true });
workerProfileSchema.index({ occupation: 1, 'location.state': 1, 'skills.name': 1 });
export const WorkerProfile = mongoose.model('WorkerProfile', workerProfileSchema);
