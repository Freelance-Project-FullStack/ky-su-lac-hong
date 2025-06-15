// server/src/game/GameManager.js
const { v4: uuidv4 } = require('uuid');
const Board = require('./Board');
const Player = require('./Player');
const EventCard = require('./cards/EventCard');
const HistoricalCharacterCard = require('./cards/HistoricalCharacterCard');
const { shuffleArray, rollSingleDice } = require('../utils/helpers');
const { GAME_PHASES, SQUARE_TYPES } = require('./enums');

const rawEventCards = require('../data/eventCards.json');
const rawHistoricalCards = require('../data/historicalCharacterCards.json');
const gameSettingsData = require('../data/gameSettings.json');

class GameManager {
  constructor(roomId, gameSettings, io, roomName = null) {
    this.roomId = roomId;
    this.roomName = roomName || roomId; // Fallback to roomId if no name provided
    this.io = io; // Socket.IO server instance để emit sự kiện
    this.gameSettings = gameSettings || { ...gameSettingsData };
    this.board = new Board();
    this.players = [];
    this.currentPlayerIndex = 0;
    this.dice = [0, 0];
    this.eventCardDeck = [];
    this.historicalCharacterCardDeck = [];
    this.gamePhase = GAME_PHASES.INITIALIZING;
    this.turnNumber = 0;
    this.gameLog = [];
    this.activeAlliances = []; // { player1Id, player2Id, turnsLeft }
    this.isGameStarted = false;
  }

  // Restore game state from database
  restoreGameState(gameState) {
    if (!gameState) return;

    try {
      // Restore basic game properties
      this.currentPlayerIndex = gameState.currentPlayerIndex || 0;
      this.dice = gameState.dice || [0, 0];
      this.gamePhase = gameState.gamePhase || GAME_PHASES.INITIALIZING;
      this.turnNumber = gameState.turnNumber || 0;
      this.gameLog = gameState.gameLog || [];
      this.activeAlliances = gameState.activeAlliances || [];
      this.isGameStarted = gameState.isGameStarted || false;

      // Restore players
      if (gameState.players && Array.isArray(gameState.players)) {
        this.players = gameState.players.map(playerData => {
          const player = new Player(playerData);
          // Restore player properties
          Object.assign(player, playerData);
          return player;
        });
      }

      // Restore board state
      if (gameState.board && gameState.board.squares) {
        gameState.board.squares.forEach(squareData => {
          const square = this.board.getSquareById(squareData.id);
          if (square) {
            square.ownerId = squareData.ownerId;
            square.buildings = squareData.buildings || [];
            square.isMortgaged = squareData.isMortgaged || false;
          }
        });
      }

      // Restore card decks if needed
      if (gameState.eventCardDeck) {
        this.eventCardDeck = gameState.eventCardDeck.map(cardData => new EventCard(cardData));
      }
      if (gameState.historicalCharacterCardDeck) {
        this.historicalCharacterCardDeck = gameState.historicalCharacterCardDeck.map(cardData => new HistoricalCharacterCard(cardData));
      }

      console.log(`✅ Game state restored for room ${this.roomId}`);
    } catch (error) {
      console.error(`❌ Error restoring game state for room ${this.roomId}:`, error);
    }
  }

  // --- Quản lý emit sự kiện ---
  // Gửi trạng thái toàn bộ game cho tất cả người chơi trong phòng
  emitGameState() {
    const state = {
      roomId: this.roomId,
      roomName: this.roomName,
      status: this.isGameStarted ? 'playing' : 'waiting',
      settings: {
        maxPlayers: this.gameSettings.maxPlayers,
        isPrivate: false, // TODO: Add private room support
        password: null
      },
      board: {
          squares: this.board.squares.map(s => ({ // Chỉ gửi thông tin cần thiết
              id: s.id,
              name: s.name,
              type: s.type,
              ownerId: s.ownerId,
              buildings: s.buildings, // Gửi dạng đơn giản nếu cần
              historicalPeriod: s.historicalPeriod,
              purchasePrice: s.purchasePrice,
              isMortgaged: s.isMortgaged
          }))
      },
      players: this.players.map(p => ({
          id: p.id,
          name: p.name,
          color: p.color,
          money: p.money,
          tokenPositionIndex: p.tokenPositionIndex,
          ownedProperties: p.ownedProperties,
          isInJail: p.isInJail,
          jailTurnsRemaining: p.jailTurnsRemaining,
          getOutOfJailFreeCards: p.getOutOfJailFreeCards,
          historicalCharacterCardInHand: p.historicalCharacterCardInHand ? { title: p.historicalCharacterCardInHand.title, descriptionText: p.historicalCharacterCardInHand.descriptionText } : null,
          alliancePartnerId: p.alliancePartnerId,
          monopolySets: p.monopolySets
      })),
      currentPlayerId: this.players.length > 0 ? this.players[this.currentPlayerIndex].id : null,
      gamePhase: this.gamePhase,
      turnNumber: this.turnNumber,
      lastDiceRoll: this.dice,
      gameLog: this.gameLog.slice(-10) // Gửi 10 log gần nhất
    };
    console.log('🚀 Emitting game state to room:', this.roomId);
    console.log('🚀 Players in room:', state.players.map(p => ({ id: p.id, name: p.name })));
    console.log('🚀 Current player:', state.currentPlayerId);
    console.log('🚀 Game phase:', state.gamePhase);
    console.log('🚀 Game status:', state.status);
    this.io.to(this.roomId).emit('gameStateUpdate', state);
  }

  // Gửi thông tin cập nhật của một người chơi cụ thể
  emitPlayerUpdate(player) {
    const playerData = {
        id: player.id,
        money: player.money,
        tokenPositionIndex: player.tokenPositionIndex,
        ownedProperties: player.ownedProperties,
        isInJail: player.isInJail,
        jailTurnsRemaining: player.jailTurnsRemaining,
        getOutOfJailFreeCards: player.getOutOfJailFreeCards,
        historicalCharacterCardInHand: player.historicalCharacterCardInHand ? { title: player.historicalCharacterCardInHand.title } : null,
        monopolySets: player.monopolySets
        // Thêm các thuộc tính khác nếu cần
    };
    this.io.to(this.roomId).emit('playerUpdate', playerData);
  }

  emitPlayerMove(player, newSquareIndex) {
    this.io.to(this.roomId).emit('playerMoved', {
        playerId: player.id,
        newSquareIndex: newSquareIndex,
        diceRoll: this.dice // Gửi kèm kết quả xúc xắc gây ra di chuyển
    });
  }

  emitSquareUpdate(square) {
      const squareData = {
          id: square.id,
          ownerId: square.ownerId,
          buildings: square.buildings,
          isMortgaged: square.isMortgaged
          // Thêm các thuộc tính khác nếu cần
      };
      this.io.to(this.roomId).emit('squareUpdate', squareData);
  }


  // Gửi log game cho tất cả người chơi
  emitGameLog(message) {
    this.io.to(this.roomId).emit('newGameLog', message);
  }

  // Gửi thông báo/lỗi cho một người chơi cụ thể
  emitGameLogToPlayer(playerId, message, type = 'info') { // type: 'info', 'error', 'warning'
    this.io.to(playerId).emit('personalGameMessage', { message, type });
  }

  // Update room settings
  async updateRoomSettings(settings) {
    console.log('🔧 Updating room settings:', settings);

    if (settings.roomName) {
      this.roomName = settings.roomName;
    }

    if (settings.maxPlayers) {
      this.gameSettings.maxPlayers = settings.maxPlayers;
    }

    if (settings.isPrivate !== undefined) {
      this.gameSettings.isPrivate = settings.isPrivate;
    }

    if (settings.password !== undefined) {
      this.gameSettings.password = settings.password;
    }

    console.log('✅ Room settings updated successfully');
  }

  // Yêu cầu client của người chơi hiển thị lựa chọn
  promptPlayerAction(playerId, actionType, data) {
    // actionType: 'LAND_ACTION_BUY', 'LAND_ACTION_BUILD', 'JAIL_OPTIONS', 'SPECIAL_ACTION_HORSE_CHOOSE_DESTINATION', etc.
    // data: thông tin cần thiết cho hành động đó (vd: squareId, price)
    this.io.to(playerId).emit('promptAction', { actionType, data });
    this.setGamePhase(GAME_PHASES.TURN_DECISION); // Chờ người chơi phản hồi
  }


  // --- Thiết lập và bắt đầu game ---
  addPlayer(playerData) { // playerData: { id (socket.id), name, color }
    if (this.players.length >= this.gameSettings.maxPlayers || this.isGameStarted) {
      this.emitGameLogToPlayer(playerData.id, "Phòng đã đầy hoặc game đã bắt đầu.", "error");
      return null;
    }
    const player = new Player({ ...playerData, gameSettings: this.gameSettings });
    player.tokenPositionIndex = this.board.startSquareIndex; // Đặt vị trí ban đầu
    this.players.push(player);
    this.logGameAction(`Người chơi ${player.name} đã tham gia.`);
    this.emitGameState(); // Cập nhật cho mọi người
    return player;
  }

  removePlayer(playerId) {
    const playerIndex = this.players.findIndex(p => p.id === playerId);
    if (playerIndex !== -1) {
        const player = this.players[playerIndex];
        this.logGameAction(`Người chơi ${player.name} đã rời khỏi game.`);
        // Xử lý tài sản của người chơi (ví dụ: trả về ngân hàng)
        player.ownedProperties.forEach(sqId => {
            const square = this.board.getSquareById(sqId);
            if (square) {
                square.setOwner(null);
                square.buildings = [];
                square.isMortgaged = false;
                this.emitSquareUpdate(square);
            }
        });
        this.players.splice(playerIndex, 1);

        if (this.players.length < 2 && this.isGameStarted) { // Cần ít nhất 2 người chơi
            this.endGame(this.players.length === 1 ? this.players[0] : null, "Không đủ người chơi.");
            return;
        }
        // Nếu là lượt của người chơi vừa rời, chuyển lượt
        if (this.currentPlayerIndex >= this.players.length) {
            this.currentPlayerIndex = 0; // Hoặc chọn người tiếp theo một cách cẩn thận
        }
        if (this.players.length > 0 && this.players[this.currentPlayerIndex].id === playerId && this.isGameStarted) {
            this.nextTurn();
        } else {
           this.emitGameState();
        }
    }
  }


  setupGame() {
    if (this.players.length < 2) { // Điều kiện tối thiểu để chơi
        this.logGameAction("Không đủ người chơi để bắt đầu (cần ít nhất 2).");
        this.io.to(this.roomId).emit('gameError', "Không đủ người chơi để bắt đầu (cần ít nhất 2).");
        return false;
    }

    // Xáo bài
    this.eventCardDeck = shuffleArray(rawEventCards.map(cardData => new EventCard(cardData)));
    this.historicalCharacterCardDeck = shuffleArray(rawHistoricalCards.map(cardData => new HistoricalCharacterCard(cardData)));

    // Phát thẻ Nhân Vật ban đầu
    this.players.forEach(player => {
      for (let i = 0; i < this.gameSettings.initialHistoricalCards; i++) {
        if (this.historicalCharacterCardDeck.length > 0) {
          player.historicalCharacterCardInHand = this.historicalCharacterCardDeck.pop();
          this.logGameAction(`${player.name} nhận thẻ Nhân vật: ${player.historicalCharacterCardInHand.title}.`);
        }
      }
      player.tokenPositionIndex = this.board.startSquareIndex;
    });

    this.turnNumber = 1;
    this.currentPlayerIndex = Math.floor(Math.random() * this.players.length); // Người đi đầu ngẫu nhiên
    this.logGameAction("Game đã được thiết lập. Bàn cờ sẵn sàng.");
    this.isGameStarted = true;
    return true;
  }

  startGame() {
    if (!this.isGameStarted) {
      if (!this.setupGame()) return; // Thử setup nếu chưa
    }
    const currentPlayer = this.getCurrentPlayer();
    this.logGameAction(`Game bắt đầu! Lượt của ${currentPlayer.name}.`);
    this.setGamePhase(GAME_PHASES.PLAYER_TURN_START);
    this.emitGameState(); // Gửi trạng thái đầu tiên
    this.startPlayerTurn();
  }

  // --- Luồng chơi ---
  getCurrentPlayer() {
    if (this.players.length === 0) return null;
    return this.players[this.currentPlayerIndex];
  }

  getPlayerById(playerId) {
    return this.players.find(p => p.id === playerId);
  }

  startPlayerTurn() {
    const player = this.getCurrentPlayer();
    if (!player) return;

    this.logGameAction(`Đến lượt của ${player.name}.`);
    this.emitGameLog(`--- Lượt ${this.turnNumber} của ${player.name} ---`);
    player.hasRolledDiceThisTurn = false;
    player.consecutiveDoublesCount = 0; // Reset mỗi đầu lượt mới (trừ khi đang trong tù cố gắng tung đôi)

    // Xử lý nếu người chơi đang ở trong tù
    if (player.isInJail) {
      this.setGamePhase(GAME_PHASES.PLAYER_ACTION); // Trạng thái xử lý trong tù
      this.promptPlayerAction(player.id, 'JAIL_OPTIONS', {
        canPayFine: player.canAfford(this.gameSettings.jailFine),
        canUseCard: player.getOutOfJailFreeCards > 0,
        turnsLeft: player.jailTurnsRemaining
      });
    } else {
      this.setGamePhase(GAME_PHASES.WAITING_FOR_ROLL);
    }
    this.emitGameState(); // Cập nhật để client biết là lượt của ai và phase nào
  }


  nextTurn() {
    // Giảm số lượt liên minh
    this.activeAlliances = this.activeAlliances.map(a => ({...a, turnsLeft: a.turnsLeft -1 })).filter(a => a.turnsLeft > 0);
    // Thông báo nếu có liên minh hết hạn

    this.currentPlayerIndex = (this.currentPlayerIndex + 1) % this.players.length;
    if (this.currentPlayerIndex === 0) { // Nếu quay vòng về người chơi đầu tiên
        // (Có thể bỏ qua, vì turnNumber tăng ở cuối lượt của người chơi cuối cùng trong vòng)
    }
    const nextPlayer = this.getCurrentPlayer();
    if (!nextPlayer) {
        this.logGameAction("Lỗi: Không tìm thấy người chơi tiếp theo.");
        return;
    }
    // Chỉ tăng turnNumber khi một vòng chơi hoàn tất (tức là người chơi đầu tiên của vòng bắt đầu lượt mới)
    // Hoặc đơn giản là tăng mỗi khi người chơi cuối cùng kết thúc lượt
    if (this.currentPlayerIndex === 0 && this.gamePhase === GAME_PHASES.TURN_ENDING) {
         // Điều này không hoàn toàn chính xác, nên tăng turnNumber khi người chơi đầu tiên BẮT ĐẦU lượt
    }
    // Cách tiếp cận khác: tăng turnNumber khi người chơi đầu tiên của vòng bắt đầu lượt
    // if (this.currentPlayerIndex === (this.players.findIndex(p => p.isFirstPlayer) || 0) ) { this.turnNumber++; }

    this.turnNumber++; // Tăng số lượt mỗi khi một người chơi kết thúc và chuyển sang người mới hoàn toàn.
    this.logGameAction(`Chuyển lượt...`);
    this.startPlayerTurn(); // Bắt đầu lượt cho người chơi mới
  }

  // Được gọi bởi player action từ client
  handlePlayerRollDiceRequest(playerId) {
    const player = this.getPlayerById(playerId);
    if (!player || player.id !== this.getCurrentPlayer().id) {
      this.emitGameLogToPlayer(playerId, "Không phải lượt của bạn.", "error");
      return;
    }
    if (player.hasRolledDiceThisTurn && !player.isInJail) { // Trong tù có thể tung nhiều lần để thử ra
      this.emitGameLogToPlayer(playerId, "Bạn đã tung xúc xắc rồi.", "error");
      return;
    }
    if (this.gamePhase !== GAME_PHASES.WAITING_FOR_ROLL && !player.isInJail) {
        this.emitGameLogToPlayer(playerId, "Chưa đến giai đoạn tung xúc xắc.", "error");
        return;
    }

    // Nếu đang trong tù và chọn tung xúc xắc
    if (player.isInJail) {
        player.attemptToGetOutOfJail('ROLL_DOUBLES', this);
        // attemptToGetOutOfJail sẽ xử lý logic di chuyển hoặc kết thúc lượt
        return;
    }

    this.rollDiceAndMove(player);
  }

  rollDiceAndMove(player) {
    const d1 = rollSingleDice();
    const d2 = rollSingleDice();
    this.dice = [d1, d2];
    const totalSteps = d1 + d2;
    const isDouble = d1 === d2;

    this.logGameAction(`${player.name} tung xúc xắc: ${d1} và ${d2} (Tổng: ${totalSteps}) ${isDouble ? '[ĐÔI!]' : ''}`);
    this.io.to(this.roomId).emit('diceRolled', { playerId: player.id, values: this.dice, total: totalSteps, isDouble });


    player.hasRolledDiceThisTurn = true;

    if (isDouble) {
      player.consecutiveDoublesCount++;
      if (player.consecutiveDoublesCount >= this.gameSettings.maxConsecutiveDoubles) {
        this.logGameAction(`${player.name} tung 3 lần đôi liên tiếp! Bị giam cầm 3 lượt.`);
        this.sendPlayerToJail(player, 3); // Giam cầm 3 lượt theo docs
        this.endPlayerTurnActions(false); // false = không được thêm lượt
        return;
      }
    } else {
      player.consecutiveDoublesCount = 0;
    }

    this.movePlayerToken(player, totalSteps);
    this.handlePlayerLandingOnSquare(player, this.board.getSquareByIndex(player.tokenPositionIndex));

    if (isDouble) {
      this.logGameAction(`${player.name} được thêm một lượt tung xúc xắc.`);
      this.setGamePhase(GAME_PHASES.WAITING_FOR_ROLL); // Cho phép tung lại
      player.hasRolledDiceThisTurn = false; // Reset để có thể tung lại
      this.emitGameState(); // Cập nhật phase
    } else {
      // Nếu không phải đôi, và không có action nào cần người chơi quyết định (đã xử lý trong handlePlayerLanding)
      // thì có thể chuyển sang kết thúc lượt. Tuy nhiên, handlePlayerLandingOnSquare có thể set phase là TURN_DECISION
      // Nếu phase vẫn là PLAYER_ACTION (ví dụ đáp xuống ô an toàn), thì chuyển sang TURN_ENDING
      if (this.gamePhase === GAME_PHASES.PLAYER_ACTION) {
        this.setGamePhase(GAME_PHASES.TURN_ENDING);
      }
    }
    this.emitGameState();
  }

  // Dành cho việc tung xúc xắc để ra tù
  rollDiceForJailAttempt(playerId) {
    const player = this.getPlayerById(playerId);
    if (!player || !player.isInJail) return { values: [0,0], total:0, isDouble: false};

    const d1 = rollSingleDice();
    const d2 = rollSingleDice();
    this.dice = [d1, d2];
    const totalSteps = d1 + d2;
    const isDouble = d1 === d2;
    this.logGameAction(`${player.name} (trong tù) tung xúc xắc: ${d1} và ${d2} ${isDouble ? '[ĐÔI!]' : ''}`);
    this.io.to(this.roomId).emit('diceRolled', { playerId: player.id, values: this.dice, total: totalSteps, isDouble, forJail: true });
    return { values: this.dice, total: totalSteps, isDouble };
  }


  movePlayerToken(player, steps, passGoCheck = true) {
    const oldPosition = player.tokenPositionIndex;
    const newPosition = (oldPosition + steps) % this.board.getTotalSquares();
    player.updatePosition(newPosition);

    if (passGoCheck && newPosition < oldPosition && steps > 0) { // Đi qua ô LẬP QUỐC
      let moneyEarned = this.gameSettings.moneyPerLap;
      // Xử lý thẻ nhân vật tăng tiền qua START
      if (player.historicalCharacterCardInHand && player.historicalCharacterCardInHand.activationCondition === 'ON_PASSING_START' && player.historicalCharacterCardInHand.id === 'HC001') { // ID Vua Hùng
          moneyEarned *= 2; // Ví dụ nhân đôi
          this.logGameAction(`${player.name} sử dụng sức mạnh Vua Hùng khi qua LẬP QUỐC.`);
      }
      player.addMoney(moneyEarned);
      this.logGameAction(`${player.name} đi qua LẬP QUỐC, nhận ${moneyEarned} Vàng.`);
      this.emitPlayerUpdate(player);
    }
    this.emitPlayerMove(player, newPosition); // Gửi sự kiện di chuyển cho client
  }

  sendPlayerToJail(player, jailTurns = 3) {
    player.updatePosition(this.board.jailSquareIndex);
    player.isInJail = true;
    player.jailTurnsRemaining = jailTurns; // Số lượt tối đa ở trong tù (không tính lượt này)
    player.consecutiveDoublesCount = 0; // Reset
    this.logGameAction(`${player.name} đã bị đưa vào Giam Cầm ${jailTurns} lượt.`);
    this.emitPlayerMove(player, player.tokenPositionIndex); // Cập nhật vị trí trên UI
    this.emitPlayerUpdate(player); // Cập nhật trạng thái isInJail
  }


  handlePlayerLandingOnSquare(player, square) {
    this.setGamePhase(GAME_PHASES.PLAYER_ACTION); // Đang xử lý hành động trên ô
    square.performLandingAction(player, this); // Ủy quyền cho đối tượng Square
    // performLandingAction có thể thay đổi gamePhase thành TURN_DECISION nếu cần input từ người chơi
    // Sau khi performLandingAction, kiểm tra độc quyền
    if (square.type === SQUARE_TYPES.PROPERTY_LAND && square.ownerId === player.id) {
        player.checkAndAddMonopoly(square.historicalPeriod, this);
    }

    this.emitGameState(); // Cập nhật trạng thái sau khi hành động trên ô
  }

  // --- Xử lý quyết định của người chơi (được gọi từ socket handler) ---
  handlePlayerPurchaseDecision(playerId, squareId, didPurchase) {
    const player = this.getPlayerById(playerId);
    const square = this.board.getSquareById(squareId);
    if (!player || !square || player.id !== this.getCurrentPlayer().id || this.gamePhase !== GAME_PHASES.TURN_DECISION) {
        this.emitGameLogToPlayer(playerId, "Hành động không hợp lệ.", "error");
        return;
    }

    if (didPurchase) {
      if (player.purchaseProperty(square)) {
        this.logGameAction(`${player.name} đã mua ${square.name} với giá ${square.purchasePrice} Vàng.`);
        this.emitPlayerUpdate(player);
        this.emitSquareUpdate(square);
        player.checkAndAddMonopoly(square.historicalPeriod, this); // Kiểm tra độc quyền sau khi mua
      } else {
        this.logGameAction(`${player.name} không thể mua ${square.name}.`);
        this.emitGameLogToPlayer(playerId, `Không đủ ${square.purchasePrice} Vàng để mua ${square.name}.`, "warning");
      }
    } else {
      this.logGameAction(`${player.name} đã bỏ qua việc mua ${square.name}.`);
      // TODO: Logic đấu giá nếu có
    }
    this.endPlayerTurnActions();
  }

  handlePlayerBuildDecision(playerId, squareId, buildingType) {
    const player = this.getPlayerById(playerId);
    const square = this.board.getSquareById(squareId);
     if (!player || !square || player.id !== this.getCurrentPlayer().id || this.gamePhase !== GAME_PHASES.TURN_DECISION) {
        this.emitGameLogToPlayer(playerId, "Hành động không hợp lệ.", "error");
        return;
    }
    if (!buildingType) { // Người chơi chọn không xây
        this.logGameAction(`${player.name} quyết định không xây dựng thêm tại ${square.name}.`);
    } else if (player.buildOnProperty(square, buildingType, this)) { // Hàm buildOnProperty đã trừ tiền và log
        // Log và emit đã được xử lý trong square.addBuilding và player.buildOnProperty
    } else {
        // Log lỗi đã được xử lý trong square.addBuilding
    }
    this.endPlayerTurnActions();
  }

  handlePlayerJailDecision(playerId, decision) { // decision: 'PAY_FINE', 'USE_CARD'
    const player = this.getPlayerById(playerId);
    if (!player || !player.isInJail || player.id !== this.getCurrentPlayer().id || this.gamePhase !== GAME_PHASES.TURN_DECISION) {
        this.emitGameLogToPlayer(playerId, "Hành động không hợp lệ.", "error");
        return;
    }

    let released = false;
    if (decision === 'PAY_FINE') {
        released = player.attemptToGetOutOfJail('PAY_FINE', this);
    } else if (decision === 'USE_CARD') {
        released = player.attemptToGetOutOfJail('USE_CARD', this);
    }

    if (released) {
        this.setGamePhase(GAME_PHASES.WAITING_FOR_ROLL); // Được tung xúc xắc đi tiếp
        player.hasRolledDiceThisTurn = false; // Cho phép tung xúc xắc
    } else {
        // Nếu không ra tù (do không đủ tiền, không có thẻ), và còn lượt thử tung xúc xắc
        if (player.jailTurnsRemaining > 0) {
            this.emitGameLogToPlayer(playerId, `Bạn vẫn ở trong tù. Có thể thử tung xúc xắc hoặc chờ lượt sau.`);
            // Client nên cho phép nút "Tung xúc xắc (ra tù)" hoặc "Kết thúc lượt"
            // Hiện tại, giả sử nếu không trả tiền/dùng thẻ, họ sẽ phải chờ.
            // GameManager không tự động chuyển lượt ở đây, chờ người chơi nhấn "Kết thúc lượt trong tù"
            this.setGamePhase(GAME_PHASES.TURN_ENDING); // Hoặc một phase riêng cho trong tù chờ kết thúc
        } else {
             // Hết lượt thử, đã xử lý trong attemptToGetOutOfJail, giờ chỉ cần kết thúc lượt
            this.endPlayerTurnActions(false); // Không được thêm lượt
        }
    }
    this.emitGameState();
  }

  handleSpecialActionHorseMove(playerId, targetSquareId) {
      console.log('🐎 Horse move request:', {
        playerId,
        targetSquareId,
        currentPlayerId: this.getCurrentPlayer()?.id,
        gamePhase: this.gamePhase,
        expectedPhase: GAME_PHASES.TURN_DECISION
      });

      const player = this.getPlayerById(playerId);
      const targetSquare = this.board.getSquareById(targetSquareId);

      if (!player) {
          console.log('❌ Player not found:', playerId);
          this.emitGameLogToPlayer(playerId, "Không tìm thấy người chơi.", "error");
          return;
      }

      if (!targetSquare) {
          console.log('❌ Target square not found:', targetSquareId);
          this.emitGameLogToPlayer(playerId, "Không tìm thấy ô đích.", "error");
          return;
      }

      if (player.id !== this.getCurrentPlayer().id) {
          console.log('❌ Not current player:', { playerId: player.id, currentPlayerId: this.getCurrentPlayer().id });
          this.emitGameLogToPlayer(playerId, "Không phải lượt của bạn.", "error");
          return;
      }

      if (this.gamePhase !== GAME_PHASES.TURN_DECISION) {
          console.log('❌ Wrong game phase:', { currentPhase: this.gamePhase, expectedPhase: GAME_PHASES.TURN_DECISION });
          this.emitGameLogToPlayer(playerId, "Không thể thực hiện hành động này lúc này.", "error");
          return;
      }
      this.logGameAction(`${player.name} dùng Ngựa Ô di chuyển đến ${targetSquare.name}.`);
      // Di chuyển không qua START
      const targetIndex = this.board.squares.findIndex(sq => sq.id === targetSquareId);
      player.updatePosition(targetIndex);
      this.emitPlayerMove(player, targetIndex);
      this.handlePlayerLandingOnSquare(player, targetSquare); // Xử lý ô mới đáp xuống
      // Sau đó, nếu không có action gì cần quyết định nữa, thì kết thúc lượt
      if (this.gamePhase === GAME_PHASES.PLAYER_ACTION) {
           this.endPlayerTurnActions();
      } else {
           this.emitGameState(); // Nếu landing action yêu cầu quyết định tiếp
      }
  }

  handleSpecialActionFestival(playerId, districtSquareId) {
      const player = this.getPlayerById(playerId);
      const districtSquare = this.board.getSquareById(districtSquareId);
      if (!player || !districtSquare || player.id !== this.getCurrentPlayer().id || this.gamePhase !== GAME_PHASES.TURN_DECISION) {
          this.emitGameLogToPlayer(playerId, "Hành động không hợp lệ.", "error");
          return;
      }
      if (districtSquare.ownerId !== playerId) {
          this.emitGameLogToPlayer(playerId, "Bạn không sở hữu vùng đất này.", "error");
          this.endPlayerTurnActions();
          return;
      }
      // Tăng thuế (ví dụ gấp đôi baseRent của ô đó, hoặc một mức cố định)
      // Cần một cách để lưu trữ "thuế lễ hội" này và thời hạn của nó
      districtSquare.currentTaxAmount = (districtSquare.baseRent || 1000) * 2; // Ví dụ
      this.logGameAction(`${player.name} tổ chức Lễ Hội tại ${districtSquare.name}, thuế/thuê tại đây tăng gấp đôi.`);
      this.emitSquareUpdate(districtSquare);
      this.endPlayerTurnActions();
  }

  handlePlayerPaymentDecision(playerId, decision, data) {
      const player = this.getPlayerById(playerId);
      if (!player || player.id !== this.getCurrentPlayer().id || this.gamePhase !== GAME_PHASES.TURN_DECISION) {
          this.emitGameLogToPlayer(playerId, "Hành động không hợp lệ.", "error");
          return;
      }

      switch(decision) {
          case 'PAY_RENT':
              const creditor = data.creditorId === 'bank' ? 'bank' : this.getPlayerById(data.creditorId);
              player.payRentOrTax(data.amount, creditor, this);
              this.endPlayerTurnActions();
              break;
          case 'PURCHASE_PROPERTY':
              this.handlePropertyPurchaseFromOwner(playerId, data.squareId, data.purchasePrice);
              break;
          case 'CHALLENGE_OWNER':
              this.initiateChallengeMode(playerId, data.creditorId, data.squareId);
              break;
          default:
              this.emitGameLogToPlayer(playerId, "Lựa chọn không hợp lệ.", "error");
      }
  }

  handlePropertyPurchaseFromOwner(buyerId, squareId, purchasePrice) {
      const buyer = this.getPlayerById(buyerId);
      const square = this.board.getSquareById(squareId);
      const owner = this.getPlayerById(square.ownerId);

      if (!buyer.canAfford(purchasePrice)) {
          this.emitGameLogToPlayer(buyerId, "Không đủ tiền để mua lại.", "error");
          this.endPlayerTurnActions();
          return;
      }

      buyer.subtractMoney(purchasePrice);
      owner.addMoney(purchasePrice);

      // Chuyển quyền sở hữu
      owner.ownedProperties = owner.ownedProperties.filter(id => id !== squareId);
      buyer.ownedProperties.push(squareId);
      square.setOwner(buyerId);

      this.logGameAction(`${buyer.name} đã mua lại ${square.name} từ ${owner.name} với giá ${purchasePrice} Vàng.`);
      this.emitPlayerUpdate(buyer);
      this.emitPlayerUpdate(owner);
      this.emitSquareUpdate(square);
      this.endPlayerTurnActions();
  }

  initiateChallengeMode(challengerId, defenderId, squareId) {
      const challenger = this.getPlayerById(challengerId);
      const defender = this.getPlayerById(defenderId);
      const square = this.board.getSquareById(squareId);

      this.logGameAction(`${challenger.name} thách đấu ${defender.name} để tranh giành ${square.name}!`);

      // Cả hai người tung xúc xắc, người có điểm cao hơn thắng
      const challengerRoll = this.rollSingleDice() + this.rollSingleDice();
      const defenderRoll = this.rollSingleDice() + this.rollSingleDice();

      this.logGameAction(`${challenger.name} tung được: ${challengerRoll}`);
      this.logGameAction(`${defender.name} tung được: ${defenderRoll}`);

      if (challengerRoll > defenderRoll) {
          // Challenger thắng, chiếm đất
          defender.ownedProperties = defender.ownedProperties.filter(id => id !== squareId);
          challenger.ownedProperties.push(squareId);
          square.setOwner(challengerId);
          this.logGameAction(`${challenger.name} thắng thách đấu và chiếm được ${square.name}!`);
      } else if (defenderRoll > challengerRoll) {
          // Defender thắng, challenger phải trả tiền thuê gấp đôi
          const doubleRent = square.calculateCurrentRent(challenger, this) * 2;
          challenger.payRentOrTax(doubleRent, defender, this);
          this.logGameAction(`${defender.name} thắng thách đấu! ${challenger.name} phải trả gấp đôi tiền thuê: ${doubleRent} Vàng.`);
      } else {
          // Hòa, challenger chỉ trả tiền thuê bình thường
          const normalRent = square.calculateCurrentRent(challenger, this);
          challenger.payRentOrTax(normalRent, defender, this);
          this.logGameAction(`Thách đấu hòa! ${challenger.name} trả tiền thuê bình thường: ${normalRent} Vàng.`);
      }

      this.emitPlayerUpdate(challenger);
      this.emitPlayerUpdate(defender);
      this.emitSquareUpdate(square);
      this.endPlayerTurnActions();
  }

  rollSingleDice() {
      return Math.floor(Math.random() * 6) + 1;
  }

  requestPlayerPayment(debtorId, creditorIdOrBank, amount, reason, options = {}) {
      const debtor = this.getPlayerById(debtorId);
      if (!debtor) return;

      this.emitGameLog(`${debtor.name} phải trả ${amount} Vàng cho ${creditorIdOrBank === 'bank' ? 'ngân hàng' : this.getPlayerById(creditorIdOrBank)?.name} (${reason}).`);

      if (debtor.canAfford(amount)) {
          // Nếu có thể mua lại hoặc thách đấu
          if (options.allowPurchase || options.allowChallenge) {
              this.promptPlayerAction(debtor.id, 'PAYMENT_OPTIONS', {
                  amount,
                  reason,
                  creditorId: creditorIdOrBank,
                  allowPurchase: options.allowPurchase,
                  purchasePrice: options.purchasePrice,
                  allowChallenge: options.allowChallenge && creditorIdOrBank !== 'bank',
                  squareId: options.squareId
              });
          } else {
              const creditor = creditorIdOrBank === 'bank' ? 'bank' : this.getPlayerById(creditorIdOrBank);
              debtor.payRentOrTax(amount, creditor, this);
          }
      } else {
          this.emitGameLogToPlayer(debtorId, `Bạn không đủ ${amount} Vàng để trả. Cần bán tài sản hoặc cầm cố.`);
          this.handlePlayerInDebt(debtor, creditorIdOrBank, amount);
      }
  }

  handlePlayerInDebt(debtorPlayer, creditorOrBank, amountOwed) {
      // Logic phức tạp:
      // 1. Cho phép người chơi bán công trình, cầm cố đất.
      // 2. Nếu vẫn không đủ, cho phép bán đất cho người chơi khác (nếu có luật) hoặc cho ngân hàng.
      // 3. Nếu vẫn không đủ -> Phá sản.
      this.logGameAction(`${debtorPlayer.name} thiếu ${amountOwed} Vàng.`);
      this.promptPlayerAction(debtorPlayer.id, 'MANAGE_DEBT', {
          amountOwed,
          creditorId: typeof creditorOrBank === 'string' ? creditorOrBank : creditorOrBank.id,
          // Gửi thông tin tài sản có thể bán/cầm cố
          sellableProperties: debtorPlayer.ownedProperties.map(sqId => {
              const sq = this.board.getSquareById(sqId);
              return { id: sq.id, name: sq.name, mortgageValue: sq.purchasePrice / 2, buildings: sq.buildings }; // Giả sử giá cầm cố = 1/2 giá mua
          })
      });
      // Game sẽ chờ người chơi giải quyết nợ. Phase là TURN_DECISION
  }

  // --- Thẻ bài ---
  playerDrawsEventCard(player, deckType) { // deckType: EVENT_CHANCE or EVENT_FATE
    console.log('🃏 Drawing event card:', {
      playerName: player.name,
      deckType,
      totalEventCards: this.eventCardDeck.length
    });

    let deckToDrawFrom = [];
    if (deckType === SQUARE_TYPES.EVENT_CHANCE) {
        deckToDrawFrom = this.eventCardDeck.filter(c => c.cardType === 'EVENT_OPPORTUNITY');
    } else if (deckType === SQUARE_TYPES.EVENT_FATE) {
        deckToDrawFrom = this.eventCardDeck.filter(c => c.cardType === 'EVENT_FATE');
    } else { // Fallback, or if you have a single event deck
        deckToDrawFrom = this.eventCardDeck;
    }

    console.log('🃏 Available cards in deck:', deckToDrawFrom.length);

    if (deckToDrawFrom.length === 0) {
      console.log('🃏 No cards available in deck');
      this.logGameAction("Bộ bài Sự Kiện đã hết!");
      // Có thể xáo lại các thẻ đã dùng (nếu có)
      return null;
    }
    const card = deckToDrawFrom.pop(); // Lấy thẻ trên cùng
    this.eventCardDeck.unshift(card); // Đặt lại xuống dưới cùng bộ bài chính (hoặc có 1 discard pile riêng)

    console.log('🃏 Card drawn:', {
      title: card.title,
      eventType: card.eventType,
      description: card.descriptionText
    });

    this.emitGameLogToPlayer(player.id, `Bạn rút thẻ: ${card.title} - ${card.descriptionText}`, 'event');
    this.io.to(this.roomId).emit('playerDrewCard', { playerId: player.id, card: {title: card.title, descriptionText: card.descriptionText, cardType: card.cardType }});
    return card;
  }

  applyEventCardEffect(player, card) {
    console.log('🃏 Applying event card effect:', {
      cardTitle: card.title,
      cardType: card.eventType,
      playerName: player.name,
      currentPhase: this.gamePhase
    });

    card.applyEffect(player, this); // Thẻ tự áp dụng hiệu ứng

    console.log('🃏 After card effect, phase:', this.gamePhase);

    // applyEffect của thẻ có thể thay đổi phase nếu cần thêm input
    // Nếu không, và phase vẫn là PLAYER_ACTION, thì chuyển sang kết thúc lượt
    if (this.gamePhase === GAME_PHASES.PLAYER_ACTION) {
        console.log('🃏 Card effect completed, ending turn');
        this.endPlayerTurnActions();
    } else {
        console.log('🃏 Card effect changed phase, emitting game state');
        this.emitGameState();
    }
  }

  playerUsesHistoricalCharacterCard(playerId) {
    const player = this.getPlayerById(playerId);
     if (!player || player.id !== this.getCurrentPlayer().id) {
        this.emitGameLogToPlayer(playerId, "Không phải lượt của bạn hoặc không tìm thấy bạn.", "error");
        return;
    }
    if (!player.historicalCharacterCardInHand) {
        this.emitGameLogToPlayer(playerId, "Bạn không có thẻ Nhân Vật nào.", "warning");
        return;
    }
    // Kiểm tra điều kiện kích hoạt, ví dụ 'ANY_TIME'
    if (player.historicalCharacterCardInHand.activationCondition === 'ANY_TIME' || this.gamePhase === GAME_PHASES.PLAYER_TURN_START || this.gamePhase === GAME_PHASES.WAITING_FOR_ROLL) {
        player.useHistoricalCard(this); // method này trong Player sẽ gọi applyEffect của Card
        // useHistoricalCard sẽ emit player update
        this.emitGameState(); // Cập nhật lại cho client thấy thẻ đã biến mất
    } else {
        this.emitGameLogToPlayer(playerId, `Không thể dùng thẻ ${player.historicalCharacterCardInHand.title} vào lúc này.`, "warning");
    }
  }

  // --- Kết thúc lượt / Game ---
  handleEndTurnRequest(playerId) {
      const player = this.getPlayerById(playerId);
      if (!player || player.id !== this.getCurrentPlayer().id) {
          this.emitGameLogToPlayer(playerId, "Không phải lượt của bạn.", "error");
          return;
      }
      // Chỉ cho phép kết thúc lượt ở một số phase nhất định
      if (this.gamePhase === GAME_PHASES.TURN_ENDING ||
          (player.isInJail && this.gamePhase === GAME_PHASES.PLAYER_ACTION && player.jailTurnsRemaining <=0 ) || // Bị buộc kết thúc lượt khi ở tù quá lâu mà ko ra đc
          (player.isInJail && this.gamePhase === GAME_PHASES.PLAYER_ACTION && player.jailTurnsRemaining > 0 && !player.hasRolledDiceThisTurn ) // Quyết định không làm gì trong tù
          ) {
           this.endPlayerTurnActions(false); // false = không được thêm lượt (vì đã qua giai đoạn tung xúc xắc)
      } else if (this.gamePhase === GAME_PHASES.WAITING_FOR_ROLL && player.hasRolledDiceThisTurn && player.consecutiveDoublesCount === 0) {
          // Trường hợp này xảy ra nếu người chơi tung xúc xắc, xử lý ô, không được thêm lượt, và không có quyết định nào đang chờ
          this.endPlayerTurnActions(false);
      }
      else {
          this.emitGameLogToPlayer(playerId, "Chưa thể kết thúc lượt.", "warning");
      }
  }

  // Xử lý các hành động cuối cùng của lượt, kiểm tra thắng, rồi chuyển lượt
  endPlayerTurnActions(gainedExtraTurn = false) {
    const player = this.getCurrentPlayer();
    if (!player) return;

    this.checkWinConditions(); // Kiểm tra điều kiện thắng
    if (this.gamePhase === GAME_PHASES.GAME_OVER) {
      return; // Không chuyển lượt nếu game đã kết thúc
    }

    if (gainedExtraTurn) {
      this.logGameAction(`${player.name} được thêm một lượt.`);
      this.setGamePhase(GAME_PHASES.WAITING_FOR_ROLL);
      player.hasRolledDiceThisTurn = false; // Cho phép tung lại
      this.emitGameState();
    } else {
      this.setGamePhase(GAME_PHASES.TURN_ENDING); // Đánh dấu là đang kết thúc lượt thực sự
      this.emitGameState(); // Cho client biết là lượt đã kết thúc
      this.nextTurn();
    }
  }


  checkWinConditions() {
    // Các điều kiện thắng theo docs:
    // 1. Thống nhất được lãnh thổ của 1 thời kỳ (chiếm được 8 ô cùng 1 dãy)
    // 2. Chiếm được 4 con sông 4 thời kỳ
    // 3. Là người giàu nhất khi hết thời gian (do người chơi tự setup thời gian)
    // 4. Khi người chơi đạt monopoly 3 lần
    // 5. Người chơi khác phá sản hết

    const activePlayers = this.players.filter(p => !p.isBankrupt);
    if (activePlayers.length === 1 && this.players.length > 1) {
      this.endGame(activePlayers[0], "là người sống sót cuối cùng.");
      return true;
    }

    for (const player of this.players) {
      if (player.isBankrupt) continue;

      // Điều kiện 1: Thống nhất lãnh thổ 1 thời kỳ (8 ô liên tiếp cùng thời kỳ)
      if (this.checkTerritoryUnification(player)) {
        this.endGame(player, "đã thống nhất lãnh thổ của một thời kỳ!");
        return true;
      }

      // Điều kiện 2: Chiếm 4 con sông 4 thời kỳ khác nhau
      if (this.checkRiverControl(player)) {
        this.endGame(player, "đã chiếm được 4 con sông của 4 thời kỳ!");
        return true;
      }

      // Điều kiện 4: Đạt monopoly 3 lần
      if (player.monopolySets.length >= this.gameSettings.winConditions.monopolyCount) {
        this.endGame(player, `đã sở hữu ${player.monopolySets.length} bộ độc quyền!`);
        return true;
      }
    }

    return false;
  }

  checkTerritoryUnification(player) {
    // Kiểm tra xem player có sở hữu 8 ô liên tiếp cùng thời kỳ không
    const periods = ['Hùng Vương', 'An Dương Vương', 'Lý', 'Trần', 'Lê'];

    for (const period of periods) {
      const periodSquares = this.board.getSquaresByHistoricalPeriod(period);
      const ownedInPeriod = periodSquares.filter(sq => player.ownedProperties.includes(sq.id));

      if (ownedInPeriod.length >= this.gameSettings.winConditions.territoryUnificationSquares) {
        return true;
      }
    }
    return false;
  }

  checkRiverControl(player) {
    // Kiểm tra xem player có sở hữu 4 con sông của 4 thời kỳ khác nhau không
    const riverSquares = this.board.squares.filter(sq => sq.type === SQUARE_TYPES.RIVER && sq.isOwned());
    const ownedRivers = riverSquares.filter(sq => sq.ownerId === player.id);

    const uniquePeriods = new Set(ownedRivers.map(sq => sq.historicalPeriod));
    return uniquePeriods.size >= this.gameSettings.winConditions.riverSquaresRequired;
  }

  endGame(winner, reason) {
    this.setGamePhase(GAME_PHASES.GAME_OVER);
    this.isGameStarted = false;
    let message = "Ván đấu kết thúc. ";
    if (winner) {
      message += `Người chiến thắng là ${winner.name} vì ${reason}`;
      this.logGameAction(message);
    } else {
      message += reason || "Không có người chiến thắng (hòa hoặc lý do khác).";
      this.logGameAction(message);
    }
    this.io.to(this.roomId).emit('gameOver', { winner: winner ? {id: winner.id, name: winner.name} : null, reason, gameLog: this.gameLog });
    // Dọn dẹp hoặc lưu trữ game session
  }

  resetGame() {
    // Đặt lại toàn bộ trạng thái game về ban đầu
    // Thường được gọi để chuẩn bị ván mới với cùng người chơi
    this.board = new Board(); // Tạo lại board nếu có thay đổi (ít khi)
    this.players.forEach(p => {
        p.money = this.gameSettings.startingMoney;
        p.tokenPositionIndex = this.board.startSquareIndex;
        p.ownedProperties = [];
        p.historicalCharacterCardInHand = null;
        p.isInJail = false;
        p.jailTurnsRemaining = 0;
        p.consecutiveDoublesCount = 0;
        p.hasRolledDiceThisTurn = false;
        p.alliancePartnerId = null;
        p.allianceTurnsLeft = 0;
        p.monopolySets = [];
        p.getOutOfJailFreeCards = 0;
    });
    this.currentPlayerIndex = 0;
    this.dice = [0, 0];
    this.eventCardDeck = [];
    this.historicalCharacterCardDeck = [];
    this.gamePhase = GAME_PHASES.INITIALIZING;
    this.turnNumber = 0;
    this.gameLog = ["Game đã được reset."];
    this.activeAlliances = [];
    this.isGameStarted = false;
    // Không setupGame() ngay, chờ host bắt đầu lại
    this.emitGameState();
  }

  logGameAction(actionDescription) {
    const timestamp = new Date().toLocaleTimeString();
    const logEntry = `[${timestamp}] ${actionDescription}`;
    this.gameLog.push(logEntry);
    console.log(`[Room: ${this.roomId}] ${logEntry}`); // Log ra console server
    this.emitGameLog(actionDescription); // Gửi log rút gọn cho client
  }

  setGamePhase(newPhase) {
    this.gamePhase = newPhase;
    this.logGameAction(`Game phase changed to: ${newPhase}`);
    // Không emitGameState ở đây, để các hàm gọi tự quyết định khi nào emit
  }

  // --- Liên minh ---
  proposeAlliance(requestingPlayerId, targetPlayerId) {
    const requestingPlayer = this.getPlayerById(requestingPlayerId);
    const targetPlayer = this.getPlayerById(targetPlayerId);

    if (!requestingPlayer || !targetPlayer || requestingPlayerId === targetPlayerId) {
        this.emitGameLogToPlayer(requestingPlayerId, "Không thể gửi lời mời liên minh.", "error");
        return;
    }
    if (requestingPlayer.alliancePartnerId || targetPlayer.alliancePartnerId) {
        this.emitGameLogToPlayer(requestingPlayerId, "Một trong hai người đã có liên minh.", "warning");
        return;
    }

    this.logGameAction(`${requestingPlayer.name} gửi lời mời liên minh đến ${targetPlayer.name}.`);
    // Gửi yêu cầu đến targetPlayer trên client
    this.io.to(targetPlayer.id).emit('allianceProposed', {
        fromPlayerId: requestingPlayer.id,
        fromPlayerName: requestingPlayer.name
    });
    // Có thể đặt một timeout cho lời mời
  }

  handleAllianceResponse(respondingPlayerId, proposingPlayerId, accepted) {
    const respondingPlayer = this.getPlayerById(respondingPlayerId);
    const proposingPlayer = this.getPlayerById(proposingPlayerId);

    if (!respondingPlayer || !proposingPlayer) return;

    if (accepted) {
        if (respondingPlayer.alliancePartnerId || proposingPlayer.alliancePartnerId) {
            this.emitGameLogToPlayer(respondingPlayerId, "Không thể chấp nhận, một trong hai đã có liên minh khác.", "warning");
            this.emitGameLogToPlayer(proposingPlayerId, `${respondingPlayer.name} không thể chấp nhận liên minh (đã có liên minh khác).`, "warning");
            return;
        }
        const allianceId = uuidv4();
        const turns = this.gameSettings.allianceDurationTurns;
        this.activeAlliances.push({ id: allianceId, players: [respondingPlayerId, proposingPlayerId], turnsLeft: turns });
        respondingPlayer.alliancePartnerId = proposingPlayerId;
        proposingPlayer.alliancePartnerId = respondingPlayerId;
        respondingPlayer.allianceTurnsLeft = turns;
        proposingPlayer.allianceTurnsLeft = turns;

        this.logGameAction(`${respondingPlayer.name} đã chấp nhận lời mời liên minh từ ${proposingPlayer.name} (Thời hạn: ${turns} lượt).`);
        this.emitPlayerUpdate(respondingPlayer);
        this.emitPlayerUpdate(proposingPlayer);
        this.emitGameState(); // Cập nhật cho mọi người
    } else {
        this.logGameAction(`${respondingPlayer.name} đã từ chối lời mời liên minh từ ${proposingPlayer.name}.`);
        this.emitGameLogToPlayer(proposingPlayerId, `${respondingPlayer.name} đã từ chối lời mời liên minh của bạn.`, "info");
    }
  }

  // Gọi ở đầu mỗi lượt của GameManager hoặc cuối lượt của người chơi
  updateAlliances() {
    let alliancesChanged = false;
    this.activeAlliances.forEach(alliance => {
        // Giả sử turnsLeft được giảm ở nextTurn()
        if (alliance.turnsLeft <= 0) {
            const p1 = this.getPlayerById(alliance.players[0]);
            const p2 = this.getPlayerById(alliance.players[1]);
            if (p1) {
                p1.alliancePartnerId = null;
                p1.allianceTurnsLeft = 0;
                this.emitPlayerUpdate(p1);
            }
            if (p2) {
                p2.alliancePartnerId = null;
                p2.allianceTurnsLeft = 0;
                this.emitPlayerUpdate(p2);
            }
            this.logGameAction(`Liên minh giữa ${p1?.name} và ${p2?.name} đã kết thúc.`);
            alliancesChanged = true;
        }
    });
    this.activeAlliances = this.activeAlliances.filter(a => a.turnsLeft > 0);
    if (alliancesChanged) {
        this.emitGameState();
    }
  }

  handleManageAssetsRequest(playerId, action, squareId, buildingType) {
    const player = this.getPlayerById(playerId);
    const square = this.board.getSquareById(squareId);

    if (!player || !square || square.ownerId !== playerId) {
        this.emitGameLogToPlayer(playerId, "Hành động không hợp lệ.", "error");
        return;
    }
    // Chỉ cho phép quản lý tài sản khi đến lượt hoặc đang nợ
    if (player.id !== this.getCurrentPlayer().id && !player.isIndebted) { // Cần thêm trạng thái isIndebted cho player
         this.emitGameLogToPlayer(playerId, "Chưa thể quản lý tài sản.", "warning");
         return;
    }

    switch(action) {
      case 'SELL_BUILDING':
        square.sellBuilding(player, buildingType, this);
        break;
      case 'MORTGAGE':
        square.mortgage(player, this);
        break;
      case 'UNMORTGAGE':
        square.unmortgage(player, this);
        break;
      default:
        this.emitGameLogToPlayer(playerId, "Hành động quản lý tài sản không xác định.", "error");
    }

    // Sau khi quản lý tài sản, kiểm tra lại xem người chơi đã trả được nợ chưa (nếu có)
    if (player.isIndebted) {
        // Cần lưu thông tin nợ trên đối tượng player
        if (player.canAfford(player.debtAmount)) {
            this.logGameAction(`${player.name} đã có đủ tiền để trả nợ.`);
            const creditor = player.creditorId === 'bank' ? 'bank' : this.getPlayerById(player.creditorId);
            player.payRentOrTax(player.debtAmount, creditor, this);
            player.isIndebted = false;
            player.debtAmount = 0;
            player.creditorId = null;
            this.emitGameLogToPlayer(player.id, "Bạn đã trả nợ thành công!", "info");
            this.endPlayerTurnActions(); // Giờ mới kết thúc lượt
        }
    }
  }

  // Sửa lại hàm handlePlayerInDebt
  handlePlayerInDebt(debtorPlayer, creditorOrBank, amountOwed) {
      this.logGameAction(`${debtorPlayer.name} thiếu ${amountOwed} Vàng.`);
      // Lưu lại thông tin nợ
      debtorPlayer.isIndebted = true;
      debtorPlayer.debtAmount = amountOwed;
      debtorPlayer.creditorId = typeof creditorOrBank === 'string' ? creditorOrBank : creditorOrBank.id;

      // Lấy danh sách tài sản có thể bán/cầm cố
      const sellableProperties = debtorPlayer.ownedProperties.map(sqId => {
          const sq = this.board.getSquareById(sqId);
          if (!sq) return null;
          return {
              id: sq.id,
              name: sq.name,
              isMortgaged: sq.isMortgaged,
              mortgageValue: sq.purchasePrice / 2,
              buildings: sq.buildings.map(b => ({ type: b.type, sellValue: (sq.buildingCost[b.type] || 0) / 2 }))
          };
      }).filter(Boolean);

      // Nếu không còn gì để bán/cầm cố mà vẫn thiếu tiền -> Phá sản
      if (sellableProperties.length === 0 && !debtorPlayer.canAfford(amountOwed)) {
          this.declareBankruptcy(debtorPlayer, creditorOrBank);
          return;
      }

      this.promptPlayerAction(debtorPlayer.id, 'MANAGE_DEBT', {
          amountOwed,
          currentMoney: debtorPlayer.money,
          assets: sellableProperties
      });
      this.setGamePhase(GAME_PHASES.PLAYER_ACTION); // Đặt phase để người chơi không làm gì khác ngoài xử lý nợ
  }

  declareBankruptcy(bankruptPlayer, creditorOrBank) {
    this.logGameAction(`!!! ${bankruptPlayer.name} đã tuyên bố PHÁ SẢN !!!`);
    bankruptPlayer.isBankrupt = true; // Thêm thuộc tính này vào Player class

    let creditor = creditorOrBank === 'bank' ? null : this.getPlayerById(creditorOrBank.id);

    // Chuyển toàn bộ tài sản cho chủ nợ hoặc ngân hàng
    bankruptPlayer.ownedProperties.forEach(sqId => {
      const square = this.board.getSquareById(sqId);
      if (square) {
        if (creditor) { // Chuyển cho người chơi khác
            square.setOwner(creditor.id);
            creditor.ownedProperties.push(sq.id);
            // Công trình có thể bị xóa hoặc giữ lại tùy luật
            // Luật đơn giản: chủ nợ nhận đất nhưng phải mua lại công trình từ ngân hàng nếu muốn giữ
            square.buildings = [];
            this.logGameAction(`${square.name} được chuyển cho ${creditor.name}.`);
        } else { // Trả về cho ngân hàng
            square.setOwner(null);
            square.buildings = [];
            square.isMortgaged = false; // Ngân hàng xóa nợ cầm cố
            this.logGameAction(`${square.name} được trả lại cho ngân hàng.`);
        }
        this.emitSquareUpdate(square);
      }
    });

    // Chuyển toàn bộ tiền còn lại
    if (creditor && bankruptPlayer.money > 0) {
      creditor.addMoney(bankruptPlayer.money);
      this.logGameAction(`${bankruptPlayer.name} chuyển ${bankruptPlayer.money} Vàng cuối cùng cho ${creditor.name}.`);
      this.emitPlayerUpdate(creditor);
    }

    // Xóa người chơi khỏi game
    this.removePlayer(bankruptPlayer.id); // Hàm removePlayer đã có từ trước, nó sẽ xử lý việc chuyển lượt và kiểm tra thắng thua.
  }
}

module.exports = GameManager;