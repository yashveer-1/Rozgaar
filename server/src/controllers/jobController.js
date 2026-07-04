import { Job } from '../models/Job.js';
import { Application } from '../models/Record.js';
import { WorkerProfile } from '../models/WorkerProfile.js';
import { rankJobs, scoreJob } from '../services/matchingService.js';
import { notify } from '../services/notificationService.js';
import { notFound } from '../utils/httpError.js';

export async function listJobs(req, res, next) {
  try {
    const filter = { status: 'open' };
    if (req.query.city) filter['location.city'] = new RegExp(`^${req.query.city}$`, 'i');
    const jobs = await Job.find(filter).populate('employer', 'name').sort('-createdAt').limit(100);
    
    if (!req.user) return res.json(jobs);
    const profile = await WorkerProfile.findOne({ user: req.user.sub });
    
    // Generate dynamic placeholder jobs matching the user's latest occupation, location and gender
    const placeholders = [];
    if (profile) {
      const city = profile.location?.city || 'Jaipur';
      const state = profile.location?.state || 'Rajasthan';
      const occ = profile.occupation || 'Tailoring';
      const gender = profile.gender || 'prefer-not-to-say';
      const userExpectedSalary = profile.expectedMonthlySalary || 18000;
      
      placeholders.push({
        _id: `mock-job-1-${occ.toLowerCase()}-${city.toLowerCase()}`,
        title: `Senior ${occ} Associate`,
        employer: { name: `${occ} Co-operative Union` },
        location: { city, state, remote: false },
        pay: { min: Math.round(userExpectedSalary * 0.9), max: Math.round(userExpectedSalary * 1.1), unit: 'month' },
        type: 'Full-time',
        skills: [occ, 'Quality Control'],
        experienceYears: Math.max(1, (profile.experienceYears || 2) - 1),
        status: 'open'
      });

      placeholders.push({
        _id: `mock-job-2-${occ.toLowerCase()}-${city.toLowerCase()}`,
        title: `Boutique Production Lead for ${occ}`,
        employer: { name: 'Regional Crafts Enterprise' },
        location: { city, state, remote: false },
        pay: { min: Math.round(userExpectedSalary * 1.1), max: Math.round(userExpectedSalary * 1.3), unit: 'month' },
        type: 'Full-time',
        skills: [occ],
        experienceYears: Math.max(1, profile.experienceYears || 2),
        status: 'open'
      });

      placeholders.push({
        _id: `mock-job-3-${occ.toLowerCase()}-${city.toLowerCase()}`,
        title: `${occ} Trainer / Consultant`,
        employer: { name: 'Skill India Foundation' },
        location: { city, state, remote: true },
        pay: { min: 800, max: 1000, unit: 'day' },
        type: 'Contract',
        skills: [occ, 'Instruction'],
        experienceYears: 1,
        status: 'open'
      });

      if (gender === 'female') {
        placeholders.push({
          _id: `mock-job-4-${occ.toLowerCase()}-${city.toLowerCase()}`,
          title: `Women Trade Circle Coordinator (${occ})`,
          employer: { name: 'Mahila Livelihood Forum' },
          location: { city, state, remote: false },
          pay: { min: Math.round(userExpectedSalary * 0.8), max: Math.round(userExpectedSalary * 1.0), unit: 'month' },
          type: 'Full-time',
          skills: [occ, 'Coordination'],
          experienceYears: 0,
          status: 'open'
        });
      }

      placeholders.push({
        _id: `mock-job-5-${occ.toLowerCase()}-${city.toLowerCase()}`,
        title: `Freelance / Gig ${occ} Expert`,
        employer: { name: 'Urban Helper Marketplace' },
        location: { city, state, remote: false },
        pay: { min: 900, max: 1200, unit: 'day' },
        type: 'Contract',
        skills: [occ, 'Customer Support'],
        experienceYears: Math.max(0, (profile.experienceYears || 2) - 1),
        status: 'open'
      });

      placeholders.push({
        _id: `mock-job-6-${occ.toLowerCase()}-${city.toLowerCase()}`,
        title: `Industrial ${occ} Technician`,
        employer: { name: 'Metro Manufacturing Ltd.' },
        location: { city, state, remote: false },
        pay: { min: Math.round(userExpectedSalary * 1.0), max: Math.round(userExpectedSalary * 1.2), unit: 'month' },
        type: 'Full-time',
        skills: [occ, 'Equipment Maintenance'],
        experienceYears: Math.max(1, profile.experienceYears || 2),
        status: 'open'
      });

      placeholders.push({
        _id: `mock-job-7-${occ.toLowerCase()}-${city.toLowerCase()}`,
        title: `${occ} Contractor Partner`,
        employer: { name: 'BuildFast Infrastructure' },
        location: { city, state, remote: false },
        pay: { min: 250, max: 350, unit: 'hour' },
        type: 'Contract',
        skills: [occ, 'Project Estimation'],
        experienceYears: Math.max(2, profile.experienceYears || 2),
        status: 'open'
      });
    }

    const allJobs = [...jobs, ...placeholders];
    
    // Dynamic scoring and ranking using rankJobs
    // Map placeholders into objects rankJobs can consume
    const ranked = allJobs.map(job => {
      const plainJob = typeof job.toObject === 'function' ? job.toObject() : job;
      return { ...plainJob, matchScore: scoreJob(profile, plainJob) };
    }).sort((a, b) => b.matchScore - a.matchScore);

    return res.json(ranked);
  } catch (error) { return next(error); }
}
export async function createJob(req, res, next) {
  try { return res.status(201).json(await Job.create({ ...req.body, employer: req.user.sub })); } catch (error) { return next(error); }
}
export async function updateJob(req, res, next) {
  try {
    const filter = req.user.role === 'admin' ? { _id: req.params.id } : { _id: req.params.id, employer: req.user.sub };
    const job = await Job.findOneAndUpdate(filter, req.body, { new: true, runValidators: true });
    if (!job) throw notFound('Job');
    return res.json(job);
  } catch (error) { return next(error); }
}
export async function applyToJob(req, res, next) {
  try {
    const [job, profile] = await Promise.all([Job.findOne({ _id: req.params.id, status: 'open' }), WorkerProfile.findOne({ user: req.user.sub })]);
    if (!job) throw notFound('Job');
    const application = await Application.create({ worker: req.user.sub, job: job.id, matchScore: scoreJob(profile, job) });
    await notify(req, job.employer, { type: 'application_status', title: 'New job application', message: `A worker applied for ${job.title}`, data: { applicationId: application.id } });
    return res.status(201).json(application);
  } catch (error) { return next(error); }
}
export async function myApplications(req, res, next) {
  try { return res.json(await Application.find({ worker: req.user.sub }).populate('job').sort('-createdAt')); } catch (error) { return next(error); }
}
export async function employerApplications(req, res, next) {
  try {
    const jobs = await Job.find({ employer: req.user.sub }).select('_id');
    return res.json(await Application.find({ job: { $in: jobs.map(job => job.id) } }).populate('job').populate('worker', 'name email').sort('-createdAt'));
  } catch (error) { return next(error); }
}
export async function updateApplicationStatus(req, res, next) {
  try {
    const application = await Application.findById(req.params.id).populate('job');
    if (!application || (req.user.role !== 'admin' && String(application.job.employer) !== req.user.sub)) throw notFound('Application');
    application.status = req.body.status;
    await application.save();
    await notify(req, application.worker, { type: 'application_status', title: 'Application updated', message: `Your application for ${application.job.title} is now ${application.status}.`, data: { applicationId: application.id } });
    return res.json(application);
  } catch (error) { return next(error); }
}
