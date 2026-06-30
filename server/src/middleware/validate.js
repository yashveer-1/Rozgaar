import mongoose from 'mongoose';
import { HttpError } from '../utils/httpError.js';

export const requireFields = (...fields) => (req, _res, next) => {
  const missing = fields.filter(field => req.body?.[field] === undefined || req.body?.[field] === '');
  return missing.length ? next(new HttpError(400, `Required fields: ${missing.join(', ')}`)) : next();
};

export const validateObjectId = parameter => (req, _res, next) =>
  mongoose.isValidObjectId(req.params[parameter])
    ? next()
    : next(new HttpError(400, `Invalid ${parameter}`));
