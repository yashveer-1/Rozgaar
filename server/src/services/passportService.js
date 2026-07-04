import crypto from 'node:crypto';
import { GovernmentScheme } from '../models/GovernmentScheme.js';
import { Passport } from '../models/Passport.js';
import { WorkerProfile } from '../models/WorkerProfile.js';
import { recalculateWorkerMetrics } from './metricsService.js';
import { isEligible } from './schemeService.js';

export async function buildWorkerSnapshot(worker) {
  let profile = await WorkerProfile.findOne({ user: worker });
  if (!profile) {
    profile = await WorkerProfile.findOneAndUpdate(
      { user: worker },
      { $setOnInsert: { publicId: `SL-${crypto.randomBytes(5).toString('hex').toUpperCase()}`, profileCompletion: 0 } },
      { new: true, upsert: true, setDefaultsOnInsert: true },
    );
  }
  if (!profile.publicId) {
    profile.publicId = `SL-${crypto.randomBytes(5).toString('hex').toUpperCase()}`;
    await profile.save();
  }

  const [metrics, schemes] = await Promise.all([
    recalculateWorkerMetrics(worker),
    GovernmentScheme.find({ active: true }),
  ]);
  await metrics.profile.populate('user', 'name');
  return {
    profile: metrics.profile,
    income: metrics.income,
    scores: metrics.scores,
    eligibleSchemes: schemes
      .filter(scheme => isEligible(metrics.profile, scheme, metrics.income.monthlyIncome))
      .map(scheme => scheme.name),
  };
}

export async function refreshExistingPassport(worker) {
  const passport = await Passport.findOne({ worker }).select('_id');
  if (!passport) return null;
  const snapshot = await buildWorkerSnapshot(worker);
  return Passport.findByIdAndUpdate(
    passport._id,
    { snapshot, publicId: snapshot.profile.publicId, generatedAt: new Date() },
    { new: true, runValidators: true },
  );
}
