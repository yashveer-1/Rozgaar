import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import { downloadPassport, generatePassport, getCreditProfile, downloadCreditProfile } from '../controllers/passportController.js';

export const passportRoutes = Router();
passportRoutes.use(authenticate, authorize('worker'));
passportRoutes.post('/', generatePassport);
passportRoutes.get('/download', downloadPassport);
passportRoutes.get('/credit-profile', getCreditProfile);
passportRoutes.get('/credit-profile/download', downloadCreditProfile);
