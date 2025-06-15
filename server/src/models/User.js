const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3,
    maxlength: 20,
    match: /^[a-zA-Z0-9_]+$/
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
    match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  avatar: {
    type: String,
    default: 'default_avatar.png'
  },
  stats: {
    gamesPlayed: { type: Number, default: 0 },
    gamesWon: { type: Number, default: 0 },
    totalMoney: { type: Number, default: 0 },
    favoriteCharacter: { type: String, default: null },
    winRate: { type: Number, default: 0 },
    averageGameDuration: { type: Number, default: 0 }
  },
  preferences: {
    soundEnabled: { type: Boolean, default: true },
    musicEnabled: { type: Boolean, default: true },
    animationsEnabled: { type: Boolean, default: true },
    language: { type: String, default: 'vi' }
  },
  isOnline: { type: Boolean, default: false },
  lastSeen: { type: Date, default: Date.now },
  currentRoomId: { type: String, default: null }
}, {
  timestamps: true
});


// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Update stats method
userSchema.methods.updateStats = function(gameResult) {
  this.stats.gamesPlayed += 1;
  if (gameResult.won) {
    this.stats.gamesWon += 1;
  }
  this.stats.totalMoney += gameResult.finalMoney || 0;
  this.stats.winRate = (this.stats.gamesWon / this.stats.gamesPlayed) * 100;
  
  if (gameResult.duration) {
    this.stats.averageGameDuration = 
      ((this.stats.averageGameDuration * (this.stats.gamesPlayed - 1)) + gameResult.duration) / this.stats.gamesPlayed;
  }
  
  return this.save();
};

// Get public profile
userSchema.methods.getPublicProfile = function() {
  return {
    id: this._id,
    username: this.username,
    avatar: this.avatar,
    stats: this.stats,
    isOnline: this.isOnline,
    lastSeen: this.lastSeen
  };
};

module.exports = mongoose.model('User', userSchema);
