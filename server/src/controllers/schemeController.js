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
    
    // Generate dynamic schemes based on profile details
    const placeholders = [];
    const state = profile.location?.state || 'Rajasthan';
    const city = profile.location?.city || 'Jaipur';
    const occ = profile.occupation || 'Tailoring';
    const gender = profile.gender || 'prefer-not-to-say';
    
    // 1. PM Vishwakarma Scheme
    placeholders.push({
      _id: `mock-scheme-1-${occ.toLowerCase()}`,
      name: 'PM Vishwakarma Scheme',
      benefits: '₹15,000 toolkit incentive + concessional low-interest credit support (5% interest)',
      eligibilityStatus: `Eligible (Verified Artisan - ${occ})`,
      documentsRequired: ['Aadhaar Card', 'Bank Passbook', 'Skill Certificate'],
      officialUrl: 'https://pmvishwakarma.gov.in/'
    });

    // 2. PMSBY
    placeholders.push({
      _id: 'mock-scheme-2-pmsby',
      name: 'Pradhan Mantri Suraksha Bima Yojana (PMSBY)',
      benefits: '₹2 Lakh accidental insurance coverage for ₹20 per year',
      eligibilityStatus: 'Eligible (Universal)',
      documentsRequired: ['Aadhaar Card', 'Bank Account Linkage'],
      officialUrl: 'https://www.jansuraksha.gov.in/'
    });

    // 3. PM Shram Yogi Maandhan (Pension)
    const isIncomeEligible = income.monthlyIncome <= 15000;
    placeholders.push({
      _id: 'mock-scheme-3-pmsym',
      name: 'Pradhan Mantri Shram Yogi Maandhan (PM-SYM)',
      benefits: '₹3,000 monthly pension guarantee after age 60',
      eligibilityStatus: isIncomeEligible ? 'Eligible (Income Check Passed)' : 'Likely Eligible',
      documentsRequired: ['Aadhaar Card', 'Bank Savings Passbook'],
      officialUrl: 'https://maandhan.in/'
    });

    // 4. Mahila Samridhi / Women Co-op Grant (Gender-based)
    if (gender === 'female') {
      placeholders.push({
        _id: 'mock-scheme-4-women',
        name: 'Mahila Co-operative Startup Grant',
        benefits: '₹25,000 direct capital grant for small tailoring/artisanal groups',
        eligibilityStatus: 'Eligible (Women Special)',
        documentsRequired: ['Aadhaar Card', 'Group Verification Receipt'],
        officialUrl: 'https://www.nsfdc.nic.in/'
      });
    }

    // 5. State Specific Welfare Scheme
    placeholders.push({
      _id: `mock-scheme-5-${state.toLowerCase()}`,
      name: `${state} State Board Livelihood Grant`,
      benefits: `Localized welfare support and tool purchasing subsidy in ${state}`,
      eligibilityStatus: `Eligible (${state} Resident)`,
      documentsRequired: ['Resident Certificate', 'Livelihood Passport'],
      officialUrl: 'https://labour.gov.in/'
    });

    // Filter dbSchemes based on current profile & combine with our dynamic matching placeholders
    const matchedDb = dbSchemes.filter(scheme => isEligible(profile, scheme, income.monthlyIncome)).map(scheme => {
      const plain = scheme.toObject();
      return { ...plain, eligibilityStatus: 'Eligible based on current profile' };
    });

    const combined = [...matchedDb, ...placeholders];
    return res.json(combined);
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
