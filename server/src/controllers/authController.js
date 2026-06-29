import jwt from 'jsonwebtoken';
import crypto from 'node:crypto';
import { User } from '../models/User.js';

const accessToken = user => jwt.sign({ sub: user.id, role: user.role, name: user.name }, process.env.JWT_SECRET, { expiresIn: '15m' });
const refreshToken = user => jwt.sign({ sub: user.id, jti: crypto.randomUUID() }, process.env.JWT_REFRESH_SECRET, { expiresIn: '30d' });

export async function register(req, res, next) {
  try {
    const { name, email, password, role = 'worker' } = req.body;
    if (!name || !email || !password) return res.status(400).json({ message: 'Name, email and password are required' });
    if (await User.exists({ email })) return res.status(409).json({ message: 'Email already registered' });
    const user = await User.create({ name, email, password, role });
    const refresh = refreshToken(user);
    user.refreshTokens.push({ token: refresh, expiresAt: new Date(Date.now() + 30 * 864e5) });
    await user.save();
    return res.status(201).json({ user: { id: user.id, name, email, role }, accessToken: accessToken(user), refreshToken: refresh });
  } catch (error) { return next(error); }
}
export async function login(req, res, next) {
  try {
    const user = await User.findOne({ email: req.body.email }).select('+password');
    if (!user || !(await user.comparePassword(req.body.password))) return res.status(401).json({ message: 'Invalid email or password' });
    const refresh = refreshToken(user);
    user.refreshTokens.push({ token: refresh, expiresAt: new Date(Date.now() + 30 * 864e5) });
    await user.save();
    return res.json({ user: { id: user.id, name: user.name, email: user.email, role: user.role }, accessToken: accessToken(user), refreshToken: refresh });
  } catch (error) { return next(error); }
}
export async function refresh(req, res) {
  try {
    const payload = jwt.verify(req.body.refreshToken, process.env.JWT_REFRESH_SECRET);
    const user = await User.findOne({ _id: payload.sub, 'refreshTokens.token': req.body.refreshToken });
    if (!user) throw new Error();
    return res.json({ accessToken: accessToken(user) });
  } catch { return res.status(401).json({ message: 'Invalid refresh token' }); }
}
