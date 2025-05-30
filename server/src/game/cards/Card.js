// server/src/game/cards/Card.js
const { v4: uuidv4 } = require('uuid');

class Card {
  constructor({ id, title, descriptionText, cardType, imageAsset = null }) {
    this.id = id || uuidv4();
    this.title = title;
    this.descriptionText = descriptionText;
    this.cardType = cardType; // EVENT_OPPORTUNITY, EVENT_FATE, HISTORICAL_CHARACTER
    this.imageAsset = imageAsset;
  }

  // Phương thức này sẽ được ghi đè bởi các lớp con
  applyEffect(player, gameManager) {
    console.log(`Applying effect of card: ${this.title} for player ${player.name}`);
    // Logic cụ thể sẽ ở lớp con
    // Ví dụ: gameManager.logGameAction(`${player.name} used card ${this.title}`);
  }
}

module.exports = Card;