import crypto from 'node:crypto';
import { Passport } from '../models/Passport.js';
import { WorkerProfile } from '../models/WorkerProfile.js';
import { GovernmentScheme } from '../models/GovernmentScheme.js';
import { calculateScores, getIncomeMetrics } from '../services/metricsService.js';
import { isEligible } from '../services/schemeService.js';
import { notify } from '../services/notificationService.js';
import { notFound } from '../utils/httpError.js';

const escapePdf = value => String(value ?? '').replaceAll('\\', '\\\\').replaceAll('(', '\\(').replaceAll(')', '\\)');
function simplePdf(lines) {
  const content = `BT /F1 12 Tf 50 780 Td 16 TL ${lines.map((line, index) => `${index ? 'T* ' : ''}(${escapePdf(line)}) Tj`).join(' ')} ET`;
  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 5 0 R >> >> /Contents 4 0 R >>',
    `<< /Length ${Buffer.byteLength(content)} >>\nstream\n${content}\nendstream`,
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
  ];
  let body = '%PDF-1.4\n';
  const offsets = [0];
  objects.forEach((object, index) => { offsets.push(Buffer.byteLength(body)); body += `${index + 1} 0 obj\n${object}\nendobj\n`; });
  const xref = Buffer.byteLength(body);
  body += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n${offsets.slice(1).map(offset => `${String(offset).padStart(10, '0')} 00000 n `).join('\n')}\ntrailer << /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
  return Buffer.from(body);
}

async function buildSnapshot(worker) {
  let profile = await WorkerProfile.findOne({ user: worker }).populate('user', 'name');
  if (!profile) {
    profile = await WorkerProfile.findOneAndUpdate(
      { user: worker },
      { $setOnInsert: { publicId: `SL-${crypto.randomBytes(5).toString('hex').toUpperCase()}`, profileCompletion: 0 } },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    ).populate('user', 'name');
  }
  const [income, schemes] = await Promise.all([getIncomeMetrics(worker), GovernmentScheme.find({ active: true })]);
  const scores = await calculateScores(profile, income);
  return { profile, income, scores, eligibleSchemes: schemes.filter(scheme => isEligible(profile, scheme, income.monthlyIncome)).map(scheme => scheme.name) };
}

export async function generatePassport(req, res, next) {
  try {
    const snapshot = await buildSnapshot(req.user.sub);
    const publicId = snapshot.profile.publicId || `SL-${crypto.randomBytes(5).toString('hex').toUpperCase()}`;
    snapshot.profile.publicId = publicId;
    await snapshot.profile.save();
    const passport = await Passport.findOneAndUpdate({ worker: req.user.sub }, { publicId, snapshot, generatedAt: new Date() }, { new: true, upsert: true });
    await notify(req, req.user.sub, { type: 'passport_generated', title: 'Passport generated', message: 'Your livelihood passport is ready.', data: { publicId } });
    return res.status(201).json({ ...passport.toObject(), publicUrl: `/public/passport/${publicId}` });
  } catch (error) { return next(error); }
}
export async function downloadPassport(req, res, next) {
  try {
    const snapshot = await buildSnapshot(req.user.sub);
    const lines = [
      'SHRAMIK LENS - LIVELIHOOD PASSPORT', `Name: ${snapshot.profile.user.name}`,
      `Occupation: ${snapshot.profile.occupation || 'Not provided'}`, `Experience: ${snapshot.profile.experienceYears || 0} years`,
      `Monthly income: INR ${snapshot.income.monthlyIncome}`, `Financial readiness: ${snapshot.scores.financialReadiness.score}/100`,
      `Trust score: ${snapshot.scores.trust.score}/100`, `Skills: ${(snapshot.profile.skills || []).filter(skill => skill.verified).map(skill => skill.name).join(', ') || 'None verified'}`,
      `Public verification: /public/passport/${snapshot.profile.publicId || ''}`,
    ];
    const pdf = simplePdf(lines);
    res.set({ 'Content-Type': 'application/pdf', 'Content-Disposition': 'attachment; filename=\"livelihood-passport.pdf\"' });
    return res.send(pdf);
  } catch (error) { return next(error); }
}
export async function publicPassport(req, res, next) {
  try {
    const passport = await Passport.findOne({ publicId: req.params.publicId }).select('-snapshot.profile.bank -snapshot.profile.upiId -snapshot.profile.aadhaar');
    if (!passport) throw notFound('Passport');
    return res.json(passport);
  } catch (error) { return next(error); }
}
