import { Router } from 'express';
import { register, login, refresh, logout } from '../controllers/authController.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { askGemini } from '../services/aiService.js';
import { WorkerProfile } from '../models/WorkerProfile.js';
import { getDashboard } from '../controllers/dashboardController.js';
import { employerApplications, myApplications, updateApplicationStatus } from '../controllers/jobController.js';
import { publicPassport } from '../controllers/passportController.js';
import { workerRoutes } from './workerRoutes.js';
import { incomeRoutes } from './incomeRoutes.js';
import { documentRoutes } from './documentRoutes.js';
import { jobRoutes } from './jobRoutes.js';
import { schemeRoutes } from './schemeRoutes.js';
import { notificationRoutes } from './notificationRoutes.js';
import { passportRoutes } from './passportRoutes.js';
import { verificationRoutes } from './verificationRoutes.js';

export const api = Router();
api.post('/auth/register', register);
api.post('/auth/login', login);
api.post('/auth/refresh', refresh);
api.post('/auth/logout', logout);

api.use('/workers', workerRoutes);
api.use('/income', incomeRoutes);
api.use('/documents', documentRoutes);
api.use('/jobs', jobRoutes);
api.use('/schemes', schemeRoutes);
api.use('/notifications', notificationRoutes);
api.use('/passport', passportRoutes);
api.use('/verification', verificationRoutes);

api.get('/dashboard', authenticate, authorize('worker'), getDashboard);
api.get('/applications/me', authenticate, authorize('worker'), myApplications);
api.get('/employer/applications', authenticate, authorize('employer', 'admin'), employerApplications);
api.patch('/employer/applications/:id', authenticate, authorize('employer', 'admin'), updateApplicationStatus);
api.get('/public/passport/:publicId', publicPassport);
api.post('/ai/:task', authenticate, async (req, res, next) => {
  try {
    const profile = await WorkerProfile.findOne({ user: req.user.sub }).lean();
    return res.json(await askGemini(req.params.task, { profile, context: req.body }));
  } catch (error) { return next(error); }
});
