const norm = value => String(value || '').trim().toLowerCase();

export function ageFromDate(date) {
  if (!date) return null;
  return Math.floor((Date.now() - new Date(date).getTime()) / 31_557_600_000);
}

export function isEligible(profile, scheme, monthlyIncome = 0) {
  const rules = scheme.eligibility || {};
  const age = ageFromDate(profile?.dateOfBirth);
  const checks = [
    !rules.occupations?.length || rules.occupations.map(norm).includes(norm(profile?.occupation)),
    !rules.genders?.length || rules.genders.map(norm).includes(norm(profile?.gender)),
    !rules.states?.length || rules.states.map(norm).includes(norm(profile?.location?.state)),
    !rules.incomeLimit || monthlyIncome * 12 <= rules.incomeLimit,
    !rules.minimumAge || age === null || age >= rules.minimumAge,
    !rules.maximumAge || age === null || age <= rules.maximumAge,
  ];
  return checks.every(Boolean);
}
