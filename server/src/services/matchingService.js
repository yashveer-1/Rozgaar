const normalize = value => String(value || '').trim().toLowerCase();

export function scoreJob(profile, job) {
  const workerSkills = new Set((profile?.skills || []).map(skill => normalize(skill.name)));
  const requiredSkills = (job.skills || []).map(normalize).filter(Boolean);
  const skillScore = requiredSkills.length ? requiredSkills.filter(skill => workerSkills.has(skill)).length / requiredSkills.length * 50 : 25;
  const sameCity = normalize(profile?.location?.city) && normalize(profile.location.city) === normalize(job.location?.city);
  const sameState = normalize(profile?.location?.state) && normalize(profile.location.state) === normalize(job.location?.state);
  const locationScore = job.location?.remote || sameCity ? 20 : sameState ? 10 : 0;
  const experienceScore = (profile?.experienceYears || 0) >= (job.experienceYears || 0) ? 15 : Math.max(0, 15 - ((job.experienceYears || 0) - (profile?.experienceYears || 0)) * 5);
  const expected = profile?.expectedMonthlySalary || 0;
  const salaryScore = !expected || job.pay?.unit !== 'month' || (job.pay?.max || 0) >= expected ? 15 : Math.max(0, (job.pay.max / expected) * 15);
  return Math.round(Math.min(100, skillScore + locationScore + experienceScore + salaryScore));
}

export const rankJobs = (profile, jobs) => jobs
  .map(job => ({ ...job.toObject(), matchScore: scoreJob(profile, job) }))
  .sort((a, b) => b.matchScore - a.matchScore);
