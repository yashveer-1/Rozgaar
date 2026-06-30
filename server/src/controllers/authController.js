import jwt from 'jsonwebtoken';
import crypto from 'node:crypto';
import { User } from '../models/User.js';
import { WorkerProfile } from '../models/WorkerProfile.js';

const accessToken = user => jwt.sign({ sub: user.id, role: user.role, name: user.name }, process.env.JWT_SECRET, { expiresIn: '15m' });
const refreshToken = user => jwt.sign({ sub: user.id, jti: crypto.randomUUID() }, process.env.JWT_REFRESH_SECRET, { expiresIn: '30d' });
const publicUser = user => ({ id: user.id, name: user.name, email: user.email, role: user.role });
const allowedRegistrationRoles = new Set(['worker', 'employer']);
const refreshExpiry = () => new Date(Date.now() + 30 * 864e5);

export async function register(req, res, next) {
  try {
    const { name, email, password, role = 'worker' } = req.body || {};
    if (typeof name !== 'string' || typeof email !== 'string' || typeof password !== 'string' || !name || !email || !password) {
      return res.status(400).json({ message: 'Name, email and password are required' });
    }
    if (name.trim().length < 2) return res.status(400).json({ message: 'Please enter your full name' });
    if (password.length < 8 || password.length > 128) {
      return res.status(400).json({ message: 'Password must contain between 8 and 128 characters' });
    }
    if (!allowedRegistrationRoles.has(role)) return res.status(400).json({ message: 'Invalid account type' });
    const normalizedEmail = email.trim().toLowerCase();
    if (await User.exists({ email: normalizedEmail })) return res.status(409).json({ message: 'Email already registered' });
    const user = await User.create({ name: name.trim(), email: normalizedEmail, password, role });
    if (role === 'worker') {
      await WorkerProfile.create({
        user: user.id,
        publicId: `SL-${crypto.randomBytes(5).toString('hex').toUpperCase()}`,
        profileCompletion: 0
      });
    }
    const refresh = refreshToken(user);
    user.refreshTokens.push({ token: refresh, expiresAt: refreshExpiry() });
    await user.save();
    return res.status(201).json({ user: publicUser(user), accessToken: accessToken(user), refreshToken: refresh });
  } catch (error) { return next(error); }
}
export async function login(req, res, next) {
  try {
    const { email, password } = req.body || {};
    if (typeof email !== 'string' || typeof password !== 'string' || !email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }
    const user = await User.findOne({ email: email.trim().toLowerCase() }).select('+password');
    if (!user || !(await user.comparePassword(password))) return res.status(401).json({ message: 'Invalid email or password' });
    user.refreshTokens = user.refreshTokens.filter(item => item.expiresAt > new Date()).slice(-4);
    const refresh = refreshToken(user);
    user.refreshTokens.push({ token: refresh, expiresAt: refreshExpiry() });
    await user.save();
    return res.json({ user: publicUser(user), accessToken: accessToken(user), refreshToken: refresh });
  } catch (error) { return next(error); }
}
export async function refresh(req, res) {
  try {
    const presentedToken = req.body?.refreshToken;
    if (typeof presentedToken !== 'string') throw new Error();
    const payload = jwt.verify(presentedToken, process.env.JWT_REFRESH_SECRET);
    const user = await User.findOne({
      _id: payload.sub,
      refreshTokens: { $elemMatch: { token: presentedToken, expiresAt: { $gt: new Date() } } },
    });
    if (!user) throw new Error();
    user.refreshTokens = user.refreshTokens.filter(item => item.token !== presentedToken && item.expiresAt > new Date()).slice(-4);
    const nextRefreshToken = refreshToken(user);
    user.refreshTokens.push({ token: nextRefreshToken, expiresAt: refreshExpiry() });
    await user.save();
    return res.json({ user: publicUser(user), accessToken: accessToken(user), refreshToken: nextRefreshToken });
  } catch { return res.status(401).json({ message: 'Invalid refresh token' }); }
}

export async function logout(req, res, next) {
  try {
    const { refreshToken: presentedToken } = req.body || {};
    if (typeof presentedToken === 'string') {
      await User.updateOne({ 'refreshTokens.token': presentedToken }, { $pull: { refreshTokens: { token: presentedToken } } });
    }
    return res.status(204).end();
  } catch (error) { return next(error); }
}
