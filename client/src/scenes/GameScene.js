// client/src/scenes/GameScene.js
import Phaser from 'phaser';
import socketService from '../services/SocketService';
import ApiService from '../services/ApiService';
import { GameUI } from '../ui/GameUI';
import PopupManager from '../utils/PopupManager';

export default class GameScene extends Phaser.Scene {
  constructor() {
    super('GameScene');
    this.socketService = socketService;
    this.apiService = ApiService;
    this.gameUI = null;
    this.gameState = null;
    this.playerSprites = {}; // key: playerId, value: Phaser.GameObjects.Sprite
    this.squareSprites = {}; // key: squareId, value: Phaser.GameObjects.Sprite (or custom class)
    this.uiElements = {}; // Buttons, text displays
    this.myPlayerId = null;
    this.roomId = null;
    this.boardSquares = [];
    this.isRoomHost = false;
    this.pendingAction = null; // Store action to show after player movement
  }

  preload() {
    // Không load assets ở đây nữa vì đã được PreloadScene tạo placeholder
    console.log('GameScene: preload started - using placeholder assets');
  }

  create(data) {
    console.log('GameScene created with data:', data);
    console.log('Scene dimensions:', this.cameras.main.width, 'x', this.cameras.main.height);

    // Hide loading fallback when GameScene starts
    const loadingFallback = document.getElementById('loading-fallback');
    if (loadingFallback) {
      loadingFallback.style.display = 'none';
      console.log('Loading fallback hidden from GameScene');
    }

    // Clear any existing scene data
    this.children.removeAll(true);
    this.playerSprites = {};
    this.squareSprites = {};
    this.uiElements = {};
    this.boardSquares = [];

    // Get room ID and player ID from data parameter
    this.roomId = data?.roomId;
    // Use socket ID as player ID (not user ID from API)
    this.myPlayerId = this.socketService.socket?.id;

    console.log('GameScene: roomId =', this.roomId, 'myPlayerId =', this.myPlayerId, 'socketId =', this.socketService.socket?.id);

    // Check if this is test mode
    const isTestMode = data?.isTestMode;
    const mockGameState = data?.gameState;

    if (isTestMode && mockGameState) {
      console.log('GameScene: Running in test mode');
      this.myPlayerId = 'player1'; // Set as first player for testing
      this.gameState = mockGameState;
    }

    // Create background
    const bg = this.add.rectangle(this.cameras.main.centerX, this.cameras.main.centerY, 800, 600, 0x228B22);
    console.log('Background created:', bg);

    // Create board
    this.createBoard();
    console.log('Board created');

    // Create UI
    try {
      this.gameUI = new GameUI(this);
      this.gameUI.create();
      console.log('GameUI created successfully');
    } catch (error) {
      console.error('Error creating GameUI:', error);
    }

    // Setup socket listeners (skip in test mode)
    if (!isTestMode) {
      this.setupSocketListeners();

      // Connect to room if we have roomId
      if (this.roomId) {
        const user = this.apiService.getUser();
        const playerName = user?.username || user?.name || 'Player';
        console.log('GameScene: Joining room via socket:', this.roomId, 'as', playerName);

        // Wait for socket to be ready, then join room
        const joinRoom = () => {
          console.log('🔄 Checking socket readiness...', {
            socketExists: !!this.socketService.socket,
            connected: this.socketService.socket?.connected,
            socketId: this.socketService.socket?.id,
            bothConditions: this.socketService.socket?.connected && this.socketService.socket?.id,
            conditionResult: !!(this.socketService.socket?.connected && this.socketService.socket?.id)
          });

          if (this.socketService.socket?.connected && this.socketService.socket?.id) {
            this.myPlayerId = this.socketService.socket.id;
            console.log('✅ Socket ready! Joining room...', {
              myPlayerId: this.myPlayerId,
              roomId: this.roomId,
              playerName
            });
            console.log('🚀 About to call socketService.joinRoom...');
            this.socketService.joinRoom(this.roomId, playerName);
            console.log('✅ Called socketService.joinRoom');
          } else {
            console.log('⏳ Socket not ready, retrying in 200ms...');
            setTimeout(joinRoom, 200);
          }
        };

        // Start checking immediately, but also add a small delay to ensure socket is initialized
        setTimeout(joinRoom, 100);
      }
    } else {
      // In test mode, simulate initial game state update
      if (this.gameState) {
        this.handleGameStateUpdate(this.gameState);
      }
    }

    console.log('GameScene create completed');
  }

  createBoard() {
    // Create a simple board layout for 40 squares
    const boardWidth = 600;
    const boardHeight = 600;
    const centerX = this.cameras.main.centerX;
    const centerY = this.cameras.main.centerY;

    // Create board background
    const boardBg = this.add.rectangle(centerX, centerY, boardWidth, boardHeight, 0x8B4513, 0.8);
    boardBg.setStrokeStyle(4, 0x000000);

    // Create squares around the board perimeter
    this.createBoardSquares(centerX, centerY, boardWidth, boardHeight);
  }

  createBoardSquares(centerX, centerY, boardWidth, boardHeight) {
    const squareSize = 60;
    const squaresPerSide = 10;
    this.boardSquares = [];

    for (let i = 0; i < 40; i++) {
      const pos = this.getSquarePosition(i, centerX, centerY, boardWidth, boardHeight, squareSize);

      const square = this.add.rectangle(pos.x, pos.y, squareSize, squareSize, 0xFFFFFF);
      square.setStrokeStyle(2, 0x000000);
      square.setData('squareIndex', i);
      square.setInteractive();

      // Add square label
      const label = this.add.text(pos.x, pos.y, `${i + 1}`, {
        fontSize: '12px',
        color: '#000000'
      });
      label.setOrigin(0.5);

      this.boardSquares.push({ square, label, position: pos });
      this.squareSprites[`SQ${String(i + 1).padStart(3, '0')}`] = square;
    }
  }

  getSquarePosition(index, centerX, centerY, boardWidth, boardHeight, squareSize) {
    const squaresPerSide = 10;
    const side = Math.floor(index / squaresPerSide);
    const posInSide = index % squaresPerSide;

    let x, y;

    switch (side) {
      case 0: // Bottom side
        x = centerX - boardWidth/2 + (posInSide + 0.5) * (boardWidth / squaresPerSide);
        y = centerY + boardHeight/2 - squareSize/2;
        break;
      case 1: // Right side
        x = centerX + boardWidth/2 - squareSize/2;
        y = centerY + boardHeight/2 - (posInSide + 1.5) * (boardHeight / squaresPerSide);
        break;
      case 2: // Top side
        x = centerX + boardWidth/2 - (posInSide + 1.5) * (boardWidth / squaresPerSide);
        y = centerY - boardHeight/2 + squareSize/2;
        break;
      case 3: // Left side
        x = centerX - boardWidth/2 + squareSize/2;
        y = centerY - boardHeight/2 + (posInSide + 0.5) * (boardHeight / squaresPerSide);
        break;
    }

    return { x, y };
  }

  setupSocketListeners() {
    this.socketService.on('gameStateUpdate', this.handleGameStateUpdate, this);
    this.socketService.on('playerMoved', this.handlePlayerMoved, this);
    this.socketService.on('diceRolled', this.handleDiceRolled, this);
    this.socketService.on('newGameLog', this.handleGameLog, this);
    this.socketService.on('promptAction', this.handlePromptAction, this);
    this.socketService.on('gameOver', this.handleGameOver, this);
    this.socketService.on('chatMessage', this.handleChatMessage, this);
    this.socketService.on('playerJoined', this.handlePlayerJoined, this);
    this.socketService.on('playerLeft', this.handlePlayerLeft, this);
    this.socketService.on('roomCreated', this.handleRoomCreated, this);
    this.socketService.on('joinedRoom', this.handleJoinedRoom, this);
    this.socketService.on('leftRoom', this.handleLeftRoom, this);
    this.socketService.on('gameStarted', this.handleGameStarted, this);
    this.socketService.on('roomClosed', this.handleRoomClosed, this);
    this.socketService.on('roomSettingsUpdated', this.handleRoomSettingsUpdated, this);
    this.socketService.on('roomSettingsUpdated', this.handleRoomSettingsUpdated, this);
    this.socketService.on('hostChanged', this.handleHostChanged, this);
    this.socketService.on('error', this.handleSocketError, this);
    this.socketService.on('disconnect', this.handleDisconnect, this);
  }

  update(time, delta) {
    // Update UI based on game state
    if (this.gameState && this.gameUI) {
      const me = this.gameState.players.find(p => p.id === this.myPlayerId);
      if (me) {
        this.gameUI.updatePlayerInfo(me);
      }

      const currentPlayer = this.gameState.players.find(p => p.id === this.gameState.currentPlayerId);
      if (currentPlayer) {
        const isMyTurn = currentPlayer.id === this.myPlayerId;
        this.gameUI.updateTurnIndicator(isMyTurn, currentPlayer.name);
      }
    }
  }

  handleGameStateUpdate(gameState) {
    console.log('🎮 Received GameState Update:', gameState);
    console.log('🎮 Players:', gameState?.players);
    console.log('🎮 Current Player ID:', gameState?.currentPlayerId);
    console.log('🎮 Game Phase:', gameState?.gamePhase);
    console.log('🎮 My Player ID:', this.myPlayerId);
    this.gameState = gameState;

    // Check if current user is room host (first player or designated host)
    if (this.gameState.players && this.gameState.players.length > 0) {
      const firstPlayer = this.gameState.players[0];
      const oldIsRoomHost = this.isRoomHost;
      this.isRoomHost = (firstPlayer.id === this.myPlayerId) || (this.gameState.hostId === this.myPlayerId);

      console.log('🏠 Host check debug:', {
        firstPlayerId: firstPlayer.id,
        myPlayerId: this.myPlayerId,
        hostId: this.gameState.hostId,
        oldIsRoomHost,
        newIsRoomHost: this.isRoomHost,
        firstPlayerName: firstPlayer.name,
        allPlayers: this.gameState.players.map(p => ({ id: p.id, name: p.name }))
      });

      if (oldIsRoomHost !== this.isRoomHost) {
        console.log('🔄 Host status changed from', oldIsRoomHost, 'to', this.isRoomHost);
      }
    }

    // Update UI with game state and host status
    if (this.gameUI) {
      this.gameUI.updateGameState(this.gameState);
      this.gameUI.setRoomHost(this.isRoomHost);

      // Update room name display
      if (this.gameState.roomName || this.gameState.roomId) {
        this.gameUI.updateRoomName(this.gameState.roomName || this.gameState.roomId);
      }
    }

    // Update players
    this.gameState.players.forEach(player => {
      if (!this.playerSprites[player.id]) {
        // Create sprite for new player
        const pos = this.getSquarePixelPosition(player.tokenPositionIndex);
        this.playerSprites[player.id] = this.add.circle(pos.x, pos.y, 12, parseInt(player.color.replace('#','0x'), 16));
        this.playerSprites[player.id].setStrokeStyle(2, 0x000000);
        this.playerSprites[player.id].setData('playerId', player.id);
      }

      // Update position
      const pos = this.getSquarePixelPosition(player.tokenPositionIndex);
      this.playerSprites[player.id].setPosition(pos.x, pos.y);
    });

    // Update square ownership
    if (this.gameState.board && this.gameState.board.squares) {
      this.gameState.board.squares.forEach((square, index) => {
        const squareSprite = this.boardSquares[index]?.square;
        if (squareSprite) {
          if (square.ownerId) {
            const owner = this.gameState.players.find(p => p.id === square.ownerId);
            if (owner) {
              squareSprite.setStrokeStyle(4, parseInt(owner.color.replace('#','0x'), 16));
            }
          } else {
            squareSprite.setStrokeStyle(2, 0x000000);
          }
        }
      });
    }

    // Update game log
    if (this.gameUI && this.gameState.gameLog) {
      this.gameUI.updateGameLog(this.gameState.gameLog);
    }
  }

  handlePlayerMoved(moveData) {
    console.log('Player Moved:', moveData);
    const { playerId, newSquareIndex, diceRoll } = moveData;
    const playerSprite = this.playerSprites[playerId];

    if (playerSprite) {
      const pos = this.getSquarePixelPosition(newSquareIndex);

      // Animate movement
      this.tweens.add({
        targets: playerSprite,
        x: pos.x,
        y: pos.y,
        ease: 'Power2',
        duration: 1000,
        onComplete: () => {
          console.log(`Player ${playerId} moved to square ${newSquareIndex}`);

          // Check if this is my player and there's a pending action
          if (playerId === this.myPlayerId && this.pendingAction) {
            if (this.gameUI.isDiceAnimating) {
              console.log('🎯 Player movement complete but dice still animating, waiting...');
              // Popup will be shown when dice animation completes
            } else {
              console.log('🎯 Player movement complete, showing pending action popup');
              this.showPendingAction();
            }
          }
        }
      });
    }
  }

  handleDiceRolled(diceData) {
    console.log('Dice Rolled:', diceData);
    const player = this.gameState?.players.find(p => p.id === diceData.playerId);
    const message = `${player?.name || 'Player'} rolled: ${diceData.values.join(', ')} (Total: ${diceData.total})${diceData.isDouble ? ' DOUBLE!' : ''}`;
    this.handleGameLog(message);

    // Update dice display in UI
    if (this.gameUI) {
      this.gameUI.updateDiceDisplay(diceData.values, diceData.total, diceData.isDouble);
    }
  }

  handleGameLog(message) {
    console.log('Game Log:', message);
    if (this.gameUI) {
      // Add to game log in UI
      const currentLogs = this.gameUI.elements.logMessages?.text?.split('\n') || [];
      currentLogs.push(message);
      if (currentLogs.length > 10) {
        currentLogs.shift();
      }
      this.gameUI.updateGameLog(currentLogs);
    }
  }

  handleChatMessage(data) {
    console.log('Chat Message:', data);
    if (this.gameUI) {
      this.gameUI.addChatMessage(data.username, data.message);
    }
  }

  handlePromptAction(actionData) {
    console.log('🎯 Prompt Action received:', actionData);

    if (!this.gameUI) {
      console.log('❌ No gameUI available');
      return;
    }

    const { actionType, data } = actionData;
    console.log('🎯 Action type:', actionType, 'Data:', data);

    // Store pending action
    this.pendingAction = { actionType, data };

    // Check if dice is currently animating
    if (this.gameUI.isDiceAnimating) {
      console.log('🎯 Dice is animating, waiting for animation to complete before showing popup');
      // The popup will be shown when dice animation completes
    } else {
      console.log('🎯 No dice animation, showing popup after player movement');
      // Will be shown after player movement completes
    }
  }

  showPendingAction() {
    if (!this.pendingAction || !this.gameUI) {
      return;
    }

    const { actionType, data } = this.pendingAction;
    console.log('🎯 Showing pending action popup:', actionType);

    switch (actionType) {
      case 'LAND_ACTION_BUY':
        console.log('🏠 Showing property purchase dialog');
        this.gameUI.showPropertyPurchaseDialog(data);
        break;

      case 'LAND_ACTION_BUILD':
        console.log('🏗️ Showing building dialog');
        this.gameUI.showBuildingDialog(data);
        break;

      case 'PAYMENT_OPTIONS':
        console.log('💰 Showing payment options dialog');
        this.gameUI.showPaymentOptionsDialog(data);
        break;

      case 'JAIL_OPTIONS':
        console.log('🏛️ Showing jail options dialog');
        this.gameUI.showJailOptionsDialog(data);
        break;

      case 'SPECIAL_ACTION_HORSE_CHOOSE_DESTINATION':
        console.log('🐎 Showing horse destination dialog');
        this.gameUI.showHorseDestinationDialog(data);
        break;

      default:
        console.log('❌ Unhandled action type:', actionType);
    }

    // Clear pending action after showing
    this.pendingAction = null;
  }

  handleGameOver(gameEndData) {
    console.log('Game Over:', gameEndData);
    const winnerText = gameEndData.winner ? `${gameEndData.winner.name} wins!` : "Draw!";

    this.add.rectangle(this.cameras.main.centerX, this.cameras.main.centerY, 400, 200, 0x000000, 0.8);
    this.add.text(this.cameras.main.centerX, this.cameras.main.centerY, `GAME OVER\n${winnerText}\nReason: ${gameEndData.reason}`, {
      fontSize: '24px',
      color: '#ffffff',
      align: 'center',
      lineSpacing: 10
    }).setOrigin(0.5);
  }

  getSquarePixelPosition(squareIndex) {
    if (typeof squareIndex === 'string') {
      // If it's a square ID like "SQ001", extract the index
      const match = squareIndex.match(/\d+/);
      squareIndex = match ? parseInt(match[0]) - 1 : 0;
    }

    if (this.boardSquares && this.boardSquares[squareIndex]) {
      return this.boardSquares[squareIndex].position;
    }

    // Fallback calculation
    return this.getSquarePosition(squareIndex, this.cameras.main.centerX, this.cameras.main.centerY, 600, 600, 60);
  }

  handlePlayerJoined(data) {
    console.log('Player joined:', data);
    if (this.gameUI) {
      this.gameUI.addGameLogMessage(`${data.player.name} đã vào phòng`);
    }
  }

  handlePlayerLeft(data) {
    console.log('Player left:', data);
    if (this.gameUI) {
      this.gameUI.addGameLogMessage(`Một người chơi đã rời phòng`);
    }
    // Remove player sprite if exists
    if (this.playerSprites[data.playerId]) {
      this.playerSprites[data.playerId].destroy();
      delete this.playerSprites[data.playerId];
    }
  }

  handleRoomCreated(data) {
    console.log('Room created:', data);
    if (this.gameUI) {
      this.gameUI.addGameLogMessage(`Phòng ${this.roomId} đã được tạo. Đang chờ người chơi khác...`);
    }
  }

  handleJoinedRoom(data) {
    console.log('Joined room:', data);
    if (this.gameUI) {
      this.gameUI.addGameLogMessage(`Đã vào phòng ${this.roomId}. Đang chờ bắt đầu game...`);
    }
  }

  handleLeftRoom(data) {
    console.log('Left room:', data);
    PopupManager.success('Thành công!', 'Đã rời khỏi phòng', { timer: 1000 });

    // Return to main menu with refresh
    setTimeout(() => {
      try {
        if (this.scene && this.scene.start) {
          this.scene.start('MainMenuScene', { shouldRefresh: true });
        }
      } catch (error) {
        console.error('Error returning to main menu:', error);
      }
    }, 1000);
  }

  handleSocketError(error) {
    console.error('Socket error:', error);
    PopupManager.error('Lỗi kết nối', error.message || 'Có lỗi xảy ra với kết nối');
  }

  handleDisconnect() {
    console.log('Socket disconnected');
    PopupManager.warning('Mất kết nối', 'Đã mất kết nối với server. Đang thử kết nối lại...');
  }

  handleGameStarted(data) {
    console.log('Game started:', data);
    PopupManager.closeLoading();
    PopupManager.success('Game bắt đầu!', 'Trò chơi đã được bắt đầu', { timer: 2000 });

    if (this.gameUI) {
      this.gameUI.addGameLogMessage('🎮 Game đã bắt đầu! Chúc các bạn chơi vui vẻ!');
    }
  }

  handleRoomClosed(data) {
    console.log('Room closed:', data);
    PopupManager.closeLoading();
    PopupManager.warning('Phòng đã đóng', 'Chủ phòng đã đóng phòng chơi');

    // Return to main menu
    setTimeout(() => {
      try {
        if (this.scene && this.scene.start) {
          this.scene.start('MainMenuScene', { shouldRefresh: true });
        }
      } catch (error) {
        console.error('Error returning to main menu:', error);
      }
    }, 2000);
  }

  handleRoomSettingsUpdated(data) {
    console.log('🔄 Room settings updated:', data);

    // Update room name if provided
    if (data.roomName && this.gameUI) {
      this.gameUI.updateRoomName(data.roomName);
    }

    // Show success message (only if not from HTTP API call)
    if (data.updatedBy) {
      PopupManager.success('Cập nhật thành công', `Cài đặt phòng đã được cập nhật bởi ${data.updatedBy}`, { timer: 3000 });
    }

    // Update game state if needed
    if (this.gameState) {
      console.log('🔄 Updating gameState from socket event:');
      console.log('- Old gameState:', this.gameState);

      // Ensure settings object exists
      if (!this.gameState.settings) {
        this.gameState.settings = {};
      }

      if (data.settings) {
        if (data.settings.maxPlayers) this.gameState.settings.maxPlayers = data.settings.maxPlayers;
        if (data.settings.isPrivate !== undefined) this.gameState.settings.isPrivate = data.settings.isPrivate;
        if (data.settings.roomName) this.gameState.roomName = data.settings.roomName;
      }
      if (data.roomName) this.gameState.roomName = data.roomName;

      console.log('- New gameState:', this.gameState);

      // Force update UI
      if (this.gameUI) {
        this.gameUI.updateGameState(this.gameState);
        this.gameUI.updateHostControls();
      }
    }

    if (this.gameUI) {
      this.gameUI.addGameLogMessage('⚙️ Cài đặt phòng đã được cập nhật');
    }
  }

  handleHostChanged(data) {
    console.log('Host changed:', data);
    const { newHostId, newHostName } = data;

    // Update host status
    this.isRoomHost = (newHostId === this.myPlayerId);

    if (this.gameUI) {
      this.gameUI.setRoomHost(this.isRoomHost);
      this.gameUI.addGameLogMessage(`👑 ${newHostName} đã trở thành chủ phòng mới`);
    }

    if (this.isRoomHost) {
      PopupManager.info('Bạn là chủ phòng!', 'Bạn đã trở thành chủ phòng và có thể quản lý phòng chơi');
    }
  }

  destroy() {
    // Clean up
    if (this.gameUI) {
      this.gameUI.destroy();
    }

    // Remove socket listeners
    this.socketService.off('gameStateUpdate', this.handleGameStateUpdate, this);
    this.socketService.off('playerMoved', this.handlePlayerMoved, this);
    this.socketService.off('diceRolled', this.handleDiceRolled, this);
    this.socketService.off('newGameLog', this.handleGameLog, this);
    this.socketService.off('promptAction', this.handlePromptAction, this);
    this.socketService.off('gameOver', this.handleGameOver, this);
    this.socketService.off('chatMessage', this.handleChatMessage, this);
    this.socketService.off('playerJoined', this.handlePlayerJoined, this);
    this.socketService.off('playerLeft', this.handlePlayerLeft, this);
    this.socketService.off('roomCreated', this.handleRoomCreated, this);
    this.socketService.off('joinedRoom', this.handleJoinedRoom, this);
    this.socketService.off('leftRoom', this.handleLeftRoom, this);
    this.socketService.off('gameStarted', this.handleGameStarted, this);
    this.socketService.off('roomClosed', this.handleRoomClosed, this);
    this.socketService.off('roomSettingsUpdated', this.handleRoomSettingsUpdated, this);
    this.socketService.off('roomSettingsUpdated', this.handleRoomSettingsUpdated, this);
    this.socketService.off('hostChanged', this.handleHostChanged, this);
    this.socketService.off('error', this.handleSocketError, this);
    this.socketService.off('disconnect', this.handleDisconnect, this);

    super.destroy();
  }

}