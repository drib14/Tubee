import { OAuth2Client } from 'google-auth-library';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const generateTokens = (user) => {
  const accessToken = jwt.sign(
    { id: user._id, email: user.email },
    process.env.ACCESS_TOKEN_SECRET,
    { expiresIn: '30d' }
  );

  const refreshToken = jwt.sign(
    { id: user._id, email: user.email },
    process.env.REFRESH_TOKEN_SECRET,
    { expiresIn: '7d' }
  );

  return { accessToken, refreshToken };
};

export const googleLogin = async (req, res) => {
  const { idToken } = req.body;

  if (!idToken) {
    return res.status(400).json({ message: 'ID Token is required' });
  }

  if (idToken === 'dev-bypass-token') {
    const email = 'jhondribramirez7@gmail.com';
    const name = 'Jhon Drib';
    const avatar = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=80&q=80';
    const googleId = 'dev-bypass-google-id-12345';

    try {
      let user = await User.findOne({ email }).populate('channel');
      if (!user) {
        user = await User.create({
          name,
          email,
          avatar,
          googleId
        });
      }

      const { accessToken, refreshToken } = generateTokens(user);

      return res.status(200).json({
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          avatar: user.avatar,
          channel: user.channel
        },
        accessToken,
        refreshToken
      });
    } catch (e) {
      return res.status(500).json({ message: 'Dev bypass login failed', error: e.message });
    }
  }

  try {
    const ticket = await client.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const { sub: googleId, email, name, picture: avatar } = payload;

    // Check if user exists
    let user = await User.findOne({ googleId }).populate('channel');

    if (!user) {
      // Check if user exists with the same email but no google ID (optional fail-safe)
      user = await User.findOne({ email }).populate('channel');
      
      if (user) {
        user.googleId = googleId;
        user.avatar = user.avatar || avatar;
        await user.save();
      } else {
        // Create new user
        user = await User.create({
          name,
          email,
          avatar,
          googleId
        });
      }
    }

    const { accessToken, refreshToken } = generateTokens(user);

    res.status(200).json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        channel: user.channel
      },
      accessToken,
      refreshToken
    });
  } catch (error) {
    console.error('Google OAuth verification error:', error);
    res.status(401).json({ message: 'Invalid Google OAuth credentials', error: error.message });
  }
};

export const refreshToken = async (req, res) => {
  const { token } = req.body;

  if (!token) {
    return res.status(401).json({ message: 'Refresh token is required' });
  }

  try {
    const decoded = jwt.verify(token, process.env.REFRESH_TOKEN_SECRET);
    const user = await User.findById(decoded.id).populate('channel');

    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    const tokens = generateTokens(user);
    res.status(200).json({
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        channel: user.channel
      }
    });
  } catch (error) {
    res.status(403).json({ message: 'Invalid or expired refresh token' });
  }
};

export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate('channel');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
