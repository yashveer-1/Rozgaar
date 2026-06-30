import mongoose from 'mongoose';

const governmentSchemeSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true, trim: true },
  description: String,
  eligibility: {
    occupations: [String],
    incomeLimit: Number,
    genders: [String],
    states: [String],
    minimumAge: Number,
    maximumAge: Number,
  },
  benefits: { type: String, required: true },
  documentsRequired: [String],
  officialUrl: { type: String, required: true },
  active: { type: Boolean, default: true },
}, { timestamps: true });

export const GovernmentScheme = mongoose.model('GovernmentScheme', governmentSchemeSchema);
