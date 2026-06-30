import { Notification } from '../models/Notification.js';
import { notFound } from '../utils/httpError.js';

export async function listNotifications(req, res, next) {
  try { return res.json(await Notification.find({ user: req.user.sub }).sort('-createdAt').limit(100)); } catch (error) { return next(error); }
}
export async function markRead(req, res, next) {
  try {
    const notification = await Notification.findOneAndUpdate({ _id: req.params.id, user: req.user.sub }, { readAt: new Date() }, { new: true });
    if (!notification) throw notFound('Notification');
    return res.json(notification);
  } catch (error) { return next(error); }
}
