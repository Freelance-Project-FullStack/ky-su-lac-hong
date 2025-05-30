// client/src/scenes/GameScene.js
import Phaser from 'phaser';
import socketService from '../services/SocketService';

export default class GameScene extends Phaser.Scene {
  constructor() {
    super('GameScene');
    this.gameState = null;
    this.playerSprites = {}; // key: playerId, value: Phaser.GameObjects.Sprite
    this.squareSprites = {}; // key: squareId, value: Phaser.GameObjects.Sprite (or custom class)
    this.uiElements = {}; // Buttons, text displays
  }

  preload() {
    // Load assets đã được PreloadScene tải trước đó, hoặc load asset động nếu cần
    this.load.image('boardBackground', 'assets/images/board/ban_co_ chinh.png'); // Tên file ví dụ
    this.load.image('playerTokenRed', 'assets/images/tokens/token_red.png');
    // ... load thêm các tài sản cần thiết cho GameScene
  }

  create() {
    console.log('GameScene created');
    // Hiển thị bàn cờ, UI ban đầu
    this.add.image(this.cameras.main.centerX, this.cameras.main.centerY, 'boardBackground').setScale(0.8); // Ví dụ

    // Lắng nghe sự kiện từ SocketService
    socketService.on('gameStateUpdate', this.handleGameStateUpdate, this);
    socketService.on('playerMoved', this.handlePlayerMoved, this);
    socketService.on('diceRolled', this.handleDiceRolled, this);
    socketService.on('newGameLog', this.displayGameLog, this);
    socketService.on('promptAction', this.handlePromptAction, this);
    socketService.on('gameOver', this.handleGameOver, this);
    // ... các listeners khác

    // Nút tung xúc xắc (ví dụ)
    this.uiElements.rollDiceButton = this.add.text(100, 50, 'Tung Xúc Xắc', {
        fontSize: '24px', fill: '#fff', backgroundColor: '#333', padding: { x:10, y:5}
    })
      .setInteractive()
      .on('pointerdown', () => {
        if (this.gameState && this.gameState.currentPlayerId === socketService.getSocketId() && this.gameState.gamePhase === 'WAITING_FOR_ROLL') {
           socketService.rollDice();
           this.uiElements.rollDiceButton.disableInteractive().setAlpha(0.5); // Vô hiệu hóa sau khi click
        }
      })
      .disableInteractive().setAlpha(0.5); // Ban đầu vô hiệu hóa

    // Nút kết thúc lượt
    this.uiElements.endTurnButton = this.add.text(300, 50, 'Kết Thúc Lượt', {
        fontSize: '24px', fill: '#fff', backgroundColor: '#333', padding: {x:10, y:5}
    })
      .setInteractive()
      .on('pointerdown', () => {
          if (this.gameState && this.gameState.currentPlayerId === socketService.getSocketId() && this.gameState.gamePhase === 'TURN_ENDING') {
              socketService.sendEndTurn();
              this.uiElements.endTurnButton.disableInteractive().setAlpha(0.5);
          }
      })
      .disableInteractive().setAlpha(0.5);

    // Hiển thị thông tin người chơi hiện tại, tiền, etc.
    this.uiElements.currentPlayerText = this.add.text(50, 10, '', { fontSize: '16px', fill: '#fff'});
    this.uiElements.playerMoneyText = this.add.text(50, 30, '', { fontSize: '16px', fill: '#fff'});

    // Yêu cầu server gửi trạng thái game hiện tại nếu client vừa join lại
    // (Cần logic để biết là join mới hay join lại)
    // socketService.requestInitialGameState(); // Gửi một event lên server
  }

  update(time, delta) {
    // Cập nhật UI dựa trên gameState
    if (this.gameState) {
        const me = this.gameState.players.find(p => p.id === socketService.getSocketId());
        if (me) {
            this.uiElements.playerMoneyText.setText(`Vàng: ${me.money}`);
        }

        const currentPlayer = this.gameState.players.find(p => p.id === this.gameState.currentPlayerId);
        if (currentPlayer) {
            this.uiElements.currentPlayerText.setText(`Lượt của: ${currentPlayer.name} (${this.gameState.gamePhase})`);

            const amICurrentPlayer = currentPlayer.id === socketService.getSocketId();

            // Kích hoạt/Vô hiệu hóa nút tung xúc xắc
            if (amICurrentPlayer && this.gameState.gamePhase === 'WAITING_FOR_ROLL' && !currentPlayer.isInJail) {
                this.uiElements.rollDiceButton.setInteractive().setAlpha(1);
            } else {
                this.uiElements.rollDiceButton.disableInteractive().setAlpha(0.5);
            }
            // Kích hoạt/Vô hiệu hóa nút kết thúc lượt
            if (amICurrentPlayer && (this.gameState.gamePhase === 'TURN_ENDING' || (currentPlayer.isInJail && this.gameState.gamePhase === 'PLAYER_ACTION') )) {
                this.uiElements.endTurnButton.setInteractive().setAlpha(1);
            } else {
                this.uiElements.endTurnButton.disableInteractive().setAlpha(0.5);
            }
        }
    }
  }

  handleGameStateUpdate(gameState) {
    console.log('Received GameState Update:', gameState);
    this.gameState = gameState;
    // Vẽ lại toàn bộ hoặc cập nhật các thay đổi
    this.gameState.players.forEach(player => {
      if (!this.playerSprites[player.id]) {
        // Tạo sprite cho người chơi mới
        // Ví dụ: this.playerSprites[player.id] = this.add.sprite(x, y, 'playerTokenRed').setData('playerId', player.id);
        // Màu sắc quân cờ nên dựa trên player.color
        const squareData = this.gameState.board.squares[player.tokenPositionIndex];
        const {x, y} = this.getSquarePixelPosition(squareData.id); // Cần hàm này để lấy tọa độ pixel
        this.playerSprites[player.id] = this.add.circle(x, y, 10, parseInt(player.color.replace('#','0x'), 16)).setData('playerId', player.id);
        this.playerSprites[player.id].setStrokeStyle(2, 0x000000);
      }
      // Cập nhật vị trí, tiền, etc.
      const squareData = this.gameState.board.squares[player.tokenPositionIndex];
      const {x, y} = this.getSquarePixelPosition(squareData.id);
      this.playerSprites[player.id].setPosition(x,y);

      // Cập nhật sở hữu ô đất (đổi màu viền ô đất)
    });

    this.gameState.board.squares.forEach(square => {
        if (square.ownerId) {
            const owner = this.gameState.players.find(p => p.id === square.ownerId);
            if (owner && this.squareSprites[square.id]) { // Giả sử squareSprites là các hình chữ nhật đại diện ô
                // this.squareSprites[square.id].setStrokeStyle(4, parseInt(owner.color.replace('#','0x'), 16));
            }
        }
    });

    // Cập nhật UI khác
  }

  handlePlayerMoved(moveData) {
    console.log('Player Moved:', moveData);
    const { playerId, newSquareIndex, diceRoll } = moveData;
    const playerSprite = this.playerSprites[playerId];
    if (playerSprite && this.gameState) {
      const targetSquare = this.gameState.board.squares[newSquareIndex];
      const {x, y} = this.getSquarePixelPosition(targetSquare.id);

      // Hoạt ảnh di chuyển
      this.tweens.add({
        targets: playerSprite,
        x: x,
        y: y,
        ease: 'Power2',
        duration: 500, // Nhanh hơn nếu nhiều bước
        onComplete: () => {
            // Sau khi di chuyển xong, có thể hiển thị thông tin ô đất nếu cần
        }
      });
    }
  }

  handleDiceRolled(diceData) {
    console.log('Dice Rolled:', diceData);
    // Hiển thị hoạt ảnh xúc xắc, sau đó kết quả
    // Ví dụ đơn giản:
    this.displayGameLog(`${this.gameState.players.find(p=>p.id === diceData.playerId)?.name} tung: ${diceData.values.join(', ')} (Tổng: ${diceData.total}) ${diceData.isDouble ? 'ĐÔI!' : ''}`);
  }

  displayGameLog(message) {
    console.log('Game Log:', message);
    // Hiển thị log lên UI của game
    // Ví dụ: this.uiElements.gameLogText.setText(this.uiElements.gameLogText.text + '\n' + message);
  }

  handlePromptAction(actionData) {
    console.log('Prompt Action:', actionData);
    // Hiển thị popup hoặc các nút tương ứng với actionType
    // Ví dụ:
    if (actionData.actionType === 'LAND_ACTION_BUY') {
      const square = this.gameState.board.squares.find(s => s.id === actionData.data.squareId);
      const buyPopup = this.add.group();
      const background = this.add.rectangle(this.cameras.main.centerX, this.cameras.main.centerY, 300, 200, 0xcccccc).setStrokeStyle(2,0x000000);
      const text = this.add.text(this.cameras.main.centerX, this.cameras.main.centerY - 50, `Mua ${square.name} giá ${actionData.data.price} Vàng?`, { color: '#000', align:'center', wordWrap: {width: 280}}).setOrigin(0.5);
      const buyButton = this.add.text(this.cameras.main.centerX - 50, this.cameras.main.centerY + 50, 'Mua', {fontSize: '20px', fill: '#fff', backgroundColor: '#008000', padding: {x:10,y:5}}).setOrigin(0.5).setInteractive()
        .on('pointerdown', () => {
          socketService.sendPurchaseDecision(actionData.data.squareId, true);
          buyPopup.destroy(true);
        });
      const passButton = this.add.text(this.cameras.main.centerX + 50, this.cameras.main.centerY + 50, 'Bỏ Qua', {fontSize: '20px', fill: '#fff', backgroundColor: '#800000', padding: {x:10,y:5}}).setOrigin(0.5).setInteractive()
        .on('pointerdown', () => {
          socketService.sendPurchaseDecision(actionData.data.squareId, false);
          buyPopup.destroy(true);
        });
      buyPopup.addMultiple([background, text, buyButton, passButton]);
    }
    // Thêm các case cho LAND_ACTION_BUILD, JAIL_OPTIONS, etc.
  }

  handleGameOver(gameEndData) {
    console.log('Game Over:', gameEndData);
    // Hiển thị màn hình kết thúc game
    const winnerText = gameEndData.winner ? `${gameEndData.winner.name} chiến thắng!` : "Hòa!";
    this.add.text(this.cameras.main.centerX, this.cameras.main.centerY, `KẾT THÚC\n${winnerText}\nLý do: ${gameEndData.reason}`, {
      fontSize: '32px', fill: '#fff', align: 'center', backgroundColor: 'rgba(0,0,0,0.7)'
    }).setOrigin(0.5);
  }

  // Hàm tiện ích để lấy tọa độ pixel của một ô trên bàn cờ
  getSquarePixelPosition(squareId) {
    // Logic này phụ thuộc vào cách bạn vẽ bàn cờ
    // Ví dụ đơn giản cho bàn cờ 10x10 (40 ô)
    const squareIndex = this.gameState.board.squares.findIndex(s => s.id === squareId);
    const boardSize = 40;
    const sideLength = 10; // Số ô mỗi cạnh (nếu là hình vuông)
    const squareWidth = 60; // Kích thước pixel của 1 ô
    const squareHeight = 80;
    const boardStartX = this.cameras.main.centerX - (sideLength / 2 * squareWidth);
    const boardStartY = this.cameras.main.centerY - (sideLength / 2 * squareHeight); // Giả sử là hình chữ U

    let x = boardStartX, y = boardStartY;

    if (squareIndex < sideLength) { // Cạnh dưới
        x += squareIndex * squareWidth;
        y += (sideLength -1) * squareHeight;
    } else if (squareIndex < sideLength * 2 - 1) { // Cạnh trái (không tính góc)
        x += 0;
        y += (sideLength - 1 - (squareIndex - (sideLength -1)) ) * squareHeight;
    } else if (squareIndex < sideLength * 3 - 2) { // Cạnh trên (không tính góc)
        x += (squareIndex - (sideLength * 2 - 2) ) * squareWidth;
        y += 0;
    } else if (squareIndex < sideLength * 4 - 3) { // Cạnh phải (không tính góc)
        x += (sideLength -1) * squareWidth;
        y += (squareIndex - (sideLength * 3 - 3)) * squareHeight;
    }
    // Đây là ví dụ rất thô, cần điều chỉnh cho đúng layout bàn cờ của bạn
    return { x: x + squareWidth/2, y: y + squareHeight/2 }; // Trả về tâm ô
  }

  handlePromptAction(actionData) {
    console.log('Prompt Action:', actionData);
    // Đóng các popup cũ nếu có
    if (this.activePopup) {
        this.activePopup.destroy();
    }

    const { actionType, data } = actionData;
    const centerX = this.cameras.main.centerX;
    const centerY = this.cameras.main.centerY;

    switch(actionType) {
      case 'LAND_ACTION_BUY':
        this.showBuyPropertyPopup(centerX, centerY, data);
        break;

      case 'LAND_ACTION_BUILD':
        this.showBuildPopup(centerX, centerY, data);
        break;

      case 'JAIL_OPTIONS':
        this.showJailOptionsPopup(centerX, centerY, data);
        break;

      case 'MANAGE_DEBT':
        this.showManageDebtPopup(centerX, centerY, data);
        break;

      case 'SPECIAL_ACTION_HORSE_CHOOSE_DESTINATION':
        this.activateHorseMode();
        break;

      // Thêm các case khác...
    }
  }

  // --- Các hàm tạo Popup ---

  showBuyPropertyPopup(x, y, data) {
    const square = this.gameState.board.squares.find(s => s.id === data.squareId);
    const popup = new Popup(this, x, y, 350, 250);
    this.activePopup = popup;

    const title = this.add.text(0, -100, `Mua đất?`, { fontSize: '24px', fill: '#000'}).setOrigin(0.5);
    const infoText = this.add.text(0, -40, `Bạn có muốn mua\n${square.name}\nvới giá ${data.price} Vàng không?`, {
        fontSize: '18px', fill: '#333', align: 'center', lineSpacing: 5
    }).setOrigin(0.5);

    const buyButton = this.add.text(-70, 80, 'Mua', { fontSize: '20px', fill: '#fff', backgroundColor: '#28a745', padding: {x:10,y:5}}).setOrigin(0.5).setInteractive()
      .on('pointerdown', () => {
        socketService.sendPurchaseDecision(data.squareId, true);
        popup.destroy();
      });

    const passButton = this.add.text(70, 80, 'Bỏ Qua', { fontSize: '20px', fill: '#fff', backgroundColor: '#dc3545', padding: {x:10,y:5}}).setOrigin(0.5).setInteractive()
      .on('pointerdown', () => {
        socketService.sendPurchaseDecision(data.squareId, false);
        popup.destroy();
      });

    popup.add([title, infoText, buyButton, passButton]);
  }

  showBuildPopup(x, y, data) {
    const square = this.gameState.board.squares.find(s => s.id === data.squareId);
    const popup = new Popup(this, x, y, 400, 300);
    this.activePopup = popup;
    popup.addCloseButton(); // Cho phép người chơi đóng nếu không muốn xây

    const title = this.add.text(0, -120, `Xây dựng tại ${square.name}`, { fontSize: '24px', fill: '#000'}).setOrigin(0.5);
    popup.add(title);

    let buttonY = -60;
    // data.costs là đối tượng { "NHA": 5000, "DEN": 8000 }
    for (const [buildingType, cost] of Object.entries(data.costs)) {
        const buildButton = this.add.text(0, buttonY, `Xây ${buildingType} (${cost} Vàng)`, { fontSize: '18px', fill: '#fff', backgroundColor: '#007bff', padding: {x:10,y:5}, fixedWidth: 250, align:'center'}).setOrigin(0.5).setInteractive()
          .on('pointerdown', () => {
              socketService.sendBuildDecision(data.squareId, buildingType);
              popup.destroy();
          });
        popup.add(buildButton);
        buttonY += 60;
    }
  }

  showJailOptionsPopup(x, y, data) {
    const popup = new Popup(this, x, y, 350, 250);
    this.activePopup = popup;

    const title = this.add.text(0, -100, `Bạn đang ở trong tù!`, { fontSize: '24px', fill: '#000'}).setOrigin(0.5);
    const infoText = this.add.text(0, -60, `Còn ${data.turnsLeft} lượt thử.`, { fontSize: '18px', fill: '#333'}).setOrigin(0.5);
    popup.add([title, infoText]);

    let buttonY = 0;
    if (data.canPayFine) {
      const payButton = this.add.text(0, buttonY, `Nộp phạt 5000 Vàng`, { fontSize: '16px', backgroundColor: '#ffc107', color: '#000', padding: {x:10,y:5}, fixedWidth: 200, align: 'center' }).setOrigin(0.5).setInteractive()
        .on('pointerdown', () => {
          socketService.sendJailDecision({ decision: 'PAY_FINE'});
          popup.destroy();
        });
      popup.add(payButton);
      buttonY += 50;
    }
    if (data.canUseCard) {
      const useCardButton = this.add.text(0, buttonY, `Dùng thẻ ra tù`, { fontSize: '16px', backgroundColor: '#17a2b8', color: '#fff', padding: {x:10,y:5}, fixedWidth: 200, align: 'center' }).setOrigin(0.5).setInteractive()
        .on('pointerdown', () => {
          socketService.sendJailDecision({ decision: 'USE_CARD' });
          popup.destroy();
        });
      popup.add(useCardButton);
      buttonY += 50;
    }

    const rollButton = this.add.text(0, buttonY, `Tung xúc xắc (thử vận may)`, { fontSize: '16px', backgroundColor: '#6c757d', color: '#fff', padding: {x:10,y:5}, fixedWidth: 200, align: 'center' }).setOrigin(0.5).setInteractive()
      .on('pointerdown', () => {
        socketService.rollDice(); // Backend sẽ biết người chơi đang ở trong tù
        popup.destroy();
      });
    popup.add(rollButton);
  }

  activateHorseMode() {
    this.displayGameLog("Ngựa Ô: Hãy chọn một ô bất kỳ để di chuyển đến!");
    // Làm cho các ô trên bàn cờ có thể tương tác
    // Giả sử bạn có một group chứa các sprite của ô đất
    this.squareSpritesGroup.getChildren().forEach(squareSprite => {
        squareSprite.setInteractive()
                    .on('pointerdown', () => {
                        const targetSquareId = squareSprite.getData('squareId');
                        socketService.sendSpecialActionHorseMove(targetSquareId);
                        this.deactivateHorseMode(); // Tắt chế độ chọn sau khi đã chọn
                    });
        // Có thể thêm hiệu ứng highlight khi di chuột qua
        squareSprite.on('pointerover', () => squareSprite.setStrokeStyle(4, 0xff00ff)); // Highlight màu tím
        squareSprite.on('pointerout', () => squareSprite.setStrokeStyle(1, 0x000000)); // Trở về bình thường
    });
  }

  deactivateHorseMode() {
    if (this.squareSpritesGroup) {
        this.squareSpritesGroup.getChildren().forEach(squareSprite => {
            squareSprite.disableInteractive();
            squareSprite.setStrokeStyle(1, 0x000000); // Reset style
        });
    }
  }
  
}