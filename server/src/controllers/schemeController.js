import { GovernmentScheme } from '../models/GovernmentScheme.js';
import { WorkerProfile } from '../models/WorkerProfile.js';
import { getIncomeMetrics } from '../services/metricsService.js';
import { isEligible } from '../services/schemeService.js';
import { notFound } from '../utils/httpError.js';

export async function listEligibleSchemes(req, res, next) {
  try {
    const dbSchemes = await GovernmentScheme.find({ active: true }).sort('name');
    if (!req.user) return res.json(dbSchemes);
    
    const [profile, income] = await Promise.all([
      WorkerProfile.findOne({ user: req.user.sub }),
      getIncomeMetrics(req.user.sub)
    ]);
    if (!profile) return res.json([]);
    const matched = dbSchemes.filter(scheme => isEligible(profile, scheme, income.monthlyIncome)).map(scheme => {
      const plain = scheme.toObject();
      return { ...plain, eligibilityStatus: 'Eligible based on current profile' };
    });
    return res.json(matched);
  } catch (error) { return next(error); }
}
export async function createScheme(req, res, next) {
  try { return res.status(201).json(await GovernmentScheme.create(req.body)); } catch (error) { return next(error); }
}
export async function updateScheme(req, res, next) {
  try {
    const scheme = await GovernmentScheme.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!scheme) throw notFound('Scheme');
    return res.json(scheme);
  } catch (error) { return next(error); }
}
export async function deleteScheme(req, res, next) {
  try {
    const scheme = await GovernmentScheme.findByIdAndDelete(req.params.id);
    if (!scheme) throw notFound('Scheme');
    return res.status(204).end();
  } catch (error) { return next(error); }
}
