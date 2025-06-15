// client/src/services/SocketService.js
import io from 'socket.io-client';

class SocketService {
  constructor() {
    this.socket = null;
    this.eventEmitter = null;
    this.isConnected = false;
  }

  initEventEmitter() {
    if (!this.eventEmitter && typeof Phaser !== 'undefined') {
      this.eventEmitter = new Phaser.Events.EventEmitter();
    }
  }

  connect(serverUrl = 'http://localhost:3000') {
    if (this.isConnected) {
      return;
    }

    this.initEventEmitter();
    this.socket = io(serverUrl);

    this.socket.on('connect', () => {
      console.log('🔗 Connected to server with ID:', this.socket.id);
      this.isConnected = true;
      if (this.eventEmitter) {
        this.eventEmitter.emit('connected');
      }
    });

    this.socket.on('disconnect', () => {
      console.log('❌ Disconnected from server');
      this.isConnected = false;
      if (this.eventEmitter) {
        this.eventEmitter.emit('disconnected');
      }
    });

    this.socket.on('error', (errorData) => {
        console.error('Server error:', errorData.message);
        if (this.eventEmitter) {
          this.eventEmitter.emit('serverError', errorData);
        }
    });

    // Test response handler
    this.socket.on('testResponse', (data) => {
        console.log('🧪 Received test response from server:', data);
    });

    // --- Room Events ---
    this.socket.on('roomCreated', (data) => {
      console.log('📥 Received roomCreated:', data);
      if (this.eventEmitter) this.eventEmitter.emit('roomCreated', data);
    });
    this.socket.on('joinedRoom', (data) => {
      if (this.eventEmitter) this.eventEmitter.emit('joinedRoom', data);
    });
    this.socket.on('playerJoined', (data) => {
      if (this.eventEmitter) this.eventEmitter.emit('playerJoined', data);
    });
    this.socket.on('leftRoom', (data) => {
      if (this.eventEmitter) this.eventEmitter.emit('leftRoom', data);
    });
    this.socket.on('playerLeft', (data) => {
      if (this.eventEmitter) this.eventEmitter.emit('playerLeft', data);
    });
    this.socket.on('gameStarted', (data) => {
      if (this.eventEmitter) this.eventEmitter.emit('gameStarted', data);
    });
    this.socket.on('roomClosed', (data) => {
      if (this.eventEmitter) this.eventEmitter.emit('roomClosed', data);
    });
    this.socket.on('roomSettingsUpdated', (data) => {
      if (this.eventEmitter) this.eventEmitter.emit('roomSettingsUpdated', data);
    });
    this.socket.on('roomListUpdated', () => {
      if (this.eventEmitter) this.eventEmitter.emit('roomListUpdated');
    });
    this.socket.on('hostChanged', (data) => {
      if (this.eventEmitter) this.eventEmitter.emit('hostChanged', data);
    });

    // --- Game State & Updates ---
    this.socket.on('gameStateUpdate', (gameState) => {
      console.log('📥 Received gameStateUpdate:', gameState);
      if (this.eventEmitter) this.eventEmitter.emit('gameStateUpdate', gameState);
    });
    this.socket.on('playerUpdate', (playerData) => {
      if (this.eventEmitter) this.eventEmitter.emit('playerUpdate', playerData);
    });
    this.socket.on('squareUpdate', (squareData) => {
      if (this.eventEmitter) this.eventEmitter.emit('squareUpdate', squareData);
    });
    this.socket.on('playerMoved', (moveData) => {
      if (this.eventEmitter) this.eventEmitter.emit('playerMoved', moveData);
    });
    this.socket.on('diceRolled', (diceData) => {
      if (this.eventEmitter) this.eventEmitter.emit('diceRolled', diceData);
    });
    this.socket.on('newGameLog', (logMessage) => {
      if (this.eventEmitter) this.eventEmitter.emit('newGameLog', logMessage);
    });
    this.socket.on('personalGameMessage', (data) => {
      if (this.eventEmitter) this.eventEmitter.emit('personalGameMessage', data);
    });
    this.socket.on('playerDrewCard', (cardData) => {
      if (this.eventEmitter) this.eventEmitter.emit('playerDrewCard', cardData);
    });


    // --- Player Actions & Prompts ---
    this.socket.on('promptAction', (actionData) => {
      if (this.eventEmitter) this.eventEmitter.emit('promptAction', actionData);
    });

    // --- Alliance ---
    this.socket.on('allianceProposed', (proposalData) => {
      if (this.eventEmitter) this.eventEmitter.emit('allianceProposed', proposalData);
    });

    // --- Game End ---
    this.socket.on('gameOver', (gameEndData) => {
      if (this.eventEmitter) this.eventEmitter.emit('gameOver', gameEndData);
    });

    // --- Chat ---
    this.socket.on('newChatMessage', (chatData) => {
      if (this.eventEmitter) this.eventEmitter.emit('newChatMessage', chatData);
    });
    this.socket.on('chatMessage', (chatData) => {
      if (this.eventEmitter) this.eventEmitter.emit('chatMessage', chatData);
    });

  }

  // --- Emit events to server ---
  createRoom(playerName) {
    console.log('📤 Emitting createRoom with playerName:', playerName);
    this.socket.emit('createRoom', { playerName });
  }

  joinRoom(roomId, playerName) {
    console.log('📤 Emitting joinRoom with:', { roomId, playerName });
    console.log('📤 Socket connected:', this.socket?.connected);
    console.log('📤 Socket ID:', this.socket?.id);
    this.socket.emit('joinRoom', { roomId, playerName });
  }

  rollDice() {
    if (this.socket) {
      this.socket.emit('rollDice');
    }
  }

  sendPurchaseDecision(squareId, purchase) {
    if (this.socket) {
      this.socket.emit('purchaseDecision', { squareId, purchase });
    }
  }

  sendBuildDecision(squareId, buildingType) {
    if (this.socket) {
      this.socket.emit('buildDecision', {squareId, buildingType});
    }
  }

  sendJailDecision(decision) { // 'PAY_FINE', 'USE_CARD', 'ROLL_DOUBLES'
    if (this.socket) {
      this.socket.emit('jailDecision', { decision });
    }
  }

  sendEndTurn() {
    if (this.socket) {
      this.socket.emit('endTurn');
    }
  }

  endTurn() {
    this.sendEndTurn();
  }

  sendUseHistoricalCard() {
    if (this.socket) {
      this.socket.emit('useHistoricalCard');
    }
  }

  sendProposeAlliance(targetPlayerId) {
    if (this.socket) {
      this.socket.emit('proposeAlliance', {targetPlayerId});
    }
  }

  sendAllianceResponse(proposingPlayerId, accepted) {
    if (this.socket) {
      this.socket.emit('allianceResponse', {proposingPlayerId, accepted});
    }
  }

  sendSpecialActionHorseMove(targetSquareId) {
    if (this.socket) {
      this.socket.emit('specialActionHorseMove', {targetSquareId});
    }
  }

  sendSpecialActionFestival(districtSquareId) {
    if (this.socket) {
      this.socket.emit('specialActionFestival', {districtSquareId});
    }
  }

  sendChatMessage(message) {
    if (this.socket) {
      this.socket.emit('sendChatMessage', message);
    }
  }

  sendPaymentDecision(decision, data) {
    if (this.socket) {
      this.socket.emit('paymentDecision', { decision, data });
    }
  }

  handleJailDecision(decision) {
    console.log('🏛️ Jail decision:', decision);
    if (this.socket) {
      this.socket.emit('jailDecision', { decision });
    }
  }

  handleHorseDestination(targetSquareId) {
    console.log('🐎 Horse destination:', targetSquareId);
    if (this.socket) {
      this.socket.emit('horseDestination', { targetSquareId });
    }
  }

  buyProperty(squareId) {
    this.sendPurchaseDecision(squareId, true);
  }

  skipAction() {
    if (this.socket) {
      this.socket.emit('purchaseDecision', { decision: false });
    }
  }

  buildBuilding(squareId, buildingType) {
    this.sendBuildDecision(squareId, buildingType);
  }

  // Leave room method
  leaveRoom() {
    if (this.socket) {
      this.socket.emit('leaveRoom');
    }
  }

  // Start game method (for room host)
  startGame() {
    if (this.socket) {
      this.socket.emit('startGame');
    }
  }

  // Close room method (for room host)
  closeRoom() {
    if (this.socket) {
      this.socket.emit('closeRoom');
    }
  }

  // Update room settings method (for room host)
  updateRoomSettings(settings) {
    if (this.socket) {
      this.socket.emit('updateRoomSettings', settings);
    }
  }

  // Generic emit method for direct socket communication
  emit(eventName, data) {
    if (this.socket) {
      this.socket.emit(eventName, data);
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }
  }

  // --- Event listener methods ---
  on(eventName, callback, context) {
    this.initEventEmitter();
    if (this.eventEmitter) {
      this.eventEmitter.on(eventName, callback, context);
    }
  }

  off(eventName, callback, context) {
    if (this.eventEmitter) {
      this.eventEmitter.off(eventName, callback, context);
    }
  }

  removeAllListeners(eventName) {
    if (this.eventEmitter) {
      this.eventEmitter.removeAllListeners(eventName);
    }
  }

  getSocketId() {
    return this.socket ? this.socket.id : null;
  }
}

// Singleton instance
const socketService = new SocketService();
export default socketService;