import { Router } from 'express';
import { authenticate, authorize, optionalAuthenticate } from '../middleware/auth.js';
import { validateObjectId } from '../middleware/validate.js';
import { applyToJob, createJob, listJobs, updateJob } from '../controllers/jobController.js';

export const jobRoutes = Router();
jobRoutes.get('/', optionalAuthenticate, listJobs);
jobRoutes.post('/', authenticate, authorize('employer', 'admin'), createJob);
jobRoutes.patch('/:id', authenticate, authorize('employer', 'admin'), validateObjectId('id'), updateJob);
jobRoutes.post('/:id/apply', authenticate, authorize('worker'), validateObjectId('id'), applyToJob);
