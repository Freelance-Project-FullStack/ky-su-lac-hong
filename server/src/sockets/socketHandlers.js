// server/src/sockets/socketHandlers.js
const GameManager = require('../game/GameManager');
const { v4: uuidv4 } = require('uuid');

// Lưu trữ các phòng chơi đang hoạt động
// key: roomId, value: GameManager instance
const activeRooms = {};

// Màu sắc có sẵn cho người chơi
const PLAYER_COLORS = ['#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF'];
let availableColors = [...PLAYER_COLORS];

function getAvailableColor() {
    if (availableColors.length === 0) {
        availableColors = [...PLAYER_COLORS]; // Reset nếu hết màu
    }
    return availableColors.pop();
}

function releaseColor(color) {
    if (color && !availableColors.includes(color)) {
        availableColors.push(color);
    }
}


// Track players and their rooms
const playerRooms = new Map(); // socketId -> roomId

module.exports = function(io) {
  io.on('connection', async (socket) => {
    console.log(`🔗 User connected: ${socket.id}`);
    let currentRoomId = null;
    let playerColor = null;

    // Cleanup any stale database entries for this socket
    try {
      const Game = require('../models/Game');
      const result = await Game.updateMany(
        { 'players.socketId': socket.id },
        { $pull: { players: { socketId: socket.id } } }
      );
      if (result.modifiedCount > 0) {
        console.log(`🧹 Cleaned up ${result.modifiedCount} stale database entries for socket ${socket.id}`);
      }
    } catch (error) {
      console.error('❌ Error cleaning up stale database entries:', error);
    }

    socket.on('createRoom', ({ playerName }) => {
      if (!playerName || playerName.trim() === '') {
          socket.emit('error', { message: "Tên người chơi không được để trống."});
          return;
      }

      // Check if player is already in a room
      if (playerRooms.has(socket.id)) {
        socket.emit('error', { message: "Bạn đã ở trong một phòng khác."});
        return;
      }

      currentRoomId = uuidv4().slice(0, 6); // Tạo ID phòng ngắn gọn
      const gameManager = new GameManager(currentRoomId, null, io);
      activeRooms[currentRoomId] = gameManager;
      playerColor = getAvailableColor();

      const player = gameManager.addPlayer({ id: socket.id, name: playerName, color: playerColor });
      if (player) {
        socket.join(currentRoomId);
        playerRooms.set(socket.id, currentRoomId); // Track player room
        console.log(`🎮 Player ${playerName} (${socket.id}) created and joined room ${currentRoomId}`);
        socket.emit('roomCreated', { roomId: currentRoomId, playerId: socket.id });
        // Emit initial game state
        console.log(`🚀 Emitting initial game state for room ${currentRoomId}`);
        gameManager.emitGameState();
      } else {
          releaseColor(playerColor);
          socket.emit('error', { message: "Không thể tạo người chơi."});
      }
    });

    socket.on('joinRoom', async ({ roomId, playerName }) => {
      console.log('🏠 Received joinRoom:', { roomId, playerName, socketId: socket.id });

      if (!playerName || playerName.trim() === '') {
          console.log('❌ joinRoom failed: empty player name');
          socket.emit('error', { message: "Tên người chơi không được để trống."});
          return;
      }

      // Check if player is already in a room
      if (playerRooms.has(socket.id)) {
        const existingRoom = playerRooms.get(socket.id);
        socket.emit('error', { message: `Bạn đã ở trong phòng ${existingRoom}.`});
        return;
      }

      let room = activeRooms[roomId];

      // If room not in memory, try to load from database
      if (!room) {
        try {
          const Game = require('../models/Game');
          const gameData = await Game.findOne({ roomId });

          if (gameData) {
            console.log(`🔄 Loading room ${roomId} from database into memory`);
            const GameManager = require('../game/GameManager');

            // Create new GameManager instance from saved data with roomName
            room = new GameManager(gameData.roomId, gameData.gameSettings, io, gameData.roomName);

            // Restore game state if it exists
            if (gameData.gameState) {
              room.restoreGameState(gameData.gameState);
            }

            // Add to active rooms
            activeRooms[roomId] = room;
            console.log(`✅ Room ${roomId} loaded from database and added to memory`);
          }
        } catch (error) {
          console.error(`❌ Error loading room ${roomId} from database:`, error);
          socket.emit('error', { message: "Lỗi khi tải phòng từ cơ sở dữ liệu." });
          return;
        }
      }

      if (room) {
        if (room.isGameStarted) {
            socket.emit('error', { message: "Game đã bắt đầu, không thể tham gia."});
            return;
        }
        if (room.players.length >= room.gameSettings.maxPlayers) {
            socket.emit('error', { message: "Phòng đã đầy."});
            return;
        }
        playerColor = getAvailableColor();
        const player = room.addPlayer({ id: socket.id, name: playerName, color: playerColor });
        if (player) {
            currentRoomId = roomId;
            socket.join(roomId);
            playerRooms.set(socket.id, roomId); // Track player room

            // Update socketId in database
            try {
              const Game = require('../models/Game');
              await Game.updateOne(
                { roomId, 'players.username': playerName },
                { $set: { 'players.$.socketId': socket.id } }
              );
              console.log(`📝 Updated socketId for ${playerName} in database`);
            } catch (error) {
              console.error('❌ Error updating socketId in database:', error);
            }

            socket.emit('joinedRoom', { roomId, playerId: socket.id });
            // Thông báo cho những người khác trong phòng
            socket.to(roomId).emit('playerJoined', { player: {id: player.id, name: player.name, color: player.color }});
            console.log(`✅ Player ${playerName} (${socket.id}) successfully joined room ${roomId}`);
            console.log(`🏠 Room ${roomId} now has ${room.players.length} players`);
            console.log(`🚀 About to emit game state for room ${roomId}...`);
            room.emitGameState(); // Cập nhật cho mọi người
        } else {
            releaseColor(playerColor);
            socket.emit('error', { message: "Không thể thêm người chơi vào phòng."});
        }
      } else {
        socket.emit('error', { message: "Phòng không tồn tại." });
      }
    });

    socket.on('startGame', () => {
        if (currentRoomId && activeRooms[currentRoomId]) {
            const game = activeRooms[currentRoomId];
            // Chỉ người chơi đầu tiên (host) mới có thể bắt đầu
            if (game.players.length > 0 && socket.id === game.players[0].id && !game.isGameStarted) {
                 if (game.players.length < 2) {
                    socket.emit('error', {message: "Cần ít nhất 2 người chơi để bắt đầu."});
                    return;
                 }
                 console.log(`Host ${socket.id} is starting game in room ${currentRoomId}`);

                 // Start the game
                 game.startGame(); // GameManager sẽ emitGameState

                 // Notify all players that game has started
                 io.to(currentRoomId).emit('gameStarted', {
                   message: 'Game has started!',
                   startedBy: game.players[0].name,
                   playerCount: game.players.length
                 });

            } else if (game.isGameStarted) {
                socket.emit('error', { message: "Game đã bắt đầu rồi."});
            } else {
                socket.emit('error', { message: "Bạn không phải chủ phòng hoặc không đủ người chơi."});
            }
        }
    });

    // --- Các hành động trong game ---
    socket.on('rollDice', () => {
      if (currentRoomId && activeRooms[currentRoomId]) {
        activeRooms[currentRoomId].handlePlayerRollDiceRequest(socket.id);
      }
    });

    socket.on('purchaseDecision', ({ squareId, purchase }) => { // purchase là boolean
      if (currentRoomId && activeRooms[currentRoomId]) {
        activeRooms[currentRoomId].handlePlayerPurchaseDecision(socket.id, squareId, purchase);
      }
    });

    socket.on('buildDecision', ({ squareId, buildingType }) => { // buildingType là string hoặc null nếu không xây
      if (currentRoomId && activeRooms[currentRoomId]) {
        activeRooms[currentRoomId].handlePlayerBuildDecision(socket.id, squareId, buildingType);
      }
    });

    socket.on('jailDecision', ({ decision }) => { // decision: 'PAY_FINE', 'USE_CARD', 'ROLL_DOUBLES' (ROLL_DOUBLES được xử lý qua rollDice)
        if (currentRoomId && activeRooms[currentRoomId]) {
            if (decision === 'ROLL_DOUBLES') { // Nếu client gửi yêu cầu tung xúc xắc từ trong tù
                 activeRooms[currentRoomId].handlePlayerRollDiceRequest(socket.id);
            } else {
                 activeRooms[currentRoomId].handlePlayerJailDecision(socket.id, decision);
            }
        }
    });

    socket.on('endTurn', () => {
        if (currentRoomId && activeRooms[currentRoomId]) {
            activeRooms[currentRoomId].handleEndTurnRequest(socket.id);
        }
    });

    socket.on('useHistoricalCard', () => {
        if (currentRoomId && activeRooms[currentRoomId]) {
            activeRooms[currentRoomId].playerUsesHistoricalCharacterCard(socket.id);
        }
    });

    socket.on('drawEventCard', () => {
        if (currentRoomId && activeRooms[currentRoomId]) {
            console.log('🃏 Player requested to draw event card:', socket.id);
            // This might not be needed if cards are drawn automatically when landing on squares
            // But adding for completeness
        }
    });

    socket.on('proposeAlliance', ({ targetPlayerId }) => {
        if (currentRoomId && activeRooms[currentRoomId]) {
            activeRooms[currentRoomId].proposeAlliance(socket.id, targetPlayerId);
        }
    });

    socket.on('allianceResponse', ({ proposingPlayerId, accepted }) => {
        if (currentRoomId && activeRooms[currentRoomId]) {
            activeRooms[currentRoomId].handleAllianceResponse(socket.id, proposingPlayerId, accepted);
        }
    });

    socket.on('specialActionHorseMove', ({targetSquareId}) => {
        if (currentRoomId && activeRooms[currentRoomId]) {
            activeRooms[currentRoomId].handleSpecialActionHorseMove(socket.id, targetSquareId);
        }
    });

    socket.on('horseDestination', ({targetSquareId}) => {
        if (currentRoomId && activeRooms[currentRoomId]) {
            activeRooms[currentRoomId].handleSpecialActionHorseMove(socket.id, targetSquareId);
        }
    });

    socket.on('specialActionFestival', ({districtSquareId}) => {
        if (currentRoomId && activeRooms[currentRoomId]) {
            activeRooms[currentRoomId].handleSpecialActionFestival(socket.id, districtSquareId);
        }
    });

    // TODO: Thêm các handlers cho: cầm cố, bán tài sản, trả nợ, ...

    // Test event for debugging
    socket.on('test', (data) => {
        console.log('🧪 Received test event from client:', data);
        socket.emit('testResponse', { message: 'Hello from server!', receivedData: data });
    });

    socket.on('disconnect', async () => {
      console.log(`🔌 User disconnected: ${socket.id}`);
      releaseColor(playerColor); // Trả lại màu đã dùng

      // Remove from player tracking
      if (playerRooms.has(socket.id)) {
        const roomId = playerRooms.get(socket.id);
        playerRooms.delete(socket.id);

        if (activeRooms[roomId]) {
          const game = activeRooms[roomId];
          const wasHost = game.players.length > 0 && game.players[0].id === socket.id;

          game.removePlayer(socket.id);

          // Notify other players in room
          socket.to(roomId).emit('playerLeft', { playerId: socket.id });

          if (game.players.length === 0) {
            console.log(`🗑️ Room ${roomId} is now empty. Deleting from memory and database.`);
            delete activeRooms[roomId];

            // Also cleanup from database
            try {
              const Game = require('../models/Game');
              await Game.deleteOne({ roomId });
              console.log(`🗄️ Room ${roomId} deleted from database`);
            } catch (error) {
              console.error(`❌ Failed to delete room ${roomId} from database:`, error);
            }
          } else {
            // If the host disconnected, assign new host (first remaining player)
            if (wasHost && game.players.length > 0) {
              const newHost = game.players[0];
              io.to(roomId).emit('hostChanged', {
                newHostId: newHost.id,
                newHostName: newHost.name
              });
              console.log(`👑 New host assigned after disconnect: ${newHost.name} (${newHost.id}) in room ${roomId}`);
            }

            // Update game state for remaining players
            game.emitGameState();
          }
        }
      }

      currentRoomId = null;
      playerColor = null;
    });

    // Chat message
    socket.on('sendChatMessage', (message) => {
        if (currentRoomId && activeRooms[currentRoomId]) {
            const player = activeRooms[currentRoomId].getPlayerById(socket.id);
            if (player) {
                io.to(currentRoomId).emit('newChatMessage', {
                    senderName: player.name,
                    message: message,
                    senderColor: player.color
                });
            }
        }
    });

    socket.on('manageAssets', ({ action, squareId, buildingType }) => {
        if (currentRoomId && activeRooms[currentRoomId]) {
            activeRooms[currentRoomId].handleManageAssetsRequest(socket.id, action, squareId, buildingType);
        }
    });

    socket.on('paymentDecision', ({ decision, data }) => {
        if (currentRoomId && activeRooms[currentRoomId]) {
            activeRooms[currentRoomId].handlePlayerPaymentDecision(socket.id, decision, data);
        }
    });

    // Leave room handler
    socket.on('leaveRoom', () => {
      if (currentRoomId && activeRooms[currentRoomId]) {
        const game = activeRooms[currentRoomId];
        const wasHost = game.players.length > 0 && game.players[0].id === socket.id;

        game.removePlayer(socket.id);

        // Leave socket room
        socket.leave(currentRoomId);

        // Remove from tracking
        playerRooms.delete(socket.id);

        // Notify other players
        socket.to(currentRoomId).emit('playerLeft', { playerId: socket.id });

        // Release color
        releaseColor(playerColor);

        if (game.players.length === 0) {
          console.log(`Room ${currentRoomId} is now empty after leave. Deleting.`);
          delete activeRooms[currentRoomId];
        } else {
          // If the host left, assign new host (first remaining player)
          if (wasHost && game.players.length > 0) {
            const newHost = game.players[0];
            io.to(currentRoomId).emit('hostChanged', {
              newHostId: newHost.id,
              newHostName: newHost.name
            });
            console.log(`New host assigned: ${newHost.name} (${newHost.id}) in room ${currentRoomId}`);
          }

          game.emitGameState();
        }

        // Reset player state
        currentRoomId = null;
        playerColor = null;

        socket.emit('leftRoom', { message: 'Successfully left room' });
      }
    });

    // Close room handler (host only)
    socket.on('closeRoom', async () => {
      if (currentRoomId && activeRooms[currentRoomId]) {
        const game = activeRooms[currentRoomId];

        // Check if socket is the host (first player)
        if (game.players.length > 0 && game.players[0].id === socket.id) {
          console.log(`Host ${socket.id} is closing room ${currentRoomId}`);

          try {
            // Delete room from database first
            const Game = require('../models/Game');
            const deletedGame = await Game.findOneAndDelete({ roomId: currentRoomId });
            console.log(`🗑️ Deleted room from database:`, deletedGame ? deletedGame.roomId : 'not found');

            // Notify all players in room
            io.to(currentRoomId).emit('roomClosed', {
              message: 'Room has been closed by host',
              hostName: game.players[0].name
            });

            // Remove all players from room
            game.players.forEach(player => {
              const playerSocket = io.sockets.sockets.get(player.id);
              if (playerSocket) {
                playerSocket.leave(currentRoomId);
                playerRooms.delete(player.id);
              }
            });

            // Delete room from active rooms
            delete activeRooms[currentRoomId];

            // Broadcast room list update to all clients
            io.emit('roomListUpdated');

            // Reset host state
            currentRoomId = null;
            playerColor = null;

            socket.emit('roomClosed', { message: 'Room closed successfully' });
          } catch (error) {
            console.error('Error closing room:', error);
            socket.emit('error', { message: 'Failed to close room' });
          }
        } else {
          socket.emit('error', { message: 'Only room host can close the room' });
        }
      }
    });

    // Update room settings handler (host only)
    socket.on('updateRoomSettings', async (settings) => {
      if (currentRoomId && activeRooms[currentRoomId]) {
        const game = activeRooms[currentRoomId];

        // Check if socket is the host (first player)
        if (game.players.length > 0 && game.players[0].id === socket.id) {
          console.log(`Host ${socket.id} is updating room settings for ${currentRoomId}:`, settings);

          try {
            // Update game settings in GameManager
            if (game.updateRoomSettings) {
              await game.updateRoomSettings(settings);
            }

            // Also update in database if game exists
            const Game = require('../models/Game');
            const gameDoc = await Game.findOne({ roomId: currentRoomId });
            if (gameDoc) {
              if (settings.roomName) gameDoc.roomName = settings.roomName;
              if (settings.maxPlayers) gameDoc.settings.maxPlayers = settings.maxPlayers;
              if (settings.isPrivate !== undefined) gameDoc.settings.isPrivate = settings.isPrivate;
              if (settings.password !== undefined) gameDoc.settings.password = settings.password;
              await gameDoc.save();
            }

            // Emit the update to all players
            io.to(currentRoomId).emit('roomSettingsUpdated', {
              settings,
              updatedBy: game.players[0].name,
              roomName: settings.roomName || game.roomName
            });

            socket.emit('success', { message: 'Settings updated successfully' });
          } catch (error) {
            console.error('Error updating room settings:', error);
            socket.emit('error', { message: 'Failed to update room settings' });
          }
        } else {
          socket.emit('error', { message: 'Only room host can update settings' });
        }
      }
    });

  });
};