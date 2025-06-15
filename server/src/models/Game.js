const mongoose = require('mongoose');

const gameSchema = new mongoose.Schema({
  roomId: {
    type: String,
    required: true,
    unique: true
  },
  roomName: {
    type: String,
    required: true,
    trim: true,
    minlength: 3,
    maxlength: 30
  },
  status: {
    type: String,
    enum: ['waiting', 'playing', 'finished', 'abandoned'],
    default: 'waiting'
  },
  players: [{
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    username: String,
    color: String,
    socketId: String,
    position: { type: Number, default: 0 },
    money: { type: Number, default: 2000000 },
    properties: [String],
    isReady: { type: Boolean, default: false },
    isOnline: { type: Boolean, default: true },
    joinedAt: { type: Date, default: Date.now }
  }],
  gameState: {
    currentPlayerIndex: { type: Number, default: 0 },
    turnNumber: { type: Number, default: 0 },
    phase: { type: String, default: 'WAITING_FOR_PLAYERS' },
    lastDiceRoll: [Number],
    board: {
      squares: [mongoose.Schema.Types.Mixed]
    },
    eventCardDeck: [mongoose.Schema.Types.Mixed],
    historicalCharacterCardDeck: [mongoose.Schema.Types.Mixed]
  },
  settings: {
    maxPlayers: { type: Number, default: 4 },
    timeLimit: { type: Number, default: 120 }, // minutes
    isPrivate: { type: Boolean, default: false },
    password: String
  },
  winner: {
    userId: mongoose.Schema.Types.ObjectId,
    username: String,
    winCondition: String,
    finalStats: mongoose.Schema.Types.Mixed
  },
  startedAt: Date,
  finishedAt: Date,
  duration: Number, // in seconds
  chatMessages: [{
    userId: mongoose.Schema.Types.ObjectId,
    username: String,
    message: String,
    timestamp: { type: Date, default: Date.now },
    type: { type: String, enum: ['chat', 'system', 'action'], default: 'chat' }
  }],
  gameLog: [{
    action: String,
    playerId: String,
    details: mongoose.Schema.Types.Mixed,
    timestamp: { type: Date, default: Date.now }
  }]
}, {
  timestamps: true
});

// Indexes
gameSchema.index({ roomId: 1 });
gameSchema.index({ status: 1 });
gameSchema.index({ 'players.userId': 1 });
gameSchema.index({ createdAt: -1 });

// Methods
gameSchema.methods.addPlayer = function(playerData) {
  if (this.players.length >= this.settings.maxPlayers) {
    throw new Error('Game is full');
  }
  
  this.players.push(playerData);
  return this.save();
};

gameSchema.methods.removePlayer = function(userId) {
  this.players = this.players.filter(p => p.userId.toString() !== userId.toString());
  
  if (this.players.length === 0) {
    this.status = 'abandoned';
  }
  
  return this.save();
};

gameSchema.methods.startGame = function() {
  if (this.players.length < 2) {
    throw new Error('Need at least 2 players to start');
  }
  
  this.status = 'playing';
  this.startedAt = new Date();
  this.gameState.phase = 'PLAYER_TURN_START';
  
  return this.save();
};

gameSchema.methods.finishGame = function(winner, winCondition) {
  this.status = 'finished';
  this.finishedAt = new Date();
  this.duration = Math.floor((this.finishedAt - this.startedAt) / 1000);
  this.winner = {
    userId: winner.userId,
    username: winner.username,
    winCondition,
    finalStats: {
      money: winner.money,
      properties: winner.properties.length,
      turnNumber: this.gameState.turnNumber
    }
  };
  
  return this.save();
};

gameSchema.methods.addChatMessage = function(userId, username, message, type = 'chat') {
  this.chatMessages.push({
    userId,
    username,
    message,
    type,
    timestamp: new Date()
  });
  
  // Keep only last 100 messages
  if (this.chatMessages.length > 100) {
    this.chatMessages = this.chatMessages.slice(-100);
  }
  
  return this.save();
};

gameSchema.methods.addGameLogEntry = function(action, playerId, details) {
  this.gameLog.push({
    action,
    playerId,
    details,
    timestamp: new Date()
  });
  
  // Keep only last 500 log entries
  if (this.gameLog.length > 500) {
    this.gameLog = this.gameLog.slice(-500);
  }
  
  return this.save();
};

module.exports = mongoose.model('Game', gameSchema);
