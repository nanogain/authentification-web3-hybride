const jwt = require('jsonwebtoken');
const User = require('../models/user');

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret';

module.exports = async function authMiddleware(req, res, next) {
  try {
    const authHeader = req.headers.authorization || req.headers.Authorization;
    if (!authHeader) return res.status(401).json({ message: 'Missing Authorization header' });

    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0].toLowerCase() !== 'bearer') {
      return res.status(401).json({ message: 'Invalid Authorization format' });
    }

    const token = parts[1];
    let payload;
        try {
          payload = jwt.verify(token, JWT_SECRET);
        } catch (err) {
          return res.status(401).json({ message: 'Invalid or expired token' });
        }

    const userId = payload.userId || payload.sub;
    if (!userId) return res.status(401).json({ message: 'Invalid token payload' });

    const user = await User.findById(userId).select('_id pseudo walletAddress').lean().exec();
    if (!user) return res.status(404).json({ message: 'User not found' });

    req.user = user;
    next();
  } catch (err) {
    console.error('[AUTH MIDDLEWARE ERROR]', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

