import User from '../models/User.js';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

//Helpers
const hashRt = (t) => crypto.createHash('sha256').update(t).digest('hex');

const requireEnvs = () => {
  ['JWT_SECRET','JWT_EXPIRE','JWT_REFRESH_SECRET','JWT_REFRESH_EXPIRE'].forEach(k=>{
    if(!process.env[k]) throw new Error(`Missing env: ${k}`);
  });
};

const generateTokens = (userId) => {
  const accessToken = jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE });
  const refreshToken = jwt.sign({ userId }, process.env.JWT_REFRESH_SECRET, { expiresIn: process.env.JWT_REFRESH_EXPIRE });
  return { accessToken, refreshToken };
};

//Register
export const register = async (req, res) => {
  try {
    requireEnvs();
    const { email, password, firstName, lastName, isInternational, country, arrivalDate } = req.body;

    if (!email || !password || !firstName || !lastName) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ error: 'Email already registered' });

    const user = await User.create({
      email,
      password,
      firstName,
      lastName,
      profile: { isInternational, country, arrivalDate }
    });

    const { accessToken, refreshToken } = generateTokens(user._id);

    //Store HASH of refresh token inside the same field "token" (no schema change)
    user.refreshTokens.push({ token: hashRt(refreshToken), createdAt: new Date() });
    await user.save();

    return res.status(201).json({
      message: 'Registration successful',
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        tier: user.tier?.plan ?? 'free',
        limits: user.tier?.limits ?? null,
        usage: user.tier?.usage ?? null
      },
      accessToken,
      refreshToken
    });
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
};

//Login
export const login = async (req, res) => {
  try {
    requireEnvs();
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const { accessToken, refreshToken } = generateTokens(user._id);

    user.refreshTokens.push({ token: hashRt(refreshToken), createdAt: new Date() });
    //Lightweight cap to avoid unbounded growth
    if (user.refreshTokens.length > 10) {
      user.refreshTokens = user.refreshTokens.slice(-10);
    }
    await user.save();

    return res.json({
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        tier: user.tier?.plan ?? 'free',
        limits: user.tier?.limits ?? null,
        usage: user.tier?.usage ?? null
      },
      accessToken,
      refreshToken
    });
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
};

//Refresh token
export const refreshToken = async (req, res) => {
  try {
    requireEnvs();
    const { refreshToken } = req.body;
    if (!refreshToken) return res.status(401).json({ error: 'Refresh token required' });

    let decoded;
    try {
      decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    } catch (err) {
      if (err.name === 'TokenExpiredError') return res.status(401).json({ error: 'Refresh token expired' });
      return res.status(401).json({ error: 'Invalid refresh token' });
    }

    const user = await User.findById(decoded.userId);
    if (!user) return res.status(401).json({ error: 'Invalid refresh token' });

    const incomingHash = hashRt(refreshToken);
    const tokenExists = user.refreshTokens.some(t => t.token === incomingHash);

    if (!tokenExists) {
      //imple token reuse guard: clear all sessions (easy + effective)
      user.refreshTokens = [];
      await user.save();
      return res.status(401).json({ error: 'Token reuse detected. Please log in again.' });
    }

    const { accessToken, refreshToken: newRt } = generateTokens(user._id);

    // rotate: remove old, add new
    user.refreshTokens = user.refreshTokens.filter(t => t.token !== incomingHash);
    user.refreshTokens.push({ token: hashRt(newRt), createdAt: new Date() });
    await user.save();

    return res.json({ accessToken, refreshToken: newRt });
  } catch (error) {
    return res.status(401).json({ error: 'Invalid refresh token' });
  }
};

// ---- Logout ----
export const logout = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.status(400).json({ error: 'Refresh token required' });

    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const before = user.refreshTokens.length;
    const hash = hashRt(refreshToken);
    user.refreshTokens = user.refreshTokens.filter(t => t.token !== hash);
    await user.save();

    if (user.refreshTokens.length === before) {
      return res.status(400).json({ error: 'Token not found' });
    }

    return res.json({ message: 'Logged out successfully' });
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
};

// ---- Get profile ----
export const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });
    return res.json({
      id: user._id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      tier: user.tier,
      profile: user.profile
    });
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
};
