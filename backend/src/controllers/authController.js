const User = require('../models/User');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

// Generate tokens
const generateTokens = (userId) => {
  const accessToken = jwt.sign(
    { userId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE }
  );
  
  const refreshToken = jwt.sign(
    { userId },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRE }
  );
  
  return { accessToken, refreshToken };
};

// Register
exports.register = async (req, res) => {
  try {
    const { email, password, firstName, lastName, isInternational, country, arrivalDate } = req.body;
    
    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' });
    }
    
    // Create user
    const user = await User.create({
      email,
      password,
      firstName,
      lastName,
      profile: {
        isInternational,
        country,
        arrivalDate
      }
    });
    
    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(user._id);
    
    // Store refresh token
    user.refreshTokens.push({ token: refreshToken });
    await user.save();
    
    res.status(201).json({
      message: 'Registration successful',
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        tier: user.tier.plan
      },
      accessToken,
      refreshToken
    });
    
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Login
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Find user and include password
    const user = await User.findOne({ email }).select('+password');
    
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(user._id);
    
    // Store refresh token
    user.refreshTokens.push({ token: refreshToken });
    await user.save();
    
    res.json({
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        tier: user.tier.plan,
        limits: user.tier.limits,
        usage: user.tier.usage
      },
      accessToken,
      refreshToken
    });
    
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Refresh token
exports.refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    
    if (!refreshToken) {
      return res.status(401).json({ error: 'Refresh token required' });
    }
    
    // Verify refresh token
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    
    // Find user and check if token exists
    const user = await User.findById(decoded.userId);
    const tokenExists = user.refreshTokens.some(t => t.token === refreshToken);
    
    if (!tokenExists) {
      return res.status(401).json({ error: 'Invalid refresh token' });
    }
    
    // Generate new tokens
    const tokens = generateTokens(user._id);
    
    // Replace old refresh token with new one
    user.refreshTokens = user.refreshTokens.filter(t => t.token !== refreshToken);
    user.refreshTokens.push({ token: tokens.refreshToken });
    await user.save();
    
    res.json(tokens);
    
  } catch (error) {
    res.status(401).json({ error: 'Invalid refresh token' });
  }
};

// Logout
exports.logout = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    const user = await User.findById(req.userId);
    
    // Remove refresh token
    user.refreshTokens = user.refreshTokens.filter(t => t.token !== refreshToken);
    await user.save();
    
    res.json({ message: 'Logged out successfully' });
    
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Get profile
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    res.json({
      id: user._id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      tier: user.tier,
      profile: user.profile
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};