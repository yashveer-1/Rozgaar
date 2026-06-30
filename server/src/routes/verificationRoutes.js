import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import { validateObjectId } from '../middleware/validate.js';
import { createVerification, decideVerification, listVerifications } from '../controllers/verificationController.js';

export const verificationRoutes = Router();
verificationRoutes.use(authenticate, authorize('employer', 'admin'));
verificationRoutes.get('/', listVerifications);
verificationRoutes.post('/', createVerification);
verificationRoutes.patch('/:id', validateObjectId('id'), decideVerification);
