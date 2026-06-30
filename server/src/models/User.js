import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Please enter a valid email address'],
  },
  password: { type: String, required: true, minlength: 8, maxlength: 128, select: false },
  role: { type: String, enum: ['worker', 'employer', 'admin'], default: 'worker' },
  refreshTokens: [{ token: String, expiresAt: Date }],
}, { timestamps: true });

userSchema.pre('save', async function next() {
  if (this.isModified('password')) this.password = await bcrypt.hash(this.password, 12);
});
userSchema.methods.comparePassword = function comparePassword(value) { return bcrypt.compare(value, this.password); };
export const User = mongoose.model('User', userSchema);
