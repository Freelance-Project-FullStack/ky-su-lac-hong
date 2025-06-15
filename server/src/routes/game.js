const express = require('express');
const Game = require('../models/Game');
const GameHistory = require('../models/GameHistory');
const { auth, optionalAuth } = require('../middleware/auth');
const { validate, schemas } = require('../middleware/validation');

const router = express.Router();

// Get all public games
router.get('/rooms', optionalAuth, async (req, res) => {
  try {
    const { status = 'waiting', page = 1, limit = 10 } = req.query;

    // Cleanup empty rooms older than 5 minutes
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    await Game.deleteMany({
      status: 'waiting',
      'players.0': { $exists: false }, // No players
      createdAt: { $lt: fiveMinutesAgo }
    });

    const games = await Game.find({
      status
    })
    .populate('players.userId', 'username avatar stats')
    .sort({ createdAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);

    const total = await Game.countDocuments({
      status
    });

    res.json({
      games: games.map(game => ({
        roomId: game.roomId,
        roomName: game.roomName,
        players: game.players.map(p => ({
          username: p.username,
          avatar: p.userId?.avatar,
          isReady: p.isReady,
          isOnline: p.isOnline
        })),
        settings: game.settings,
        status: game.status,
        createdAt: game.createdAt
      })),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get rooms error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create new game room
router.post('/rooms', auth, validate(schemas.createRoom), async (req, res) => {
  try {
    const { roomName, maxPlayers, isPrivate, password } = req.body;

    // Force cleanup user from any existing rooms
    const existingGame = await Game.findOne({
      'players.userId': req.user._id,
      status: { $in: ['waiting', 'playing'] }
    });

    if (existingGame) {
      console.log(`🧹 Force removing user ${req.user.username} from existing room ${existingGame.roomId}`);
      await existingGame.removePlayer(req.user._id);

      // Auto-delete empty rooms
      if (existingGame.players.length === 0) {
        await Game.deleteOne({ roomId: existingGame.roomId });
        console.log(`🗑️ Auto-deleted empty room ${existingGame.roomId}`);
      }
    }

    // Generate unique room ID using roomName
    const roomId = roomName.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 20) + '_' + Date.now().toString().slice(-6);

    const game = new Game({
      roomId,
      roomName,
      settings: {
        maxPlayers,
        isPrivate,
        password: isPrivate ? password : undefined
      },
      players: [{
        userId: req.user._id,
        username: req.user.username,
        color: '#FF0000', // Default color for room creator
        isReady: false,
        isOnline: true
      }]
    });

    await game.save();

    res.status(201).json({
      message: 'Room created successfully',
      roomId: game.roomId,
      game: {
        roomId: game.roomId,
        roomName: game.roomName,
        players: game.players,
        settings: game.settings,
        status: game.status
      }
    });
  } catch (error) {
    console.error('Create room error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get specific game room
router.get('/rooms/:roomId', auth, async (req, res) => {
  try {
    const { roomId } = req.params;
    
    const game = await Game.findOne({ roomId })
      .populate('players.userId', 'username avatar stats');

    if (!game) {
      return res.status(404).json({ error: 'Room not found' });
    }

    // Check if user is in the game
    const isPlayer = game.players.some(p => 
      p.userId._id.toString() === req.user._id.toString()
    );

    if (game.settings.isPrivate && !isPlayer) {
      return res.status(403).json({ error: 'Private room access denied' });
    }

    res.json({ game });
  } catch (error) {
    console.error('Get room error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Join game room
router.post('/rooms/:roomId/join', auth, validate(schemas.joinRoom), async (req, res) => {
  try {
    const { roomId } = req.params;
    const { password } = req.body;

    // Force cleanup user from any existing rooms
    const existingGame = await Game.findOne({
      'players.userId': req.user._id,
      status: { $in: ['waiting', 'playing'] }
    });

    if (existingGame) {
      console.log(`🧹 Force removing user ${req.user.username} from existing room ${existingGame.roomId} to join ${roomId}`);
      await existingGame.removePlayer(req.user._id);

      // Auto-delete empty rooms
      if (existingGame.players.length === 0) {
        await Game.deleteOne({ roomId: existingGame.roomId });
        console.log(`🗑️ Auto-deleted empty room ${existingGame.roomId}`);
      }
    }

    const game = await Game.findOne({ roomId });

    if (!game) {
      return res.status(404).json({ error: 'Room not found' });
    }

    if (game.status !== 'waiting') {
      return res.status(400).json({ error: 'Game already started' });
    }

    if (game.players.length >= game.settings.maxPlayers) {
      return res.status(400).json({ error: 'Room is full' });
    }

    // Check password for private rooms
    if (game.settings.isPrivate && game.settings.password !== password) {
      return res.status(401).json({ error: 'Invalid room password' });
    }

    // Add player to game
    const playerColors = ['#FF0000', '#00FF00', '#0000FF', '#FFFF00'];
    const usedColors = game.players.map(p => p.color);
    const availableColor = playerColors.find(color => !usedColors.includes(color));

    await game.addPlayer({
      userId: req.user._id,
      username: req.user.username,
      color: availableColor,
      isReady: false,
      isOnline: true
    });

    res.json({
      message: 'Joined room successfully',
      game: {
        roomId: game.roomId,
        players: game.players,
        settings: game.settings,
        status: game.status
      }
    });
  } catch (error) {
    console.error('Join room error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update game room settings
router.put('/rooms/:roomId', auth, validate(schemas.updateRoom), async (req, res) => {
  console.log('🚀 PUT /rooms/:roomId route hit!');
  console.log('- Method:', req.method);
  console.log('- URL:', req.url);
  console.log('- Params:', req.params);
  console.log('- Body:', req.body);
  console.log('- User from auth:', req.user ? req.user.username : 'NO USER');

  try {
    const { roomId } = req.params;
    const { roomName, maxPlayers, isPrivate, password } = req.body;

    console.log('🔍 Update room debug:');
    console.log('- Room ID:', roomId);
    console.log('- Authenticated user:', req.user ? {
      id: req.user._id,
      username: req.user.username,
      idString: req.user._id.toString()
    } : 'NO USER');

    const game = await Game.findOne({ roomId }).populate('players.userId', 'username _id');

    if (!game) {
      console.log('❌ Room not found');
      return res.status(404).json({ error: 'Room not found' });
    }

    console.log('- Game found with players:', game.players.map(p => ({
      userId: p.userId,
      username: p.username,
      userIdString: p.userId.toString()
    })));

    // Check if user is in the room first
    const reqUserIdString = req.user._id.toString();
    console.log('- Looking for user ID:', reqUserIdString);

    const userInGame = game.players.find(p => {
      // Kiểm tra nếu p.userId là object (đã populate) hoặc ObjectId
      const playerIdString = p.userId._id ? p.userId._id.toString() : p.userId.toString();
      console.log(`- Comparing: ${playerIdString} === ${reqUserIdString} ? ${playerIdString === reqUserIdString}`);
      return playerIdString === reqUserIdString;
    });

    if (!userInGame) {
      console.log('❌ User not found in game players');
      return res.status(403).json({ error: 'You are not in this room' });
    }

    console.log('✅ User found in game:', userInGame.username);

    // Debug host check
    console.log('🔍 Host check debug:');
    console.log('- Current user ID:', reqUserIdString);
    console.log('- First player (host) ID:', game.players[0].userId._id.toString());
    console.log('- Is host?', game.players[0].userId._id.toString() === reqUserIdString);

    // Check if user is the host (first player in the room)
    const isHost = game.players.length > 0 && game.players[0].userId._id.toString() === reqUserIdString;

    if (!isHost) {
      console.log('❌ Access denied - user is not the host');
      return res.status(403).json({ error: 'Only room creator can update room settings' });
    }

    console.log('✅ User is host, proceeding with update');

    // Can only update room settings if game hasn't started
    if (game.status !== 'waiting') {
      return res.status(400).json({ error: 'Cannot update room settings after game has started' });
    }

    // Store original roomId for socket broadcast
    const originalRoomId = roomId;

    // Update room settings
    if (roomName !== undefined) {
      game.roomName = roomName;
      // Don't change roomId - keep it consistent for socket rooms
    }

    if (maxPlayers !== undefined) {
      game.settings.maxPlayers = maxPlayers;
    }

    if (isPrivate !== undefined) {
      game.settings.isPrivate = isPrivate;
      if (isPrivate && password) {
        game.settings.password = password;
      } else if (!isPrivate) {
        game.settings.password = undefined;
      }
    }

    await game.save();

    // Broadcast room settings update to all players in the room via socket
    const io = req.app.get('io');
    if (io) {
      io.to(originalRoomId).emit('roomSettingsUpdated', {
        settings: {
          roomName: game.roomName,
          maxPlayers: game.settings.maxPlayers,
          isPrivate: game.settings.isPrivate
        },
        roomName: game.roomName,
        updatedBy: game.players[0].userId.username || 'Host'
      });

      // Also emit full game state update to ensure sync
      const gameStateForSocket = {
        roomId: game.roomId,
        roomName: game.roomName,
        players: game.players.map(p => ({
          id: p.socketId || p.userId._id.toString(),
          name: p.userId.username,
          color: p.color,
          money: p.money || 0,
          position: p.position || 0,
          ownedProperties: p.properties || []
        })),
        settings: game.settings,
        status: game.status,
        currentPlayerIndex: game.currentPlayerIndex || 0,
        gamePhase: game.gamePhase || 'waiting',
        turnNumber: game.turnNumber || 0
      };

      console.log('📡 Emitting full game state after room update:', gameStateForSocket);
      io.to(originalRoomId).emit('gameStateUpdate', gameStateForSocket);
    }

    res.json({
      message: 'Room updated successfully',
      roomId: game.roomId,
      game: {
        roomId: game.roomId,
        roomName: game.roomName,
        players: game.players,
        settings: game.settings,
        status: game.status
      }
    });
  } catch (error) {
    console.error('Update room error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Leave game room
router.post('/rooms/:roomId/leave', auth, async (req, res) => {
  try {
    const { roomId } = req.params;

    const game = await Game.findOne({ roomId });

    if (!game) {
      return res.status(404).json({ error: 'Room not found' });
    }

    await game.removePlayer(req.user._id);

    // Auto-delete empty rooms
    if (game.players.length === 0 && game.status === 'waiting') {
      console.log(`Auto-deleting empty room: ${roomId}`);
      await Game.deleteOne({ roomId });

      // Broadcast room list update
      const io = req.app.get('io');
      if (io) {
        io.emit('roomListUpdated');
      }
    }

    res.json({ message: 'Left room successfully' });
  } catch (error) {
    console.error('Leave room error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Close game room (host only)
router.delete('/rooms/:roomId', auth, async (req, res) => {
  try {
    const { roomId } = req.params;

    const game = await Game.findOne({ roomId }).populate('players.userId', 'username _id');

    if (!game) {
      return res.status(404).json({ error: 'Room not found' });
    }

    // Check if user is the host (first player in the room)
    const reqUserIdString = req.user._id.toString();
    const isHost = game.players.length > 0 && game.players[0].userId._id.toString() === reqUserIdString;

    if (!isHost) {
      return res.status(403).json({ error: 'Only room creator can close the room' });
    }

    // Can only close room if game hasn't started
    if (game.status !== 'waiting') {
      return res.status(400).json({ error: 'Cannot close room after game has started' });
    }

    // Delete room from database
    await Game.deleteOne({ roomId });
    console.log(`🗑️ Room ${roomId} closed and deleted by host ${req.user.username}`);

    // Broadcast room closure and list update
    const io = req.app.get('io');
    if (io) {
      io.to(roomId).emit('roomClosed', {
        message: 'Room has been closed by host',
        hostName: req.user.username
      });

      io.emit('roomListUpdated');
    }

    res.json({ message: 'Room closed successfully' });
  } catch (error) {
    console.error('Close room error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get user's game history
router.get('/history', auth, async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    
    const games = await GameHistory.getRecentGames(
      req.user._id, 
      parseInt(limit)
    );

    const stats = await GameHistory.getPlayerStats(req.user._id);

    res.json({
      games,
      stats,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Get history error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get leaderboard
router.get('/leaderboard', async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    
    const leaderboard = await GameHistory.getLeaderboard(parseInt(limit));

    res.json({ leaderboard });
  } catch (error) {
    console.error('Get leaderboard error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
