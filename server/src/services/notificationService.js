import { Notification } from '../models/Notification.js';

export async function notify(req, user, payload) {
  const notification = await Notification.create({ user, ...payload });
  req.app.get('io')?.to(`user:${user}`).emit('notification', notification);
  return notification;
}
