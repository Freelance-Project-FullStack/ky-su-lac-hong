// server/src/game/cards/EventCard.js
const Card = require('./Card');

class EventCard extends Card {
  constructor({ id, title, descriptionText, cardType, imageAsset, eventType, ...effectParams }) {
    super({ id, title, descriptionText, cardType, imageAsset });
    this.eventType = eventType; // Ví dụ: GAIN_MONEY, LOSE_MONEY, MOVE_TO_SQUARE, etc.
    this.effectParams = effectParams; // amount, targetSquareIndex, etc.
  }

  applyEffect(player, gameManager) {
    super.applyEffect(player, gameManager);
    gameManager.logGameAction(`${player.name} rút thẻ Sự kiện: "${this.title}". ${this.descriptionText}`);

    switch (this.eventType) {
      case 'GAIN_MONEY':
        player.addMoney(this.effectParams.amount);
        gameManager.emitPlayerUpdate(player);
        gameManager.emitGameLog(`[Sự Kiện] ${player.name} nhận ${this.effectParams.amount} Vàng.`);
        break;
      case 'LOSE_MONEY':
        player.subtractMoney(this.effectParams.amount);
        gameManager.emitPlayerUpdate(player);
        gameManager.emitGameLog(`[Sự Kiện] ${player.name} mất ${this.effectParams.amount} Vàng.`);
        break;
      case 'MOVE_TO_SQUARE':
        const targetSquareIndex = this.effectParams.targetSquareIndex !== undefined
            ? this.effectParams.targetSquareIndex
            : gameManager.board.getSquareByName(this.effectParams.targetSquareName)?.id; // Cần lấy index từ id
        if (targetSquareIndex !== undefined) {
            const boardSize = gameManager.board.squares.length;
            // Tìm index của square theo ID
            const actualIndex = gameManager.board.squares.findIndex(sq => sq.id === targetSquareIndex);
            if (actualIndex !== -1) {
                // Kiểm tra xem có đi qua ô START không nếu là di chuyển tiến
                if (actualIndex > player.tokenPositionIndex || this.effectParams.passGo === false ) { // passGo: false nghĩa là không qua START dù có lùi
                     // không làm gì
                } else if (this.effectParams.passGo !== false) { // Nếu không ghi rõ là không qua Start, thì có qua Start
                    player.addMoney(gameManager.gameSettings.moneyPerLap);
                     gameManager.emitGameLog(`${player.name} đi qua LẬP QUỐC, nhận ${gameManager.gameSettings.moneyPerLap} Vàng.`);
                }
                player.updatePosition(actualIndex);
                gameManager.emitPlayerMove(player, actualIndex);
                gameManager.handlePlayerLandingOnSquare(player, gameManager.board.getSquareByIndex(actualIndex));
            }
        } else {
            gameManager.emitGameLog(`[Lỗi Thẻ Sự Kiện] Không tìm thấy ô đích: ${this.effectParams.targetSquareName || this.effectParams.targetSquareIndex}`);
        }
        break;
      case 'GET_OUT_OF_JAIL_FREE':
        player.addGetOutOfJailFreeCard();
        gameManager.emitPlayerUpdate(player);
        gameManager.emitGameLog(`[Sự Kiện] ${player.name} nhận thẻ Miễn Phí Ra Tù.`);
        break;
      // Thêm các case khác: PAY_PER_BUILDING, DESTROY_BUILDING, FORCE_TAX_COLLECTION
      default:
        console.warn(`Unknown event type: ${this.eventType}`);
        gameManager.emitGameLog(`[Sự Kiện] Hiệu ứng thẻ "${this.title}" chưa được triển khai.`);
    }
  }
}

module.exports = EventCard;