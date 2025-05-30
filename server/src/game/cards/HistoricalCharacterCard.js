// server/src/game/cards/HistoricalCharacterCard.js
const Card = require('./Card');

class HistoricalCharacterCard extends Card {
  constructor({ id, title, descriptionText, cardType, imageAsset, powerDescription, activationCondition }) {
    super({ id, title, descriptionText, cardType, imageAsset });
    this.powerDescription = powerDescription;
    this.activationCondition = activationCondition; // ANY_TIME, ON_LANDING_PROPERTY, etc.
    this.isUsed = false;
  }

  applyEffect(player, gameManager) {
    if (this.isUsed) {
      gameManager.emitGameLogToPlayer(player.id, `Thẻ ${this.title} đã được sử dụng.`);
      return;
    }
    super.applyEffect(player, gameManager);
    gameManager.logGameAction(`${player.name} sử dụng thẻ Nhân Vật: "${this.title}". ${this.powerDescription}`);
    // Logic cụ thể cho từng nhân vật
    // Ví dụ:
    // if (this.id === 'HC001_VUA_HUNG') {
    //   // Logic đặc biệt cho Vua Hùng - có thể cần check trong GameManager khi qua ô Lập Quốc
    // }
    this.isUsed = true;
    player.historicalCharacterCardInHand = null; // Bỏ thẻ sau khi dùng
    gameManager.emitPlayerUpdate(player);
    gameManager.emitGameLog(`[Nhân Vật] ${player.name} kích hoạt sức mạnh của ${this.title}.`);
    // Return true or some indicator if the effect was instant or needs further player interaction
  }
}

module.exports = HistoricalCharacterCard;