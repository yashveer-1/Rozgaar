import { Verification } from '../models/Verification.js';
import { notify } from '../services/notificationService.js';
import { notFound } from '../utils/httpError.js';

export async function createVerification(req, res, next) {
  try { return res.status(201).json(await Verification.create({ ...req.body, verifier: req.user.sub })); } catch (error) { return next(error); }
}
export async function listVerifications(req, res, next) {
  try { return res.json(await Verification.find({ verifier: req.user.sub }).populate('worker', 'name').sort('-createdAt')); } catch (error) { return next(error); }
}
export async function decideVerification(req, res, next) {
  try {
    const verification = await Verification.findOneAndUpdate(
      { _id: req.params.id, verifier: req.user.sub, status: 'pending' },
      { status: req.body.status, note: req.body.note },
      { new: true, runValidators: true },
    );
    if (!verification) throw notFound('Verification request');
    await notify(req, verification.worker, {
      type: 'employer_verification', title: `Verification ${verification.status}`,
      message: `Your ${verification.kind} verification was ${verification.status}.`, data: { verificationId: verification.id },
    });
    return res.json(verification);
  } catch (error) { return next(error); }
}
