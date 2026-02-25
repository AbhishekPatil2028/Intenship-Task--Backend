import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import User from '../models/PassportUser.mjs';
import RefreshToken from '../models/RefreshToken.mjs';
import dotenv from 'dotenv';

dotenv.config();

// Generate tokens
const generateTokens = async (userId) => {
  const accessToken = jwt.sign(
    { userId },
    process.env.ACCESS_TOKEN_SECRET,
    { expiresIn: process.env.ACCESS_TOKEN_EXPIRY || '30s' }
  );

  const refreshToken = jwt.sign(
    { userId },
    process.env.REFRESH_TOKEN_SECRET,
    { expiresIn: process.env.REFRESH_TOKEN_EXPIRY || '7d' }
  );

  // Calculate expiry date (7 days from now)
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  // Save refresh token to database
  await RefreshToken.create({
    token: refreshToken,
    user: userId,
    expiresAt: expiresAt
  });

  return { accessToken, refreshToken };
};

// Login
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email and password are required'
      });
    }

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password'
      });
    }

    // Check password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password'
      });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate tokens
    const tokens = await generateTokens(user._id);

    // Response
    res.status(200).json({
      success: true,
      message: 'Login successful',
      user: {
        id: user._id,
        name: user.name,
        email: user.email
      },
      tokens: {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        accessExpiresIn: process.env.ACCESS_TOKEN_EXPIRY,
        refreshExpiresIn: process.env.REFRESH_TOKEN_EXPIRY
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

// Signup
export const signup = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Validation
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Name, email and password are required'
      });
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        error: 'Please enter a valid email address'
      });
    }

    // Password length
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        error: 'Password must be at least 6 characters'
      });
    }

    // Check existing user
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: 'Email already registered'
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await User.create({
      name,
      email,
      password: hashedPassword
    });

    // Generate tokens
    const tokens = await generateTokens(user._id);

    // Response
    res.status(201).json({
      success: true,
      message: 'Account created successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email
      },
      tokens: {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        accessExpiresIn: process.env.ACCESS_TOKEN_EXPIRY,
        refreshExpiresIn: process.env.REFRESH_TOKEN_EXPIRY
      }
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

// Refresh token
export const refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        error: 'Refresh token is required'
      });
    }

    // Verify refresh token
    let decoded;
    try {
      decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
    } catch (error) {
      return res.status(403).json({
        success: false,
        error: 'Invalid or expired refresh token'
      });
    }

    // Check in database
    const storedToken = await RefreshToken.findOne({
      token: refreshToken,
      user: decoded.userId
    });

    if (!storedToken) {
      return res.status(403).json({
        success: false,
        error: 'Refresh token not found'
      });
    }

    if (storedToken.revoked) {
      return res.status(403).json({
        success: false,
        error: 'Refresh token revoked'
      });
    }

    if (storedToken.expiresAt < new Date()) {
      await RefreshToken.findByIdAndUpdate(storedToken._id, { revoked: true });
      return res.status(403).json({
        success: false,
        error: 'Refresh token expired'
      });
    }

    // Mark as used
    await storedToken.markUsed();

    // Generate new access token
    const accessToken = jwt.sign(
      { userId: decoded.userId },
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: process.env.ACCESS_TOKEN_EXPIRY || '30s' }
    );

    res.status(200).json({
      success: true,
      accessToken,
      message: 'Access token refreshed',
      expiresIn: process.env.ACCESS_TOKEN_EXPIRY
    });
  } catch (error) {
    console.error('Refresh token error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

// Logout
export const logout = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        error: 'Refresh token is required'
      });
    }

    // Revoke token
    const result = await RefreshToken.findOneAndUpdate(
      { token: refreshToken },
      { revoked: true },
      { new: true }
    );

    if (!result) {
      return res.status(404).json({
        success: false,
        error: 'Refresh token not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

// Protected route
export const protectedRoute = async (req, res) => {
  try {
    const user = req.user;

    res.status(200).json({
      success: true,
      message: `Welcome ${user.name}! This is a protected route.`,
      user: {
        id: user._id,
        name: user.name,
        email: user.email
      },
      timestamp: new Date().toISOString(),
      tokenInfo: {
        system: 'Dual Token Authentication',
        accessTokenExpiry: process.env.ACCESS_TOKEN_EXPIRY,
        refreshTokenStorage: 'MongoDB Database'
      }
    });
  } catch (error) {
    console.error('Protected route error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

// Check token
export const checkToken = async (req, res) => {
  try {
    const user = req.user;

    res.status(200).json({
      success: true,
      message: 'Token is valid',
      user: {
        id: user._id,
        name: user.name,
        email: user.email
      },
      valid: true,
      system: 'Dual Token System'
    });
  } catch (error) {
    console.error('Check token error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};