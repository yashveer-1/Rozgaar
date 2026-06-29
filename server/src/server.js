import 'dotenv/config';
import http from 'node:http';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { Server } from 'socket.io';
import { connectDB } from './config/db.js';
import { api } from './routes/index.js';

const app = express();
const server = http.createServer(app);
const allowedOrigin = process.env.CLIENT_URL || 'http://localhost:5173';
const io = new Server(server, { cors: { origin: allowedOrigin, credentials: true } });

app.use(helmet());
app.use(cors({ origin: allowedOrigin, credentials: true }));
app.use(express.json({ limit: '1mb' }));
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use('/api', rateLimit({ windowMs: 15 * 60_000, limit: 300 }), api);
app.get('/health', (_req, res) => res.json({ status: 'ok', service: 'shramik-lens-api' }));
app.use((req, res) => res.status(404).json({ message: `Route ${req.method} ${req.path} not found` }));
app.use((error, _req, res, _next) => {
  console.error(error);
  if (error.code === 11000) return res.status(409).json({ message: 'Record already exists' });
  return res.status(error.status || 500).json({ message: process.env.NODE_ENV === 'production' ? 'Something went wrong' : error.message });
});

io.on('connection', socket => {
  socket.on('authenticate', userId => userId && socket.join(`user:${userId}`));
});
app.set('io', io);

const port = process.env.PORT || 5000;
connectDB().then(() => server.listen(port, () => console.log(`API listening on ${port}`))).catch(error => {
  console.error('Database connection failed', error);
  process.exit(1);
});
