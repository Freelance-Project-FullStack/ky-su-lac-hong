// client/src/services/SocketService.js
import io from 'socket.io-client';

class SocketService {
  constructor() {
    this.socket = null;
    this.eventEmitter = new Phaser.Events.EventEmitter();
  }

  connect(serverUrl = 'http://localhost:3000') {
    this.socket = io(serverUrl);

    this.socket.on('connect', () => {
      console.log('Connected to server with ID:', this.socket.id);
      this.eventEmitter.emit('connected');
    });

    this.socket.on('disconnect', () => {
      console.log('Disconnected from server');
      this.eventEmitter.emit('disconnected');
    });

    this.socket.on('error', (errorData) => {
        console.error('Server error:', errorData.message);
        this.eventEmitter.emit('serverError', errorData);
    });

    // --- Room Events ---
    this.socket.on('roomCreated', (data) => this.eventEmitter.emit('roomCreated', data));
    this.socket.on('joinedRoom', (data) => this.eventEmitter.emit('joinedRoom', data));
    this.socket.on('playerJoined', (data) => this.eventEmitter.emit('playerJoined', data)); // Người khác join

    // --- Game State & Updates ---
    this.socket.on('gameStateUpdate', (gameState) => this.eventEmitter.emit('gameStateUpdate', gameState));
    this.socket.on('playerUpdate', (playerData) => this.eventEmitter.emit('playerUpdate', playerData));
    this.socket.on('squareUpdate', (squareData) => this.eventEmitter.emit('squareUpdate', squareData));
    this.socket.on('playerMoved', (moveData) => this.eventEmitter.emit('playerMoved', moveData));
    this.socket.on('diceRolled', (diceData) => this.eventEmitter.emit('diceRolled', diceData));
    this.socket.on('newGameLog', (logMessage) => this.eventEmitter.emit('newGameLog', logMessage));
    this.socket.on('personalGameMessage', (data) => this.eventEmitter.emit('personalGameMessage', data));
    this.socket.on('playerDrewCard', (cardData) => this.eventEmitter.emit('playerDrewCard', cardData));


    // --- Player Actions & Prompts ---
    this.socket.on('promptAction', (actionData) => this.eventEmitter.emit('promptAction', actionData));

    // --- Alliance ---
    this.socket.on('allianceProposed', (proposalData) => this.eventEmitter.emit('allianceProposed', proposalData));


    // --- Game End ---
    this.socket.on('gameOver', (gameEndData) => this.eventEmitter.emit('gameOver', gameEndData));

    // --- Chat ---
    this.socket.on('newChatMessage', (chatData) => this.eventEmitter.emit('newChatMessage', chatData));

  }

  // --- Emit events to server ---
  createRoom(playerName) {
    this.socket.emit('createRoom', { playerName });
  }

  joinRoom(roomId, playerName) {
    this.socket.emit('joinRoom', { roomId, playerName });
  }

  startGame() {
    this.socket.emit('startGame');
  }

  rollDice() {
    this.socket.emit('rollDice');
  }

  sendPurchaseDecision(squareId, purchase) {
    this.socket.emit('purchaseDecision', { squareId, purchase });
  }

  sendBuildDecision(squareId, buildingType) {
    this.socket.emit('buildDecision', {squareId, buildingType});
  }

  sendJailDecision(decision) { // 'PAY_FINE', 'USE_CARD', 'ROLL_DOUBLES'
    this.socket.emit('jailDecision', { decision });
  }

  sendEndTurn() {
    this.socket.emit('endTurn');
  }

  sendUseHistoricalCard() {
    this.socket.emit('useHistoricalCard');
  }

  sendProposeAlliance(targetPlayerId) {
    this.socket.emit('proposeAlliance', {targetPlayerId});
  }

  sendAllianceResponse(proposingPlayerId, accepted) {
    this.socket.emit('allianceResponse', {proposingPlayerId, accepted});
  }

  sendSpecialActionHorseMove(targetSquareId) {
    this.socket.emit('specialActionHorseMove', {targetSquareId});
  }

  sendSpecialActionFestival(districtSquareId) {
    this.socket.emit('specialActionFestival', {districtSquareId});
  }

  sendChatMessage(message) {
    this.socket.emit('sendChatMessage', message);
  }


  // --- Event listener methods ---
  on(eventName, callback, context) {
    this.eventEmitter.on(eventName, callback, context);
  }

  off(eventName, callback, context) {
    this.eventEmitter.off(eventName, callback, context);
  }

  removeAllListeners(eventName) {
    this.eventEmitter.removeAllListeners(eventName);
  }

  getSocketId() {
    return this.socket ? this.socket.id : null;
  }
}

// Singleton instance
const socketService = new SocketService();
export default socketService;