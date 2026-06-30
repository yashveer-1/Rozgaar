import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import { getMyProfile, getPublicProfile, updateMyProfile } from '../controllers/workerController.js';

export const workerRoutes = Router();
workerRoutes.get('/me', authenticate, authorize('worker'), getMyProfile);
workerRoutes.patch('/me', authenticate, authorize('worker'), updateMyProfile);
workerRoutes.get('/:publicId/public', getPublicProfile);
