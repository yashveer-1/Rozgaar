import { Router } from 'express';
import multer from 'multer';
import { authenticate, authorize } from '../middleware/auth.js';
import { validateObjectId } from '../middleware/validate.js';
import { deleteDocument, listDocuments, uploadAndExtract } from '../controllers/documentController.js';
import { HttpError } from '../utils/httpError.js';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, callback) => {
    const allowed = ['image/png', 'image/jpeg', 'image/webp', 'application/pdf'];
    callback(allowed.includes(file.mimetype) ? null : new HttpError(400, 'Only PNG, JPG, WEBP and PDF files are accepted'), allowed.includes(file.mimetype));
  },
});
export const documentRoutes = Router();
documentRoutes.use(authenticate, authorize('worker'));
documentRoutes.get('/', listDocuments);
documentRoutes.post('/', upload.single('document'), uploadAndExtract);
documentRoutes.delete('/:id', validateObjectId('id'), deleteDocument);
