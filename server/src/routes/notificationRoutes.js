import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { validateObjectId } from '../middleware/validate.js';
import { listNotifications, markRead } from '../controllers/notificationController.js';

export const notificationRoutes = Router();
notificationRoutes.use(authenticate);
notificationRoutes.get('/', listNotifications);
notificationRoutes.patch('/:id/read', validateObjectId('id'), markRead);
