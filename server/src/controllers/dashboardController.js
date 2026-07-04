import crypto from 'node:crypto';
import { WorkerProfile } from '../models/WorkerProfile.js';
import { Job } from '../models/Job.js';
import { Document } from '../models/Record.js';
import { GovernmentScheme } from '../models/GovernmentScheme.js';
import { Notification } from '../models/Notification.js';
import { recalculateWorkerMetrics } from '../services/metricsService.js';
import { rankJobs } from '../services/matchingService.js';
import { isEligible } from '../services/schemeService.js';

function nextActions(profile, income, eligibleSchemes, documentCount) {
  const actions = [];
  if (!profile?.education) actions.push({ title: 'Add education details', text: 'Improve your profile completion', type: 'profile' });
  if (!profile?.bank?.verified) actions.push({ title: 'Verify bank details', text: 'Strengthen financial readiness', type: 'profile' });
  if (!documentCount) actions.push({ title: 'Upload payment proof', text: 'Start building verified income history', type: 'document' });
  if (!income.monthlyIncome && documentCount) actions.push({ title: 'Review extracted income', text: 'Keep income insights current', type: 'income' });
  if (eligibleSchemes[0]) actions.push({ title: `Explore ${eligibleSchemes[0].name}`, text: 'You match its current eligibility rules', type: 'scheme' });
  if (!profile?.skills?.length) actions.push({ title: 'Add your skills', text: 'Unlock relevant job matches', type: 'profile' });
  return actions.slice(0, 3);
}

export async function getDashboard(req, res, next) {
  try {
    const worker = req.user.sub;
    let profile = await WorkerProfile.findOne({ user: worker });
    if (!profile) {
      profile = await WorkerProfile.findOneAndUpdate(
        { user: worker },
        { $setOnInsert: { publicId: `SL-${crypto.randomBytes(5).toString('hex').toUpperCase()}`, profileCompletion: 0 } },
        { new: true, upsert: true, setDefaultsOnInsert: true }
      );
    }
    const metrics = await recalculateWorkerMetrics(worker);
    profile = metrics.profile;
    const income = metrics.income;
    const [scores, jobs, schemes, notifications, documentCount] = await Promise.all([
      Promise.resolve(metrics.scores),
      Job.find({ status: 'open' }).populate('employer', 'name').sort('-createdAt').limit(100),
      GovernmentScheme.find({ active: true }),
      Notification.find({ user: worker }).sort('-createdAt').limit(10),
      Document.countDocuments({ worker }),
    ]);
    const jobMatches = rankJobs(profile, jobs).slice(0, 6);
    const eligibleSchemes = profile ? schemes.filter(scheme => isEligible(profile, scheme, income.monthlyIncome)) : [];
    return res.json({
      profile,
      monthlyIncome: income.monthlyIncome,
      sixMonthTotal: income.sixMonthTotal,
      incomeGrowthPercentage: income.growthPercentage,
      incomeGraph: income.graph,
      financialReadiness: scores.financialReadiness,
      trust: scores.trust,
      verifiedDocuments: scores.counts?.verifiedDocuments || 0,
      jobMatches,
      governmentSchemes: eligibleSchemes,
      nextBestActions: nextActions(profile, income, eligibleSchemes, documentCount),
      notifications,
      unreadNotifications: notifications.filter(item => !item.readAt).length,
      profileCompletion: profile?.profileCompletion || 0,
    });
  } catch (error) { return next(error); }
}
