import crypto from 'node:crypto';
import { WorkerProfile } from '../models/WorkerProfile.js';
import { calculateProfileCompletion } from '../services/metricsService.js';
import { refreshExistingPassport } from '../services/passportService.js';
import { notFound } from '../utils/httpError.js';

export async function getMyProfile(req, res, next) {
  try {
    let profile = await WorkerProfile.findOne({ user: req.user.sub }).populate('user', 'name email');
    if (!profile) {
      profile = await WorkerProfile.findOneAndUpdate(
        { user: req.user.sub },
        { $setOnInsert: { publicId: `SL-${crypto.randomBytes(5).toString('hex').toUpperCase()}`, profileCompletion: 0 } },
        { new: true, upsert: true, setDefaultsOnInsert: true }
      ).populate('user', 'name email');
    }
    return res.json(profile);
  } catch (error) { return next(error); }
}

export async function updateMyProfile(req, res, next) {
  try {
    const forbidden = ['user', 'profileCompletion', 'publicId', 'aadhaar', 'bank.verified'];
    const update = Object.fromEntries(Object.entries(req.body).filter(([key]) => !forbidden.includes(key)));
    const profile = await WorkerProfile.findOneAndUpdate(
      { user: req.user.sub },
      { $set: update, $setOnInsert: { publicId: `SL-${crypto.randomBytes(5).toString('hex').toUpperCase()}` } },
      { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true },
    );
    profile.profileCompletion = await calculateProfileCompletion(profile);
    await profile.save();
    await refreshExistingPassport(req.user.sub);
    return res.json(profile);
  } catch (error) { return next(error); }
}

export async function getPublicProfile(req, res, next) {
  try {
    const profile = await WorkerProfile.findOne({ publicId: req.params.publicId })
      .select('-bank -upiId -aadhaar -phone -references.phone')
      .populate('user', 'name');
    if (!profile) throw notFound('Passport');
    return res.json(profile);
  } catch (error) { return next(error); }
}
