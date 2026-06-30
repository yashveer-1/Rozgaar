import mongoose from 'mongoose';

mongoose.set('bufferCommands', false);

export async function connectDB() {
  if (!process.env.MONGODB_URI) {
    throw new Error('MONGODB_URI is not set. Copy server/.env.example to server/.env and add your MongoDB Atlas password.');
  }
  if (process.env.MONGODB_URI.includes('<db_password>')) {
    throw new Error('MONGODB_URI still contains <db_password>. Replace it with the password for your MongoDB Atlas database user.');
  }
  await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 10_000 });
  console.log('MongoDB connected');
}
