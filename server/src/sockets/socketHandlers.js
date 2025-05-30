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


module.exports = function(io) {
  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.id}`);
    let currentRoomId = null;
    let playerColor = null;

    socket.on('createRoom', ({ playerName }) => {
      if (!playerName || playerName.trim() === '') {
          socket.emit('error', { message: "Tên người chơi không được để trống."});
          return;
      }
      currentRoomId = uuidv4().slice(0, 6); // Tạo ID phòng ngắn gọn
      const gameManager = new GameManager(currentRoomId, io);
      activeRooms[currentRoomId] = gameManager;
      playerColor = getAvailableColor();

      const player = gameManager.addPlayer({ id: socket.id, name: playerName, color: playerColor });
      if (player) {
        socket.join(currentRoomId);
        socket.emit('roomCreated', { roomId: currentRoomId, playerId: socket.id, initialGameState: gameManager.emitGameState() }); // Gửi trạng thái game ban đầu
        console.log(`Player ${playerName} (${socket.id}) created and joined room ${currentRoomId}`);
      } else {
          releaseColor(playerColor);
          socket.emit('error', { message: "Không thể tạo người chơi."});
      }
    });

    socket.on('joinRoom', ({ roomId, playerName }) => {
      if (!playerName || playerName.trim() === '') {
          socket.emit('error', { message: "Tên người chơi không được để trống."});
          return;
      }
      const room = activeRooms[roomId];
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
            socket.emit('joinedRoom', { roomId, playerId: socket.id, initialGameState: room.emitGameState() });
            // Thông báo cho những người khác trong phòng
            socket.to(roomId).emit('playerJoined', { player: {id: player.id, name: player.name, color: player.color }});
            console.log(`Player ${playerName} (${socket.id}) joined room ${roomId}`);
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
            // Chỉ người chơi đầu tiên (host) mới có thể bắt đầu (cần logic để xác định host)
            // Tạm thời cho phép bất kỳ ai trong phòng bắt đầu nếu game chưa bắt đầu
            if (game.players.length > 0 && socket.id === game.players[0].id && !game.isGameStarted) {
                 if (game.players.length < 2) {
                    socket.emit('error', {message: "Cần ít nhất 2 người chơi để bắt đầu."});
                    return;
                 }
                 console.log(`Player ${socket.id} is starting game in room ${currentRoomId}`);
                 game.startGame(); // GameManager sẽ emitGameState
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

    socket.on('specialActionFestival', ({districtSquareId}) => {
        if (currentRoomId && activeRooms[currentRoomId]) {
            activeRooms[currentRoomId].handleSpecialActionFestival(socket.id, districtSquareId);
        }
    });

    // TODO: Thêm các handlers cho: cầm cố, bán tài sản, trả nợ, ...


    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.id}`);
      releaseColor(playerColor); // Trả lại màu đã dùng
      if (currentRoomId && activeRooms[currentRoomId]) {
        const game = activeRooms[currentRoomId];
        game.removePlayer(socket.id);
        if (game.players.length === 0) {
          console.log(`Room ${currentRoomId} is now empty. Deleting.`);
          delete activeRooms[currentRoomId];
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

  });
};