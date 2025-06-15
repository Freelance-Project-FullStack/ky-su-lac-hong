// server/src/server.js
require('dotenv').config();

const express = require('express');
const http = require('http');
const { Server } = require("socket.io");
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const database = require('./config/database');
const socketHandlers = require('./sockets/socketHandlers');
const authRoutes = require('./routes/auth');
const gameRoutes = require('./routes/game');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CORS_ORIGIN || "http://localhost:8080",
    methods: ["GET", "POST"],
    credentials: true
  }
});

const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || "http://localhost:8080",
  credentials: true
}));

// Rate limiting
// const limiter = rateLimit({
//   windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
//   max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100 // limit each IP to 100 requests per windowMs
// });
// app.use('/api/', limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Make io available to routes
app.set('io', io);

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/game', gameRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    database: database.isConnected() ? 'Connected' : 'Disconnected'
  });
});

// Serve static files
app.use(express.static(path.join(__dirname, '../../client/public')));

// Serve client app
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../../client/public/index.html'));
});

// Socket.IO handlers
socketHandlers(io);

// Cleanup job - remove empty rooms older than 1 hour
function startCleanupJob() {
  setInterval(async () => {
    try {
      const Game = require('./models/Game');
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      const result = await Game.deleteMany({
        status: 'waiting',
        'players.0': { $exists: false }, // No players
        createdAt: { $lt: oneHourAgo }
      });

      if (result.deletedCount > 0) {
        console.log(`🧹 Cleaned up ${result.deletedCount} empty rooms`);
      }
    } catch (error) {
      console.error('Cleanup job error:', error);
    }
  }, 30 * 60 * 1000); // Run every 30 minutes
}

// Start server
async function startServer() {
  try {
    // Connect to database
    await database.connect();

    // Start cleanup job
    startCleanupJob();

    server.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`🌐 Access the game at: http://localhost:${PORT}`);
      console.log(`📊 API available at: http://localhost:${PORT}/api`);
      console.log(`🎮 Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('🛑 SIGTERM received, shutting down gracefully...');
  await database.disconnect();
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', async () => {
  console.log('🛑 SIGINT received, shutting down gracefully...');
  await database.disconnect();
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

startServer();