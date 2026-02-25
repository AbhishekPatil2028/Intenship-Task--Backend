import mongoose from 'mongoose';

const refreshTokenSchema = new mongoose.Schema({
  token: {
    type: String,
    required: [true, 'Token is required'],
    unique: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User is required']
  },
  expiresAt: {
    type: Date,
    required: [true, 'Expiry date is required']
  },
  revoked: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  lastUsed: {
    type: Date
  }
});

// Index for auto-expiry
refreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Methods
refreshTokenSchema.methods.markUsed = async function() {
  this.lastUsed = new Date();
  return this.save();
};

refreshTokenSchema.methods.isValid = function() {
  return !this.revoked && this.expiresAt > new Date();
};

const RefreshToken = mongoose.model('RefreshToken', refreshTokenSchema);
export default RefreshToken;