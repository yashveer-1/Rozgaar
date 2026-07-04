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
    return res.json(rankJobs(profile, jobs));
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
