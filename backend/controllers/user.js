// controllers/user.js
const bcrypt = require('bcryptjs'); // stable JS
const jwt = require('jsonwebtoken');
const User = require('../models/user'); // ajuste chemin si besoin

// UTILS de debug
function safeLogError(prefix, err) {
  try {
    console.error(prefix, err && (err.stack || err.message || err));
  } catch(e) {
    console.error(prefix, 'error logging failed', e);
  }
}

exports.signup = async (req, res) => {
  try {
    console.log('[SIGNUP] body=', JSON.stringify(req.body));
    const { email, password } = req.body || {};
    if (!email || !password) return res.status(400).json({ message: 'Email et mot de passe requis.' });

    const hash = await bcrypt.hash(password, 10);
    const user = new User({ email, password: hash });
    await user.save();
    console.log('[SIGNUP] created', email);
    return res.status(201).json({ message: 'Utilisateur créé !' });
  } catch (err) {
    safeLogError('[SIGNUP ERROR]', err);
    if (err && err.code === 11000) return res.status(409).json({ message: 'Email déjà enregistré.' });
    if (err && err.name === 'ValidationError') {
      const details = Object.values(err.errors || {}).map(e => e.message);
      return res.status(400).json({ message: 'Validation failed', details });
    }
    return res.status(500).json({ message: 'Erreur serveur (signup)', error: err && (err.message || err.toString()) });
  }
};

exports.login = async (req, res) => {
  try {
    console.log('[LOGIN] body=', JSON.stringify(req.body));
    const { email, password } = req.body || {};
    if (!email || !password) return res.status(400).json({ message: 'Email et mot de passe requis.' });

    const user = await User.findOne({ email }).exec();
    if (!user) {
      console.log('[LOGIN] no user for', email);
      return res.status(401).json({ message: 'Identifiants invalides.' });
    }

    if (!user.password) {
      console.log('[LOGIN] user found but no password stored for', email, 'user=', user);
      return res.status(500).json({ message: 'Compte mal configuré (no password stored).' });
    }

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) {
      console.log('[LOGIN] invalid password for', email);
      return res.status(401).json({ message: 'Identifiants invalides.' });
    }

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET || 'dev_secret', { expiresIn: '1h' });
    console.log('[LOGIN] success for', email);
    return res.status(200).json({ token, userId: user._id });
  } catch (err) {
    safeLogError('[LOGIN ERROR]', err);
    return res.status(500).json({ message: 'Erreur serveur (login)', error: err && (err.message || err.toString()) });
  }
};

