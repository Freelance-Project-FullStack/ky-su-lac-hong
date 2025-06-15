const mongoose = require('mongoose');

const gameHistorySchema = new mongoose.Schema({
  gameId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Game',
    required: true
  },
  roomId: {
    type: String,
    required: true
  },
  players: [{
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    username: String,
    finalPosition: Number,
    finalMoney: Number,
    propertiesOwned: Number,
    buildingsBuilt: Number,
    historicalCharacterUsed: String,
    turnsPlayed: Number,
    won: Boolean
  }],
  winner: {
    userId: mongoose.Schema.Types.ObjectId,
    username: String,
    winCondition: String
  },
  gameStats: {
    duration: Number, // in seconds
    totalTurns: Number,
    totalMoneyCirculated: Number,
    propertiesSold: Number,
    buildingsBuilt: Number,
    eventsTriggered: Number
  },
  startedAt: Date,
  finishedAt: Date,
  gameVersion: { type: String, default: '1.0.0' }
}, {
  timestamps: true
});

// Indexes
gameHistorySchema.index({ gameId: 1 });
gameHistorySchema.index({ 'players.userId': 1 });
gameHistorySchema.index({ 'winner.userId': 1 });
gameHistorySchema.index({ finishedAt: -1 });

// Static methods
gameHistorySchema.statics.getPlayerStats = async function(userId) {
  const stats = await this.aggregate([
    { $match: { 'players.userId': userId } },
    { $unwind: '$players' },
    { $match: { 'players.userId': userId } },
    {
      $group: {
        _id: '$players.userId',
        totalGames: { $sum: 1 },
        totalWins: { $sum: { $cond: ['$players.won', 1, 0] } },
        totalMoney: { $sum: '$players.finalMoney' },
        totalProperties: { $sum: '$players.propertiesOwned' },
        totalBuildings: { $sum: '$players.buildingsBuilt' },
        averageDuration: { $avg: '$gameStats.duration' },
        averagePosition: { $avg: '$players.finalPosition' }
      }
    }
  ]);

  return stats[0] || {
    totalGames: 0,
    totalWins: 0,
    totalMoney: 0,
    totalProperties: 0,
    totalBuildings: 0,
    averageDuration: 0,
    averagePosition: 0
  };
};

gameHistorySchema.statics.getLeaderboard = async function(limit = 10) {
  return this.aggregate([
    { $unwind: '$players' },
    {
      $group: {
        _id: '$players.userId',
        username: { $first: '$players.username' },
        totalGames: { $sum: 1 },
        totalWins: { $sum: { $cond: ['$players.won', 1, 0] } },
        winRate: { 
          $avg: { $cond: ['$players.won', 100, 0] }
        },
        totalMoney: { $sum: '$players.finalMoney' },
        averageMoney: { $avg: '$players.finalMoney' }
      }
    },
    { $match: { totalGames: { $gte: 3 } } }, // At least 3 games
    { $sort: { winRate: -1, totalWins: -1 } },
    { $limit: limit }
  ]);
};

gameHistorySchema.statics.getRecentGames = async function(userId, limit = 10) {
  return this.find({ 'players.userId': userId })
    .sort({ finishedAt: -1 })
    .limit(limit)
    .populate('players.userId', 'username avatar')
    .select('roomId winner gameStats finishedAt players');
};

module.exports = mongoose.model('GameHistory', gameHistorySchema);
