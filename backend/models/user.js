const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');

const userSchema = mongoose.Schema({
  email: { type: String, },
  password: { type: String, },
  pseudo: { type: String, },
  walletAddress: { type: String, lowercase: true, },
  nonce: { type: String, default: () => Math.floor(Math.random() * 1000000).toString() }
});

userSchema.plugin(uniqueValidator);

module.exports = mongoose.model('User', userSchema);
