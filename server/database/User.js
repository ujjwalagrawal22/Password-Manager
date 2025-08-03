const mongoose = require('mongoose');

const PasswordEntrySchema = new mongoose.Schema({
  data: String,
  iv: String,
  createdAt: { type: Date, default: Date.now },
  updatedAt: Date,
});

const UserSchema = new mongoose.Schema({
  email: { type: String, unique: true, required: true },
  salt: String,
  kdfParams: Object,
  authTagData: String,
  authTagIv: String,
  vault: [PasswordEntrySchema],
});

module.exports = mongoose.model('User', UserSchema);
