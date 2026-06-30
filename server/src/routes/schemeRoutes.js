import { Router } from 'express';
import { authenticate, authorize, optionalAuthenticate } from '../middleware/auth.js';
import { validateObjectId } from '../middleware/validate.js';
import { createScheme, deleteScheme, listEligibleSchemes, updateScheme } from '../controllers/schemeController.js';

export const schemeRoutes = Router();
schemeRoutes.get('/', optionalAuthenticate, listEligibleSchemes);
schemeRoutes.post('/', authenticate, authorize('admin'), createScheme);
schemeRoutes.patch('/:id', authenticate, authorize('admin'), validateObjectId('id'), updateScheme);
schemeRoutes.delete('/:id', authenticate, authorize('admin'), validateObjectId('id'), deleteScheme);
