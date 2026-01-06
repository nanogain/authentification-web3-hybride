const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/user');
const { ethers } = require('ethers');

function safeLogError(prefix, err) {
  try {
    console.error(prefix, err && (err.stack || err.message || err));
  } catch(e) {
    console.error(prefix, 'error logging failed', e);
  }
}

exports.dashboard = async (req,res) => {
   try {
    if (!req.user) return res.status(401).json({ message: 'Non authentifié' });
       return res.json({ pseudo: req.user.pseudo, walletAddress: req.user.walletAddress });
   } catch (err) {
       console.error('[ME ERROR]', err);
       return res.status(500).json({ message: 'Erreur serveur', error: err.message || err });
   }

}

exports.signup = async (req, res) => {
  try {
    console.log('[SIGNUP] body=', JSON.stringify(req.body));
    const { email, password, pseudo } = req.body || {};
    if (!email || !password || !pseudo) return res.status(400).json({ message: 'Email, pseudo et mot de passe requis.' });

    const hash = await bcrypt.hash(password, 10);
    const user = new User({ email, password: hash, pseudo });
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

exports.web3Login = async (req, res) => {
  try {
    const { walletAddress, signature, getNonce } = req.body;
    const normalizedAddress = walletAddress.toLowerCase();
    console.log('[WEB3 LOGIN BODY]', req.body, typeof req.body.getNonce);

    if (getNonce) {
      let user = await User.findOne({ walletAddress: normalizedAddress });
      if (!user) {
        user = new User({
          walletAddress: normalizedAddress,
          nonce: Math.floor(Math.random() * 1000000).toString()
        });
        await user.save();
      }
      else {
        user.nonce = Math.floor(Math.random() * 1000000).toString();
        await user.save();
      }
      return res.status(200).json({ nonce: user.nonce });
    }

    const user = await User.findOne({ walletAddress: normalizedAddress });
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }

    const message = `Connexion avec nonce: ${user.nonce}`;
    const recoveredAddress = ethers.verifyMessage(message, signature);

    if (recoveredAddress.toLowerCase() !== normalizedAddress) {
      return res.status(401).json({ message: 'Signature invalide' });
    }

    user.nonce = Math.floor(Math.random() * 1000000).toString();
    await user.save();

    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET || 'dev_secret',
      { expiresIn: '24h' }
    );

    res.status(200).json({ token, walletAddress: user.walletAddress });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.web3Liaison = async (req, res) => {
    try {
        const { email, password, walletAddress } = req.body;
        const normalizedAddress = walletAddress.toLowerCase();
        let user = await User.findOne({ walletAddress: normalizedAddress });

        if(!user){
                return res.status(404).json({message: 'Aucune adresse trouvé'})
        }
        else{
                const message = `Connexion`;
                const hash = await bcrypt.hash(password, 10);
                user.email = email;
                user.password = hash;
                await user.save();
                return res.status(200).json({ message: `l adresse a été lié à ${user.email}` });
        }

    } catch (error) {
    res.status(500).json({ message: error.message });
  }

};

