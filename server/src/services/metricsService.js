import { Document, IncomeRecord } from '../models/Record.js';
import { WorkerProfile } from '../models/WorkerProfile.js';

const round = value => Math.round(Number.isFinite(value) ? value : 0);
const hasText = value => typeof value === 'string' && value.trim().length > 0;

export async function calculateProfileCompletion(profile) {
  if (!profile) return 0;
  const documentCount = await Document.countDocuments({ worker: profile.user, status: 'verified' });
  const score =
    (hasText(profile.photo) ? 10 : 0)
    + (hasText(profile.occupation) ? 10 : 0)
    + (profile.skills?.length ? 10 : 0)
    + (profile.experienceYears > 0 || profile.employmentHistory?.length ? 10 : 0)
    + (hasText(profile.education) ? 10 : 0)
    + (documentCount ? 20 : 0)
    + (profile.bank?.accountLast4 && profile.bank?.ifsc ? 10 : 0)
    + (profile.location?.city && profile.location?.state ? 10 : 0)
    + (profile.languages?.length ? 10 : 0);
  return Math.min(100, score);
}

export function sixMonthRange(now = new Date()) {
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const start = new Date(now.getFullYear(), now.getMonth() - 5, 1);
  return { start, end };
}

export async function getIncomeMetrics(worker, now = new Date()) {
  const { start, end } = sixMonthRange(now);
  const rows = await IncomeRecord.aggregate([
    { $match: { worker, date: { $gte: start, $lt: end } } },
    { $group: { _id: { year: { $year: '$date' }, month: { $month: '$date' } }, income: { $sum: '$amount' }, verifiedIncome: { $sum: { $cond: ['$verified', '$amount', 0] } }, transactions: { $sum: 1 } } },
  ]);
  const byMonth = new Map(rows.map(row => [`${row._id.year}-${row._id.month}`, row]));
  const graph = Array.from({ length: 6 }, (_, index) => {
    const date = new Date(now.getFullYear(), now.getMonth() - 5 + index, 1);
    const row = byMonth.get(`${date.getFullYear()}-${date.getMonth() + 1}`);
    return { month: date.toLocaleString('en-IN', { month: 'short' }), year: date.getFullYear(), income: row?.income || 0, verifiedIncome: row?.verifiedIncome || 0, transactions: row?.transactions || 0 };
  });
  const current = graph.at(-1)?.income || 0;
  const previous = graph.at(-2)?.income || 0;
  const growthPercentage = previous ? round(((current - previous) / previous) * 100) : current ? 100 : 0;
  return { monthlyIncome: current, sixMonthTotal: graph.reduce((sum, item) => sum + item.income, 0), growthPercentage, graph };
}

export async function calculateScores(profile, incomeMetrics) {
  if (!profile) return { financialReadiness: { score: 0, category: 'Poor' }, trust: { score: 0, badge: 'Building' } };
  const [verifiedDocuments, verifiedTransactions, verifiedEmployers] = await Promise.all([
    Document.countDocuments({ worker: profile.user, status: 'verified' }),
    IncomeRecord.countDocuments({ worker: profile.user, verified: true }),
    IncomeRecord.distinct('employer', { worker: profile.user, verified: true, employer: { $ne: null } }),
  ]);
  const incomes = incomeMetrics.graph.map(item => item.income);
  const mean = incomes.reduce((sum, value) => sum + value, 0) / (incomes.length || 1);
  const deviation = incomes.length ? Math.sqrt(incomes.reduce((sum, value) => sum + (value - mean) ** 2, 0) / incomes.length) : 0;
  const consistency = mean ? Math.max(0, 1 - deviation / mean) : 0;
  const employment = profile.employmentHistory?.filter(item => item.verified).length || 0;
  const readinessScore = round(
    consistency * 30
    + Math.min(verifiedEmployers.length / 3, 1) * 20
    + Math.min(verifiedDocuments / 5, 1) * 15
    + Math.min(employment / 3, 1) * 15
    + Math.min(verifiedTransactions / 6, 1) * 20,
  );
  const category = readinessScore >= 80 ? 'Excellent' : readinessScore >= 60 ? 'Good' : readinessScore >= 35 ? 'Fair' : 'Poor';
  const verifiedSkills = profile.skills?.filter(skill => skill.verified).length || 0;
  const references = profile.references?.filter(reference => reference.verified).length || 0;
  const trustScore = round(
    Math.min(verifiedEmployers.length / 3, 1) * 25
    + Math.min(verifiedDocuments / 5, 1) * 20
    + Math.min(verifiedTransactions / 6, 1) * 20
    + (profile.profileCompletion || 0) * 0.15
    + Math.min(verifiedSkills / 3, 1) * 10
    + Math.min(references / 2, 1) * 10,
  );
  const badge = trustScore >= 80 ? 'Excellent' : trustScore >= 60 ? 'Strong' : trustScore >= 35 ? 'Growing' : 'Building';
  return { financialReadiness: { score: readinessScore, category }, trust: { score: trustScore, badge }, counts: { verifiedDocuments, verifiedTransactions, verifiedEmployers: verifiedEmployers.length } };
}

export async function recalculateWorkerMetrics(worker) {
  const profile = await WorkerProfile.findOne({ user: worker });
  if (!profile) return null;

  const profileCompletion = await calculateProfileCompletion(profile);
  if (profile.profileCompletion !== profileCompletion) {
    profile.profileCompletion = profileCompletion;
    await profile.save();
  }

  const income = await getIncomeMetrics(profile.user);
  const scores = await calculateScores(profile, income);
  return { profile, income, scores };
}
