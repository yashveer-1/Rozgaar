import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import { downloadPassport, generatePassport } from '../controllers/passportController.js';

export const passportRoutes = Router();
passportRoutes.use(authenticate, authorize('worker'));
passportRoutes.post('/', generatePassport);
passportRoutes.get('/download', downloadPassport);
