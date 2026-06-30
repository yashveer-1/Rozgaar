import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import { requireFields, validateObjectId } from '../middleware/validate.js';
import { createIncome, deleteIncome, incomeSummary, listIncome, updateIncome } from '../controllers/incomeController.js';

export const incomeRoutes = Router();
incomeRoutes.use(authenticate, authorize('worker'));
incomeRoutes.get('/', listIncome);
incomeRoutes.get('/summary', incomeSummary);
incomeRoutes.post('/', requireFields('amount', 'date'), createIncome);
incomeRoutes.patch('/:id', validateObjectId('id'), updateIncome);
incomeRoutes.delete('/:id', validateObjectId('id'), deleteIncome);
