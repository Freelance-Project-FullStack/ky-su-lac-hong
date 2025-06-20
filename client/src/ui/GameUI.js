import PopupManager from '../utils/PopupManager';

export class GameUI {
  constructor(scene) {
    this.scene = scene;
    this.elements = {};
    this.isVisible = true;
    this.isRoomHost = false;
    this.gameState = null;
    this.isDiceAnimating = false; // Flag to track dice animation state
  }

  create() {
    this.createPlayerPanel();
    this.createGameControls();
    this.createDiceDisplay();
    this.createHostControls();
    this.createChatPanel();
    this.createGameLog();
    this.createActionButtons();
    this.enhanceBoardUI(); // Add visual enhancements to the board
  }
  
  enhanceBoardUI() {
    // Phương thức này thêm các hiệu ứng trực quan cho bàn cờ dựa trên thiết kế mẫu
    const { width, height } = this.scene.cameras.main;
    
    // Tạo container cho các trang trí bàn cờ
    this.elements.boardDecorations = this.scene.add.container(0, 0);
    
    // Thêm tiêu đề cho bàn cờ sử dụng font chữ UTM ThuPhap Thien An nếu có
    const boardTitle = this.scene.add.text(width / 2, 30, 'KỲ SỬ LẠC HỒNG', {
      fontFamily: '"UTM ThuPhap Thien An", Arial, sans-serif', // Sử dụng font đặc biệt hoặc fallback
      fontSize: '36px',
      fontWeight: 'bold',
      color: '#FFD700', // Màu vàng
      stroke: '#8B4513', // Viền màu nâu
      strokeThickness: 4,
      shadow: {
        offsetX: 2,
        offsetY: 2,
        color: '#000',
        blur: 5,
        stroke: true,
        fill: true
      }
    });
    boardTitle.setOrigin(0.5);
    this.elements.boardDecorations.add(boardTitle);
    
    // Thêm hiệu ứng cho tiêu đề
    this.scene.tweens.add({
      targets: boardTitle,
      y: { from: 25, to: 35 },
      duration: 2000,
      ease: 'Sine.easeInOut',
      yoyo: true,
      repeat: -1
    });
    
    try {
      // Lấy kích thước và vị trí của bàn cờ từ scene
      const centerX = this.scene.cameras.main.centerX;
      const centerY = this.scene.cameras.main.centerY;
      const boardWidth = this.scene.board ? this.scene.board.width : 800;
      const boardHeight = this.scene.board ? this.scene.board.height : 800;
      
      // Thêm hiệu ứng ánh sáng xung quanh bàn cờ
      const boardGlow = this.scene.add.graphics();
      boardGlow.fillStyle(0xFFD700, 0.2); // Màu vàng nhạt
      boardGlow.fillRect(
        centerX - boardWidth/2 - 15,
        centerY - boardHeight/2 - 15,
        boardWidth + 30,
        boardHeight + 30
      );
      boardGlow.setBlendMode(Phaser.BlendModes.ADD);
      this.elements.boardDecorations.add(boardGlow);
      
      // Thêm các biểu tượng trang trí ở các góc
      const cornerIcons = ['🏯', '🏮', '🏺', '📜'];
      const cornerPositions = [
        { x: centerX - boardWidth/2 + 60, y: centerY - boardHeight/2 + 60 }, // Góc trên bên trái
        { x: centerX + boardWidth/2 - 60, y: centerY - boardHeight/2 + 60 }, // Góc trên bên phải
        { x: centerX + boardWidth/2 - 60, y: centerY + boardHeight/2 - 60 }, // Góc dưới bên phải
        { x: centerX - boardWidth/2 + 60, y: centerY + boardHeight/2 - 60 }  // Góc dưới bên trái
      ];
      
      // Thêm các biểu tượng vào các góc
      cornerPositions.forEach((pos, index) => {
        const icon = this.scene.add.text(pos.x, pos.y, cornerIcons[index], {
          fontSize: '40px'
        });
        icon.setOrigin(0.5);
        icon.setInteractive({ useHandCursor: true });
        icon.on('pointerover', () => {
          icon.setScale(1.2);
        });
        icon.on('pointerout', () => {
          icon.setScale(1.0);
        });
        this.elements.boardDecorations.add(icon);
      });
      
      // Thêm trang trí ở giữa bàn cờ
      const centerDecoration = this.scene.add.text(centerX, centerY, '⭐', {
        fontSize: '60px',
        color: '#FFD700'
      });
      centerDecoration.setOrigin(0.5);
      centerDecoration.setInteractive({ useHandCursor: true });
      centerDecoration.on('pointerdown', () => {
        // Hiệu ứng khi click vào ngôi sao ở giữa
        this.scene.tweens.add({
          targets: centerDecoration,
          scale: { from: 1.1, to: 0.8 },
          duration: 200,
          yoyo: true,
          onComplete: () => {
            // Hiển thị thông tin trò chơi hoặc hướng dẫn
            PopupManager.info('Kỳ Sử Lạc Hồng', 'Chào mừng đến với trò chơi Kỳ Sử Lạc Hồng!\n\nHãy di chuyển quân cờ và chinh phục các vùng đất để trở thành người chiến thắng.');
          }
        });
      });
      this.elements.boardDecorations.add(centerDecoration);
      
      // Hiệu ứng nhấp nháy cho ngôi sao ở giữa
      this.scene.tweens.add({
        targets: centerDecoration,
        alpha: { from: 0.7, to: 1 },
        scale: { from: 0.9, to: 1.1 },
        duration: 1500,
        yoyo: true,
        repeat: -1
      });
      
    } catch (error) {
      console.error('Error adding board decorations:', error);
    }
  }

  createPlayerPanel() {
    const { width, height } = this.scene.cameras.main;
    
    // Player info panel
    this.elements.playerPanel = this.scene.add.container(10, 10);
    
    // Background - made smaller
    const panelBg = this.scene.add.rectangle(0, 0, 250, 90, 0x000000, 0.7);
    panelBg.setOrigin(0, 0);
    this.elements.playerPanel.add(panelBg);

    // Player name - smaller font
    this.elements.playerName = this.scene.add.text(8, 8, 'Player Name', {
      fontSize: '14px',
      fontFamily: 'Arial',
      color: '#ffffff',
      fontStyle: 'bold'
    });
    this.elements.playerPanel.add(this.elements.playerName);

    // Money display - smaller font
    this.elements.moneyText = this.scene.add.text(8, 26, 'Money: 2,000,000 Vàng', {
      fontSize: '12px',
      fontFamily: 'Arial',
      color: '#ffff00'
    });
    this.elements.playerPanel.add(this.elements.moneyText);

    // Properties count - smaller font
    this.elements.propertiesText = this.scene.add.text(8, 42, 'Properties: 0', {
      fontSize: '11px',
      fontFamily: 'Arial',
      color: '#00ff00'
    });
    this.elements.playerPanel.add(this.elements.propertiesText);

    // Historical character card - smaller font
    this.elements.characterText = this.scene.add.text(8, 56, 'Character: None', {
      fontSize: '11px',
      fontFamily: 'Arial',
      color: '#ff9900'
    });
    this.elements.playerPanel.add(this.elements.characterText);

    // Turn indicator - smaller font
    this.elements.turnIndicator = this.scene.add.text(8, 72, '', {
      fontSize: '12px',
      fontFamily: 'Arial',
      color: '#ff0000',
      fontStyle: 'bold'
    });
    this.elements.playerPanel.add(this.elements.turnIndicator);
  }

  createGameControls() {
    const { width, height } = this.scene.cameras.main;

    // Game controls panel
    this.elements.controlsPanel = this.scene.add.container(width - 250, 10);

    // Background
    const controlsBg = this.scene.add.rectangle(0, 0, 240, 140, 0x000000, 0.7);
    controlsBg.setOrigin(0, 0);
    this.elements.controlsPanel.add(controlsBg);

    // Room name display
    this.elements.roomNameText = this.scene.add.text(120, 15, 'Room: Loading...', {
      fontSize: '14px',
      fontFamily: 'Arial',
      color: '#FFD700',
      fontStyle: 'bold'
    });
    this.elements.roomNameText.setOrigin(0.5);
    this.elements.controlsPanel.add(this.elements.roomNameText);

    // Dice roll button
    this.elements.rollDiceBtn = this.scene.add.rectangle(120, 45, 200, 40, 0x4CAF50);
    this.elements.rollDiceBtn.setInteractive();
    this.elements.rollDiceBtn.on('pointerdown', () => this.rollDice());
    this.elements.rollDiceBtn.on('pointerover', () => this.elements.rollDiceBtn.setFillStyle(0x66BB6A));
    this.elements.rollDiceBtn.on('pointerout', () => this.elements.rollDiceBtn.setFillStyle(0x4CAF50));
    this.elements.controlsPanel.add(this.elements.rollDiceBtn);

    this.elements.rollDiceText = this.scene.add.text(120, 45, 'Roll Dice', {
      fontSize: '16px',
      fontFamily: 'Arial',
      color: '#ffffff',
      fontStyle: 'bold'
    });
    this.elements.rollDiceText.setOrigin(0.5);
    this.elements.controlsPanel.add(this.elements.rollDiceText);

    // End turn button
    this.elements.endTurnBtn = this.scene.add.rectangle(120, 75, 200, 30, 0xF44336);
    this.elements.endTurnBtn.setInteractive();
    this.elements.endTurnBtn.on('pointerdown', () => this.endTurn());
    this.elements.endTurnBtn.on('pointerover', () => this.elements.endTurnBtn.setFillStyle(0xE57373));
    this.elements.endTurnBtn.on('pointerout', () => this.elements.endTurnBtn.setFillStyle(0xF44336));
    this.elements.controlsPanel.add(this.elements.endTurnBtn);

    this.elements.endTurnText = this.scene.add.text(120, 75, 'End Turn', {
      fontSize: '14px',
      fontFamily: 'Arial',
      color: '#ffffff'
    });
    this.elements.endTurnText.setOrigin(0.5);
    this.elements.controlsPanel.add(this.elements.endTurnText);

    // Leave room button
    this.elements.leaveRoomBtn = this.scene.add.rectangle(120, 110, 200, 25, 0xFF5722);
    this.elements.leaveRoomBtn.setInteractive();
    this.elements.leaveRoomBtn.on('pointerdown', () => this.leaveRoom());
    this.elements.leaveRoomBtn.on('pointerover', () => this.elements.leaveRoomBtn.setFillStyle(0xFF7043));
    this.elements.leaveRoomBtn.on('pointerout', () => this.elements.leaveRoomBtn.setFillStyle(0xFF5722));
    this.elements.controlsPanel.add(this.elements.leaveRoomBtn);

    this.elements.leaveRoomText = this.scene.add.text(120, 110, '🚪 Rời phòng', {
      fontSize: '12px',
      fontFamily: 'Arial',
      color: '#ffffff',
      fontStyle: 'bold'
    });
    this.elements.leaveRoomText.setOrigin(0.5);
    this.elements.controlsPanel.add(this.elements.leaveRoomText);
  }

  createDiceDisplay() {
    const { width, height } = this.scene.cameras.main;

    // Dice display panel (center of screen)
    this.elements.dicePanel = this.scene.add.container(width / 2, height / 2);

    // Background with gradient effect
    const diceBg = this.scene.add.rectangle(0, 0, 280, 140, 0x2C3E50, 0.95);
    diceBg.setStrokeStyle(4, 0xFFD700);
    this.elements.dicePanel.add(diceBg);

    // Add shadow for panel
    const panelShadow = this.scene.add.rectangle(3, 3, 280, 140, 0x000000, 0.4);
    this.elements.dicePanel.add(panelShadow);
    this.elements.dicePanel.sendToBack(panelShadow);

    // Title with better styling
    this.elements.diceTitle = this.scene.add.text(0, -50, '🎲 ROLLING DICE', {
      fontSize: '18px',
      fontFamily: 'Arial',
      color: '#FFD700',
      fontStyle: 'bold'
    });
    this.elements.diceTitle.setOrigin(0.5);
    this.elements.dicePanel.add(this.elements.diceTitle);

    // Dice 1 container
    this.elements.dice1Container = this.scene.add.container(-60, -5);
    this.elements.dicePanel.add(this.elements.dice1Container);

    // Dice 1 background - larger and with rounded corners effect
    this.elements.dice1 = this.scene.add.rectangle(0, 0, 55, 55, 0xFFFFFF);
    this.elements.dice1.setStrokeStyle(3, 0x333333);
    this.elements.dice1Container.add(this.elements.dice1);

    // Add shadow effect for dice 1
    const dice1Shadow = this.scene.add.rectangle(2, 2, 55, 55, 0x000000, 0.3);
    this.elements.dice1Container.add(dice1Shadow);
    this.elements.dice1Container.sendToBack(dice1Shadow);

    // Dice 2 container
    this.elements.dice2Container = this.scene.add.container(60, -5);
    this.elements.dicePanel.add(this.elements.dice2Container);

    // Dice 2 background - larger and with rounded corners effect
    this.elements.dice2 = this.scene.add.rectangle(0, 0, 55, 55, 0xFFFFFF);
    this.elements.dice2.setStrokeStyle(3, 0x333333);
    this.elements.dice2Container.add(this.elements.dice2);

    // Add shadow effect for dice 2
    const dice2Shadow = this.scene.add.rectangle(2, 2, 55, 55, 0x000000, 0.3);
    this.elements.dice2Container.add(dice2Shadow);
    this.elements.dice2Container.sendToBack(dice2Shadow);

    // Total display with better styling
    this.elements.diceTotal = this.scene.add.text(0, 50, 'Total: -', {
      fontSize: '16px',
      fontFamily: 'Arial',
      color: '#FFFFFF',
      fontStyle: 'bold'
    });
    this.elements.diceTotal.setOrigin(0.5);
    this.elements.dicePanel.add(this.elements.diceTotal);

    // Add decorative elements
    const leftStar = this.scene.add.text(-100, -10, '⭐', {
      fontSize: '20px'
    });
    leftStar.setOrigin(0.5);
    this.elements.dicePanel.add(leftStar);

    const rightStar = this.scene.add.text(100, -10, '⭐', {
      fontSize: '20px'
    });
    rightStar.setOrigin(0.5);
    this.elements.dicePanel.add(rightStar);

    // Initially hidden
    this.elements.dicePanel.setVisible(false);
  }

  // Create dice dots pattern
  createDiceDots(container, value) {
    // Clear existing dots
    container.list.forEach(child => {
      if (child.getData && child.getData('isDot')) {
        child.destroy();
      }
    });

    const dotSize = 5; // Slightly larger dots
    const dotColor = 0x000000;

    // Standard dice dot patterns (like real dice)
    const dotPatterns = {
      1: [
        [0, 0] // Center dot
      ],
      2: [
        [-12, -12], // Top-left
        [12, 12]    // Bottom-right
      ],
      3: [
        [-12, -12], // Top-left
        [0, 0],     // Center
        [12, 12]    // Bottom-right
      ],
      4: [
        [-12, -12], // Top-left
        [12, -12],  // Top-right
        [-12, 12],  // Bottom-left
        [12, 12]    // Bottom-right
      ],
      5: [
        [-12, -12], // Top-left
        [12, -12],  // Top-right
        [0, 0],     // Center
        [-12, 12],  // Bottom-left
        [12, 12]    // Bottom-right
      ],
      6: [
        [-12, -12], // Top-left
        [12, -12],  // Top-right
        [-12, 0],   // Middle-left
        [12, 0],    // Middle-right
        [-12, 12],  // Bottom-left
        [12, 12]    // Bottom-right
      ]
    };

    const pattern = dotPatterns[value] || dotPatterns[1];
    pattern.forEach(([x, y]) => {
      const dot = this.scene.add.circle(x, y, dotSize, dotColor);
      dot.setData('isDot', true);
      container.add(dot);
    });
  }

  createHostControls() {
    const { width, height } = this.scene.cameras.main;

    // Host controls panel (only visible for room host) - positioned below game controls
    this.elements.hostPanel = this.scene.add.container(width - 250, 160);
    this.elements.hostPanel.setVisible(false); // Hidden by default

    // Panel background
    this.elements.hostPanelBg = this.scene.add.rectangle(0, 0, 240, 140, 0x2C3E50, 0.9);
    this.elements.hostPanelBg.setStrokeStyle(2, 0xFFD700);
    this.elements.hostPanelBg.setOrigin(0, 0);
    this.elements.hostPanel.add(this.elements.hostPanelBg);

    // Title
    this.elements.hostTitle = this.scene.add.text(10, 10, '🏠 Chủ phòng', {
      fontSize: '14px',
      fontFamily: 'Arial',
      color: '#ffffff',
      fontStyle: 'bold'
    });
    this.elements.hostTitle.setOrigin(0, 0);
    this.elements.hostPanel.add(this.elements.hostTitle);

    // Start Game button
    this.elements.startGameBtn = this.scene.add.rectangle(10, 35, 220, 30, 0x27AE60);
    this.elements.startGameBtn.setOrigin(0, 0);
    this.elements.startGameBtn.setInteractive();
    this.elements.startGameBtn.on('pointerdown', () => this.startGame());
    this.elements.startGameBtn.on('pointerover', () => this.elements.startGameBtn.setFillStyle(0x2ECC71));
    this.elements.startGameBtn.on('pointerout', () => this.elements.startGameBtn.setFillStyle(0x27AE60));
    this.elements.hostPanel.add(this.elements.startGameBtn);

    this.elements.startGameText = this.scene.add.text(120, 50, '🎮 Bắt đầu game', {
      fontSize: '12px',
      fontFamily: 'Arial',
      color: '#ffffff',
      fontStyle: 'bold'
    });
    this.elements.startGameText.setOrigin(0.5);
    this.elements.hostPanel.add(this.elements.startGameText);

    // Room Settings button
    this.elements.roomSettingsBtn = this.scene.add.rectangle(10, 70, 220, 25, 0x3498DB);
    this.elements.roomSettingsBtn.setOrigin(0, 0);
    this.elements.roomSettingsBtn.setInteractive();
    this.elements.roomSettingsBtn.on('pointerdown', () => this.showRoomSettings());
    this.elements.roomSettingsBtn.on('pointerover', () => this.elements.roomSettingsBtn.setFillStyle(0x5DADE2));
    this.elements.roomSettingsBtn.on('pointerout', () => this.elements.roomSettingsBtn.setFillStyle(0x3498DB));
    this.elements.hostPanel.add(this.elements.roomSettingsBtn);

    this.elements.roomSettingsText = this.scene.add.text(120, 82, '⚙️ Cài đặt phòng', {
      fontSize: '11px',
      fontFamily: 'Arial',
      color: '#ffffff',
      fontStyle: 'bold'
    });
    this.elements.roomSettingsText.setOrigin(0.5);
    this.elements.hostPanel.add(this.elements.roomSettingsText);

    // Close Room button
    this.elements.closeRoomBtn = this.scene.add.rectangle(10, 100, 220, 25, 0xE74C3C);
    this.elements.closeRoomBtn.setOrigin(0, 0);
    this.elements.closeRoomBtn.setInteractive();
    this.elements.closeRoomBtn.on('pointerdown', () => this.closeRoom());
    this.elements.closeRoomBtn.on('pointerover', () => this.elements.closeRoomBtn.setFillStyle(0xC0392B));
    this.elements.closeRoomBtn.on('pointerout', () => this.elements.closeRoomBtn.setFillStyle(0xE74C3C));
    this.elements.hostPanel.add(this.elements.closeRoomBtn);

    this.elements.closeRoomText = this.scene.add.text(120, 112, '🚫 Đóng phòng', {
      fontSize: '11px',
      fontFamily: 'Arial',
      color: '#ffffff',
      fontStyle: 'bold'
    });
    this.elements.closeRoomText.setOrigin(0.5);
    this.elements.hostPanel.add(this.elements.closeRoomText);
  }

  createChatPanel() {
    const { width, height } = this.scene.cameras.main;

    // Chat button (collapsed by default) - positioned at bottom left
    this.elements.chatButton = this.scene.add.container(10, height - 50);

    // Chat button background
    const chatButtonBg = this.scene.add.rectangle(0, 0, 100, 40, 0x2C3E50, 0.9);
    chatButtonBg.setOrigin(0, 0);
    chatButtonBg.setInteractive();
    chatButtonBg.on('pointerdown', () => this.toggleChat());
    chatButtonBg.on('pointerover', () => chatButtonBg.setFillStyle(0x34495E));
    chatButtonBg.on('pointerout', () => chatButtonBg.setFillStyle(0x2C3E50));
    this.elements.chatButton.add(chatButtonBg);

    // Chat button text
    this.elements.chatButtonText = this.scene.add.text(50, 20, '💬 Chat', {
      fontSize: '14px',
      fontFamily: 'Arial',
      color: '#ffffff',
      fontStyle: 'bold'
    });
    this.elements.chatButtonText.setOrigin(0.5);
    this.elements.chatButton.add(this.elements.chatButtonText);

    // Chat panel (hidden by default) - positioned at bottom left, above button
    this.elements.chatPanel = this.scene.add.container(10, height - 290);
    this.elements.chatPanel.setVisible(false);

    // Background
    const chatBg = this.scene.add.rectangle(0, 0, 350, 200, 0x000000, 0.9);
    chatBg.setOrigin(0, 0);
    this.elements.chatPanel.add(chatBg);

    // Chat title with close button
    const chatTitle = this.scene.add.text(10, 5, 'Chat', {
      fontSize: '16px',
      fontFamily: 'Arial',
      color: '#ffffff',
      fontStyle: 'bold'
    });
    this.elements.chatPanel.add(chatTitle);

    // Close button
    const closeBtn = this.scene.add.text(330, 5, '✕', {
      fontSize: '16px',
      fontFamily: 'Arial',
      color: '#ff6b6b',
      fontStyle: 'bold'
    });
    closeBtn.setOrigin(0.5, 0);
    closeBtn.setInteractive();
    closeBtn.on('pointerdown', () => this.toggleChat());
    closeBtn.on('pointerover', () => closeBtn.setColor('#ff5252'));
    closeBtn.on('pointerout', () => closeBtn.setColor('#ff6b6b'));
    this.elements.chatPanel.add(closeBtn);

    // Chat messages area
    this.elements.chatMessages = this.scene.add.text(10, 25, '', {
      fontSize: '12px',
      fontFamily: 'Arial',
      color: '#ffffff',
      wordWrap: { width: 330 }
    });
    this.elements.chatPanel.add(this.elements.chatMessages);

    // Chat input (will be handled by DOM)
    this.createChatInput();

    this.isChatOpen = false;
  }

  createGameLog() {
    const { width, height } = this.scene.cameras.main;

    // Game log panel (positioned at bottom right corner)
    this.elements.logPanel = this.scene.add.container(width - 320, height - 220);

    // Background
    const logBg = this.scene.add.rectangle(0, 0, 300, 200, 0x000000, 0.8);
    logBg.setStrokeStyle(2, 0x34495E);
    logBg.setOrigin(0, 0);
    this.elements.logPanel.add(logBg);
    
    // Log title
    const logTitle = this.scene.add.text(10, 5, 'Game Log', {
      fontSize: '16px',
      fontFamily: 'Arial',
      color: '#ffffff',
      fontStyle: 'bold'
    });
    this.elements.logPanel.add(logTitle);
    
    // Log messages
    this.elements.logMessages = this.scene.add.text(10, 25, '', {
      fontSize: '10px',
      fontFamily: 'Arial',
      color: '#cccccc',
      wordWrap: { width: 280 },
      lineSpacing: 2
    });
    this.elements.logPanel.add(this.elements.logMessages);
  }

  createActionButtons() {
    // Action buttons container (will be shown when needed)
    this.elements.actionPanel = this.scene.add.container(0, 0);
    this.elements.actionPanel.setVisible(false);
  }

  toggleChat() {
    this.isChatOpen = !this.isChatOpen;
    this.elements.chatPanel.setVisible(this.isChatOpen);

    if (this.chatInput) {
      this.chatInput.style.display = this.isChatOpen ? 'block' : 'none';
    }

    // Update button text
    this.elements.chatButtonText.setText(this.isChatOpen ? '💬 Đóng' : '💬 Chat');
  }

  createChatInput() {
    // Create DOM input for chat
    const chatInput = document.createElement('input');
    chatInput.type = 'text';
    chatInput.placeholder = 'Nhập tin nhắn...';
    chatInput.style.position = 'absolute';
    chatInput.style.bottom = '110px';
    chatInput.style.left = '20px';
    chatInput.style.width = '330px';
    chatInput.style.height = '30px';
    chatInput.style.backgroundColor = '#2c3e50';
    chatInput.style.color = '#ffffff';
    chatInput.style.border = '1px solid #34495e';
    chatInput.style.borderRadius = '4px';
    chatInput.style.padding = '5px 10px';
    chatInput.style.fontSize = '12px';
    chatInput.style.outline = 'none';
    chatInput.style.display = 'none'; // Hidden by default

    chatInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter' && chatInput.value.trim()) {
        this.sendChatMessage(chatInput.value.trim());
        chatInput.value = '';
      }
    });

    document.body.appendChild(chatInput);
    this.chatInput = chatInput;
  }

  // Update methods
  updatePlayerInfo(playerData) {
    if (this.elements.playerName) {
      this.elements.playerName.setText(playerData.name || 'Unknown Player');
    }
    if (this.elements.moneyText) {
      this.elements.moneyText.setText(`Money: ${(playerData.money || 0).toLocaleString()} Vàng`);
    }
    if (this.elements.propertiesText) {
      this.elements.propertiesText.setText(`Properties: ${(playerData.ownedProperties || []).length}`);
    }
    if (this.elements.characterText && playerData.historicalCharacterCardInHand) {
      this.elements.characterText.setText(`Character: ${playerData.historicalCharacterCardInHand.title}`);
    }
  }

  updateTurnIndicator(isMyTurn, currentPlayerName) {
    if (this.elements.turnIndicator) {
      if (isMyTurn) {
        this.elements.turnIndicator.setText('YOUR TURN');
        this.elements.turnIndicator.setColor('#00ff00');
      } else {
        this.elements.turnIndicator.setText(`${currentPlayerName}'s turn`);
        this.elements.turnIndicator.setColor('#ff9900');
      }
    }

    // Update button states based on turn
    this.updateButtonStates(isMyTurn);
  }

  updateButtonStates(isMyTurn) {
    const gameStarted = this.gameState?.status === 'playing';
    const canRollDice = isMyTurn && gameStarted &&
                       (this.gameState?.gamePhase === 'WAITING_FOR_ROLL' ||
                        this.gameState?.gamePhase === 'PLAYER_TURN_START');

    console.log('🎮 Button States Update:', {
      isMyTurn,
      gameStarted,
      gamePhase: this.gameState?.gamePhase,
      gameStatus: this.gameState?.status,
      canRollDice
    });

    // Update roll dice button
    if (this.elements.rollDiceBtn) {
      if (canRollDice) {
        this.elements.rollDiceBtn.setFillStyle(0x4CAF50);
        this.elements.rollDiceBtn.setInteractive();
        this.elements.rollDiceText.setColor('#ffffff');
        console.log('✅ Roll dice button ENABLED');
      } else {
        this.elements.rollDiceBtn.setFillStyle(0x7F8C8D);
        this.elements.rollDiceBtn.disableInteractive();
        this.elements.rollDiceText.setColor('#BDC3C7');
        console.log('❌ Roll dice button DISABLED');
      }
    }

    // Update end turn button
    if (this.elements.endTurnBtn) {
      const canEndTurn = isMyTurn && gameStarted &&
                        (this.gameState?.gamePhase === 'TURN_ENDING' ||
                         this.gameState?.gamePhase === 'PLAYER_ACTION');

      if (canEndTurn) {
        this.elements.endTurnBtn.setFillStyle(0xF44336);
        this.elements.endTurnBtn.setInteractive();
        this.elements.endTurnText.setColor('#ffffff');
      } else {
        this.elements.endTurnBtn.setFillStyle(0x7F8C8D);
        this.elements.endTurnBtn.disableInteractive();
        this.elements.endTurnText.setColor('#BDC3C7');
      }
    }
  }

  updateGameLog(messages) {
    if (this.elements.logMessages) {
      const lastMessages = messages.slice(-10); // Show last 10 messages
      this.elements.logMessages.setText(lastMessages.join('\n'));
    }
  }

  updateDiceDisplay(diceValues, total, isDouble = false) {
    if (this.elements.dice1Container && this.elements.dice2Container && this.elements.diceTotal) {
      // Show dice panel
      this.elements.dicePanel.setVisible(true);

      // Create dice dots for each die
      this.createDiceDots(this.elements.dice1Container, diceValues[0]);
      this.createDiceDots(this.elements.dice2Container, diceValues[1]);

      // Update total with double indicator
      const totalText = `Total: ${total}${isDouble ? ' (DOUBLE!)' : ''}`;
      this.elements.diceTotal.setText(totalText);
      this.elements.diceTotal.setColor(isDouble ? '#FFD700' : '#FFFFFF');

      // Set dice animation flag
      this.isDiceAnimating = true;

      // Add realistic rolling animation
      // First phase: Fast spinning with random rotations
      this.scene.tweens.add({
        targets: this.elements.dice1Container,
        rotation: Math.PI * 6 + Math.random() * Math.PI, // Random final rotation
        scaleX: 1.3,
        scaleY: 1.3,
        duration: 1200,
        ease: 'Power2.easeOut'
      });

      this.scene.tweens.add({
        targets: this.elements.dice2Container,
        rotation: Math.PI * 5 + Math.random() * Math.PI, // Different rotation for each die
        scaleX: 1.3,
        scaleY: 1.3,
        duration: 1200,
        ease: 'Power2.easeOut'
      });

      // Add bouncing effect
      this.scene.tweens.add({
        targets: [this.elements.dice1Container, this.elements.dice2Container],
        y: -15,
        duration: 600,
        ease: 'Power2.easeOut',
        yoyo: true,
        onComplete: () => {
          // Second phase: Settle down
          this.scene.tweens.add({
            targets: [this.elements.dice1Container, this.elements.dice2Container],
            scaleX: 1,
            scaleY: 1,
            duration: 400,
            ease: 'Bounce.easeOut',
            onComplete: () => {
              // Animation completed, allow popups to show
              this.isDiceAnimating = false;
              console.log('🎲 Dice animation completed');

              // Check if there's a pending action to show
              if (this.scene.pendingAction) {
                console.log('🎯 Showing pending action after dice animation');
                // Add longer delay to let user see the final dice result
                this.scene.time.delayedCall(2000, () => {
                  this.scene.showPendingAction();
                });
              }
            }
          });
        }
      });

      // Add glow effect for double - made longer
      if (isDouble) {
        this.scene.tweens.add({
          targets: this.elements.dicePanel,
          alpha: 0.7,
          duration: 500, // Increased from 300ms to 500ms
          yoyo: true,
          repeat: 3, // Increased from 2 to 3 repeats
          ease: 'Power2'
        });
      }

      // Hide after 6 seconds - increased from 4 seconds
      this.scene.time.delayedCall(6000, () => {
        if (this.elements.dicePanel) {
          this.elements.dicePanel.setVisible(false);
        }
      });
    }
  }

  updateRoomName(roomName) {
    if (this.elements.roomNameText) {
      this.elements.roomNameText.setText(`Room: ${roomName || 'Unknown'}`);
    }
  }

  addChatMessage(username, message) {
    const currentText = this.elements.chatMessages.text;
    const newMessage = `${username}: ${message}`;
    const messages = currentText ? currentText.split('\n') : [];
    messages.push(newMessage);
    
    // Keep only last 8 messages
    if (messages.length > 8) {
      messages.shift();
    }
    
    this.elements.chatMessages.setText(messages.join('\n'));
  }

  // Action methods
  testSocket() {
    console.log('🧪 Test socket button clicked!');
    console.log('🧪 Socket service:', this.scene.socketService);
    console.log('🧪 Socket connected:', this.scene.socketService?.isConnected);
    console.log('🧪 Socket ID:', this.scene.socketService?.socket?.id);
    console.log('🧪 My Player ID:', this.scene.myPlayerId);
    console.log('🧪 Room ID:', this.scene.roomId);
    console.log('🧪 Game state:', this.gameState);

    if (this.scene.socketService && this.scene.socketService.isConnected) {
      console.log('🧪 Emitting test event...');
      this.scene.socketService.socket.emit('test', { message: 'Hello from client!' });
    } else {
      console.log('🧪 Socket not connected!');
    }
  }

  rollDice() {
    console.log('🎲 Roll dice button clicked!');
    console.log('🎲 Socket service available:', !!this.scene.socketService);
    console.log('🎲 Game state:', this.gameState);
    if (this.scene.socketService) {
      console.log('🎲 Calling socketService.rollDice()');
      this.scene.socketService.rollDice();
    }
  }

  testSocket() {
    console.log('🧪 Testing socket connection...');
    console.log('🧪 Socket connected:', this.scene.socketService.socket?.connected);
    console.log('🧪 Socket ID:', this.scene.socketService.socket?.id);
    console.log('🧪 My Player ID:', this.scene.myPlayerId);
    console.log('🧪 Room ID:', this.scene.roomId);
    console.log('🧪 Game State:', this.gameState);
    console.log('🧪 Is Room Host:', this.isRoomHost);

    // Test socket emit
    this.scene.socketService.socket?.emit('test', { message: 'Hello from client!' });
  }

  endTurn() {
    if (this.scene.socketService) {
      this.scene.socketService.endTurn();
    }
  }

  sendChatMessage(message) {
    if (this.scene.socketService) {
      this.scene.socketService.sendChatMessage(message);
    }
  }

  async leaveRoom() {
    console.log('GameUI: leaveRoom() called');
    console.log('GameUI: scene.roomId =', this.scene.roomId);
    console.log('GameUI: scene.apiService =', this.scene.apiService);
    console.log('GameUI: scene.socketService =', this.scene.socketService);

    const roomName = this.gameState?.roomName || this.gameState?.roomId || 'phòng chơi này';
    const result = await PopupManager.confirm(
      'Rời phòng',
      `Bạn có chắc chắn muốn rời khỏi phòng "${roomName}" không?`,
      {
        confirmText: 'Rời phòng',
        cancelText: 'Ở lại'
      }
    );

    if (result.isConfirmed) {
      try {
        console.log('GameUI: User confirmed leave room');
        PopupManager.loading('Đang rời phòng...');

        // Leave via API first
        if (this.scene.roomId) {
          console.log('GameUI: Calling API leaveRoom with roomId:', this.scene.roomId);
          await this.scene.apiService.leaveRoom(this.scene.roomId);
          console.log('GameUI: API leaveRoom completed');
        } else {
          console.warn('GameUI: No roomId available for API leave call');
        }

        // Then leave via socket
        if (this.scene.socketService) {
          console.log('GameUI: Calling socket leaveRoom');
          this.scene.socketService.leaveRoom();
          console.log('GameUI: Socket leaveRoom called');
        } else {
          console.warn('GameUI: No socketService available');
        }

        PopupManager.closeLoading();
        PopupManager.success('Thành công!', 'Đã rời khỏi phòng', { timer: 1500 });

        // Return to main menu with refresh flag
        setTimeout(() => {
          try {
            console.log('GameUI: Returning to MainMenuScene');
            if (this.scene.scene && this.scene.scene.start) {
              this.scene.scene.start('MainMenuScene', { shouldRefresh: true });
            }
          } catch (error) {
            console.error('Error returning to main menu:', error);
          }
        }, 1500);

      } catch (error) {
        console.error('Error leaving room:', error);
        PopupManager.closeLoading();
        PopupManager.error('Lỗi', `Không thể rời phòng: ${error.message || error}`);
      }
    }
  }

  // Host control methods
  async startGame() {
    console.log('🎮 Start game debug:');
    console.log('- isRoomHost:', this.isRoomHost);
    console.log('- gameState:', this.gameState);
    console.log('- players:', this.gameState?.players);
    console.log('- playerCount:', this.gameState?.players?.length);
    console.log('- game status:', this.gameState?.status);

    if (!this.isRoomHost) {
      PopupManager.error('Lỗi', 'Chỉ chủ phòng mới có thể bắt đầu game');
      return;
    }

    // Check if we have enough players
    const playerCount = this.gameState?.players?.length || 0;
    if (playerCount < 2) {
      PopupManager.error('Không thể bắt đầu', 'Cần ít nhất 2 người chơi để bắt đầu game');
      return;
    }

    const result = await PopupManager.confirm(
      'Bắt đầu game',
      `Bắt đầu game với ${playerCount} người chơi?`,
      {
        confirmText: 'Bắt đầu',
        cancelText: 'Hủy'
      }
    );

    if (result.isConfirmed) {
      try {
        PopupManager.loading('Đang bắt đầu game...');
        this.scene.socketService.startGame();
      } catch (error) {
        console.error('Error starting game:', error);
        PopupManager.closeLoading();
        PopupManager.error('Lỗi', 'Không thể bắt đầu game');
      }
    }
  }

  async showRoomSettings() {
    if (!this.isRoomHost) {
      PopupManager.error('Lỗi', 'Chỉ chủ phòng mới có thể thay đổi cài đặt');
      return;
    }

    const currentSettings = this.gameState?.settings || {};

    const result = await PopupManager.roomSettings({
      roomName: this.gameState?.roomName || '',
      maxPlayers: currentSettings.maxPlayers || 4,
      isPrivate: currentSettings.isPrivate || false,
      password: currentSettings.password || ''
    });

    if (result.isConfirmed && result.value) {
      try {
        PopupManager.loading('Đang cập nhật cài đặt...');

        // Import ApiService
        const ApiService = (await import('../services/ApiService.js')).default;

        // Call HTTP API instead of socket
        const response = await ApiService.updateRoom(this.gameState.roomId, result.value);

        PopupManager.closeLoading();
        PopupManager.success('Thành công', 'Cài đặt phòng đã được cập nhật!', { timer: 3000 });

        // Update local game state immediately (socket event will also update)
        if (response.game) {
          console.log('🔄 Updating local game state after room settings update:');
          console.log('- Old gameState:', this.gameState);
          console.log('- Response game:', response.game);

          this.gameState.roomName = response.game.roomName;
          this.gameState.settings = response.game.settings;
          this.updateRoomName(response.game.roomName);

          console.log('- New gameState:', this.gameState);
          console.log('- isRoomHost after update:', this.isRoomHost);

          // Force update host controls
          this.updateHostControls();
        }

      } catch (error) {
        console.error('Error updating room settings:', error);
        PopupManager.closeLoading();
        PopupManager.error('Lỗi', error.response?.data?.error || 'Không thể cập nhật cài đặt phòng');
      }
    }
  }

  async closeRoom() {
    if (!this.isRoomHost) {
      PopupManager.error('Lỗi', 'Chỉ chủ phòng mới có thể đóng phòng');
      return;
    }

    const result = await PopupManager.confirm(
      'Đóng phòng',
      'Bạn có chắc chắn muốn đóng phòng? Tất cả người chơi sẽ bị đưa ra khỏi phòng.',
      {
        confirmText: 'Đóng phòng',
        cancelText: 'Hủy'
      }
    );

    if (result.isConfirmed) {
      try {
        PopupManager.loading('Đang đóng phòng...');

        // Import ApiService
        const ApiService = (await import('../services/ApiService.js')).default;

        // Call HTTP API to close room
        await ApiService.closeRoom(this.gameState.roomId);

        PopupManager.closeLoading();
        PopupManager.success('Thành công', 'Phòng đã được đóng!', { timer: 2000 });

        // Return to main menu after a short delay
        setTimeout(() => {
          this.scene.scene.start('MainMenuScene', { shouldRefresh: true });
        }, 2000);

      } catch (error) {
        console.error('Error closing room:', error);
        PopupManager.closeLoading();
        PopupManager.error('Lỗi', error.response?.data?.error || 'Không thể đóng phòng');
      }
    }
  }

  // Update UI based on game state and host status
  updateGameState(gameState) {
    console.log('🎨 GameUI received game state:', gameState);
    this.gameState = gameState;
    this.updateHostControls();
    this.updateGameStatus();

    // Update button states based on current player
    if (gameState && gameState.players && this.scene.myPlayerId) {
      const currentPlayer = gameState.players.find(p => p.id === gameState.currentPlayerId);
      const isMyTurn = currentPlayer && currentPlayer.id === this.scene.myPlayerId;
      this.updateButtonStates(isMyTurn);
    }
  }

  updateGameStatus() {
    if (this.elements.gameStatusText && this.gameState) {
      const playerCount = this.gameState.players?.length || 0;
      const maxPlayers = this.gameState.settings?.maxPlayers || 4;
      const status = this.gameState.status || 'waiting';

      let statusText = '';
      switch (status) {
        case 'waiting':
          statusText = `Đang chờ người chơi... (${playerCount}/${maxPlayers})`;
          break;
        case 'playing':
          statusText = 'Đang chơi';
          break;
        case 'finished':
          statusText = 'Đã kết thúc';
          break;
        default:
          statusText = 'Không xác định';
      }

      this.elements.gameStatusText.setText(`Status: ${statusText}`);
    }
  }

  setRoomHost(isHost) {
    console.log('🏠 Setting room host:', isHost);
    this.isRoomHost = isHost;
    this.updateHostControls();
  }

  updateHostControls() {
    console.log('🏠 Updating host controls, isRoomHost:', this.isRoomHost, 'hostPanel exists:', !!this.elements.hostPanel);
    if (this.elements.hostPanel) {
      this.elements.hostPanel.setVisible(this.isRoomHost);
      console.log('🏠 Host panel visibility set to:', this.isRoomHost);
    }

    // Update start game button state
    if (this.elements.startGameBtn && this.isRoomHost) {
      const playerCount = this.gameState?.players?.length || 0;
      const canStart = playerCount >= 2 && this.gameState?.status === 'waiting';

      if (canStart) {
        this.elements.startGameBtn.setFillStyle(0x27AE60);
        this.elements.startGameText.setColor('#ffffff');
      } else {
        this.elements.startGameBtn.setFillStyle(0x7F8C8D);
        this.elements.startGameText.setColor('#BDC3C7');
      }
    }
  }

  addGameLogMessage(message) {
    if (this.elements.logMessages) {
      const currentText = this.elements.logMessages.text;
      const messages = currentText ? currentText.split('\n') : [];
      messages.push(message);

      // Keep only last 10 messages
      if (messages.length > 10) {
        messages.shift();
      }

      this.elements.logMessages.setText(messages.join('\n'));
    }
  }

  // Show action dialogs
  async showPropertyPurchaseDialog(squareData) {
    const result = await PopupManager.propertyPurchase(squareData);

    if (result.isConfirmed && this.scene.socketService) {
      this.scene.socketService.buyProperty(squareData.squareId);
    } else if (this.scene.socketService) {
      this.scene.socketService.skipAction();
    }
  }

  async showBuildingDialog(squareData) {
    const buildingOptions = Object.entries(squareData.costs);

    let optionsHtml = '<div style="text-align: left;">';
    buildingOptions.forEach(([type, cost], index) => {
      optionsHtml += `
        <label style="display: block; margin: 10px 0; color: #ffd700;">
          <input type="radio" name="buildingType" value="${type}" style="margin-right: 10px;">
          ${type} - ${cost.toLocaleString()} Vàng
        </label>
      `;
    });
    optionsHtml += '</div>';

    const result = await PopupManager.custom({
      title: '🏗️ Xây Dựng Công Trình',
      html: optionsHtml,
      showCancelButton: true,
      confirmButtonText: 'Xây dựng',
      cancelButtonText: 'Hủy',
      preConfirm: () => {
        const selected = document.querySelector('input[name="buildingType"]:checked');
        if (!selected) {
          PopupManager.error('Lỗi', 'Vui lòng chọn loại công trình');
          return false;
        }
        return selected.value;
      }
    });

    if (result.isConfirmed && this.scene.socketService) {
      this.scene.socketService.buildBuilding(squareData.squareId, result.value);
    }
  }

  async showPaymentOptionsDialog(data) {
    const buttons = [
      { key: 'PAY_RENT', text: 'Trả tiền thuê', color: '#f44336' },
    ];

    if (data.allowPurchase) {
      buttons.push({ key: 'PURCHASE_PROPERTY', text: 'Mua bất động sản', color: '#4CAF50' });
    }

    if (data.allowChallenge) {
      buttons.push({ key: 'CHALLENGE_OWNER', text: 'Thách đấu chủ sở hữu', color: '#FF9800' });
    }

    let optionsHtml = `
      <div style="text-align: center; margin-bottom: 20px;">
        <h3 style="color: #ffd700;">Số tiền: ${data.amount.toLocaleString()} Vàng</h3>
      </div>
      <div style="text-align: left;">
    `;

    buttons.forEach((btn, idx) => {
      optionsHtml += `
        <label style="display: block; margin: 15px 0; color: ${btn.color}; font-weight: bold;">
          <input type="radio" name="paymentAction" value="${btn.key}" style="margin-right: 10px;">
          ${btn.text}
        </label>
      `;
    });

    optionsHtml += '</div>';

    const result = await PopupManager.custom({
      title: '💰 Lựa Chọn Thanh Toán',
      html: optionsHtml,
      showCancelButton: false,
      confirmButtonText: 'Xác nhận',
      allowOutsideClick: false,
      preConfirm: () => {
        const selected = document.querySelector('input[name="paymentAction"]:checked');
        if (!selected) {
          PopupManager.error('Lỗi', 'Vui lòng chọn một hành động');
          return false;
        }
        return selected.value;
      }
    });

    if (result.isConfirmed && this.scene.socketService) {
      this.scene.socketService.sendPaymentDecision(result.value, data);
    }
  }

  async showJailOptionsDialog(data) {
    const buttons = [];

    if (data.canPayFine) {
      buttons.push({ key: 'PAY_FINE', text: '💰 Nộp phạt (50,000 Vàng)', color: '#f44336' });
    }

    if (data.canUseCard) {
      buttons.push({ key: 'USE_CARD', text: '🎫 Dùng thẻ miễn phí', color: '#4CAF50' });
    }

    buttons.push({ key: 'ROLL_DOUBLES', text: '🎲 Tung xúc xắc (thử ra tù)', color: '#FF9800' });
    buttons.push({ key: 'SKIP_TURN', text: '⏭️ Bỏ lượt', color: '#9E9E9E' });

    let optionsHtml = `
      <div style="text-align: center; margin-bottom: 20px;">
        <h3 style="color: #ffd700;">🏛️ Bạn đang ở trong tù</h3>
        <p style="color: #ffffff;">Còn ${data.turnsLeft} lượt thử</p>
      </div>
      <div style="text-align: left;">
    `;

    buttons.forEach((btn) => {
      optionsHtml += `
        <label style="display: block; margin: 15px 0; color: ${btn.color}; font-weight: bold; cursor: pointer;">
          <input type="radio" name="jailAction" value="${btn.key}" style="margin-right: 10px;">
          ${btn.text}
        </label>
      `;
    });

    optionsHtml += '</div>';

    const result = await PopupManager.custom({
      title: '🏛️ Tùy chọn trong tù',
      html: optionsHtml,
      showCancelButton: false,
      confirmButtonText: 'Xác nhận',
      allowOutsideClick: false,
      preConfirm: () => {
        const selected = document.querySelector('input[name="jailAction"]:checked');
        if (!selected) {
          PopupManager.error('Lỗi', 'Vui lòng chọn một hành động');
          return false;
        }
        return selected.value;
      }
    });

    if (result.isConfirmed && this.scene.socketService) {
      this.scene.socketService.handleJailDecision(result.value);
    }
  }

  async showHorseDestinationDialog(data) {
    const availableSquares = data.availableSquares || [];

    let optionsHtml = `
      <div style="text-align: center; margin-bottom: 20px;">
        <h3 style="color: #ffd700;">🐎 Chọn điểm đến</h3>
        <p style="color: #ffffff;">Bạn có thể di chuyển đến một trong các ô sau:</p>
      </div>
      <div style="text-align: left; max-height: 300px; overflow-y: auto;">
    `;

    availableSquares.forEach((square) => {
      optionsHtml += `
        <label style="display: block; margin: 10px 0; color: #ffd700; cursor: pointer; padding: 5px; border: 1px solid #444; border-radius: 4px;">
          <input type="radio" name="destination" value="${square.id}" style="margin-right: 10px;">
          <strong>Ô ${square.position}:</strong> ${square.name}
        </label>
      `;
    });

    optionsHtml += '</div>';

    const result = await PopupManager.custom({
      title: '🐎 Chọn điểm đến',
      html: optionsHtml,
      showCancelButton: true,
      confirmButtonText: 'Di chuyển',
      cancelButtonText: 'Hủy',
      preConfirm: () => {
        const selected = document.querySelector('input[name="destination"]:checked');
        if (!selected) {
          PopupManager.error('Lỗi', 'Vui lòng chọn điểm đến');
          return false;
        }
        return selected.value;
      }
    });

    if (result.isConfirmed && this.scene.socketService) {
      this.scene.socketService.handleHorseDestination(result.value);
    }
  }

  setVisible(visible) {
    this.isVisible = visible;
    Object.values(this.elements).forEach(element => {
      if (element && element.setVisible) {
        element.setVisible(visible);
      }
    });

    if (this.chatInput) {
      this.chatInput.style.display = visible ? 'block' : 'none';
    }
  }

  destroy() {
    if (this.chatInput) {
      document.body.removeChild(this.chatInput);
    }
    
    Object.values(this.elements).forEach(element => {
      if (element && element.destroy) {
        element.destroy();
      }
    });
  }
}

export default GameUI;
