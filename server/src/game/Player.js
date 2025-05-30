// server/src/game/Player.js
const { v4: uuidv4 } = require('uuid');

class Player {
  constructor({ id, name, color, gameSettings }) {
    this.id = id; // Socket ID hoặc ID người dùng
    this.name = name;
    this.color = color;
    this.tokenPositionIndex = 0; // Sẽ được đặt bởi GameManager khi setup
    this.money = gameSettings.startingMoney;
    this.ownedProperties = []; // Mảng các ID của Square
    this.historicalCharacterCardInHand = null; // Đối tượng HistoricalCharacterCard
    this.isInJail = false;
    this.jailTurnsRemaining = 0;
    this.consecutiveDoublesCount = 0;
    this.hasRolledDiceThisTurn = false;
    this.alliancePartnerId = null;
    this.allianceTurnsLeft = 0;
    this.monopolySets = []; // Mảng các historicalPeriod mà người chơi độc quyền
    this.getOutOfJailFreeCards = 0;
  }

  updatePosition(newSquareIndex) {
    this.tokenPositionIndex = newSquareIndex;
  }

  addMoney(amount) {
    this.money += amount;
  }

  subtractMoney(amount) {
    this.money -= amount;
    if (this.money < 0) {
      // Xử lý phá sản sẽ phức tạp hơn, có thể cần GameManager can thiệp
      // gameManager.handleBankruptcy(this);
      return false; // Cho biết không đủ tiền
    }
    return true;
  }

  canAfford(amount) {
    return this.money >= amount;
  }

  purchaseProperty(square) {
    if (this.canAfford(square.purchasePrice) && square.canBePurchased && !square.isOwned()) {
      this.subtractMoney(square.purchasePrice);
      square.setOwner(this.id);
      this.ownedProperties.push(square.id);
      // TODO: Kiểm tra và cập nhật monopolySets
      return true;
    }
    return false;
  }

  payRentOrTax(amount, recipientPlayerOrBank, gameManager) {
    if (!this.canAfford(amount)) {
      // Xử lý logic không đủ tiền (ví dụ: bán tài sản, cầm cố, phá sản)
      gameManager.handlePlayerInDebt(this, recipientPlayerOrBank, amount);
      return false;
    }
    this.subtractMoney(amount);
    if (recipientPlayerOrBank !== 'bank' && recipientPlayerOrBank) { // recipientPlayerOrBank là một đối tượng Player
      recipientPlayerOrBank.addMoney(amount);
      gameManager.emitPlayerUpdate(recipientPlayerOrBank);
    }
    gameManager.emitPlayerUpdate(this);
    return true;
  }

  buildOnProperty(square, buildingType, gameManager) {
    if (square.ownerId === this.id && square.canBuildHere) {
      return square.addBuilding(buildingType, this.id, gameManager); // Sẽ trừ tiền trong addBuilding
    }
    return false;
  }

  useHistoricalCard(gameManager) {
    if (this.historicalCharacterCardInHand) {
      const card = this.historicalCharacterCardInHand;
      // Kiểm tra activationCondition nếu cần
      // Ví dụ: if (card.activationCondition === 'ANY_TIME' || (condition for specific phase))
      card.applyEffect(this, gameManager); // Thẻ sẽ tự đánh dấu isUsed và loại bỏ khỏi tay người chơi
      // historicalCharacterCardInHand sẽ được đặt là null trong applyEffect của thẻ
      return true;
    }
    return false;
  }

  attemptToGetOutOfJail(method, gameManager) { // method: 'PAY_FINE', 'USE_CARD', 'ROLL_DOUBLES'
    if (!this.isInJail) return true; // Đã ở ngoài rồi

    switch (method) {
      case 'PAY_FINE':
        if (this.canAfford(gameManager.gameSettings.jailFine)) {
          this.subtractMoney(gameManager.gameSettings.jailFine);
          this.releaseFromJail(gameManager, "đã nộp phạt");
          return true;
        }
        gameManager.emitGameLogToPlayer(this.id, "Không đủ Vàng để nộp phạt.");
        return false;
      case 'USE_CARD':
        if (this.getOutOfJailFreeCards > 0) {
          this.getOutOfJailFreeCards--;
          this.releaseFromJail(gameManager, "đã dùng thẻ Miễn Phí Ra Tù");
          return true;
        }
        gameManager.emitGameLogToPlayer(this.id, "Không có thẻ Miễn Phí Ra Tù.");
        return false;
      case 'ROLL_DOUBLES':
        const diceRoll = gameManager.rollDiceForJailAttempt(this.id); // GameManager sẽ tung xúc xắc
        if (diceRoll.isDouble) {
          this.releaseFromJail(gameManager, `đã tung được ${diceRoll.values[0]}-${diceRoll.values[1]}`);
          // Người chơi được di chuyển theo kết quả tung đó
          gameManager.movePlayerToken(this, diceRoll.total, false); // false: không nhận tiền qua START khi ra tù bằng roll
          gameManager.handlePlayerLandingOnSquare(this, gameManager.board.getSquareByIndex(this.tokenPositionIndex));
          return true;
        } else {
          this.jailTurnsRemaining--;
          gameManager.emitGameLog(`${this.name} không tung được xúc xắc đôi. Còn ${this.jailTurnsRemaining} lượt trong tù.`);
          if (this.jailTurnsRemaining <= 0) {
            gameManager.emitGameLogToPlayer(this.id, "Hết lượt thử, phải nộp phạt (nếu có thể) hoặc dùng thẻ.");
            // Server có thể tự động thử nộp phạt nếu người chơi không tự làm
            if (!this.attemptToGetOutOfJail('PAY_FINE', gameManager)) {
                 if(!this.attemptToGetOutOfJail('USE_CARD', gameManager)){
                    // Vẫn trong tù nếu không thể làm gì khác
                    gameManager.emitGameLog(`${this.name} không thể ra tù và bỏ lỡ lượt này.`);
                 }
            }
          }
          // Nếu không ra tù, lượt chơi kết thúc
          gameManager.endPlayerTurnActions(); // Hàm này sẽ chuyển lượt
          return false;
        }
    }
  }

  releaseFromJail(gameManager, reason) {
    this.isInJail = false;
    this.jailTurnsRemaining = 0;
    this.consecutiveDoublesCount = 0; // Reset khi ra tù
    gameManager.emitGameLog(`${this.name} đã ra tù ${reason}.`);
    gameManager.emitPlayerUpdate(this);
  }

  declareBankruptcy(gameManager) {
    gameManager.logGameAction(`${this.name} đã phá sản!`);
    // Logic phức tạp: bán hết tài sản cho ngân hàng hoặc người gây nợ
    // Loại người chơi khỏi game
    // ...
    gameManager.removePlayer(this.id); // Ví dụ
  }

  addGetOutOfJailFreeCard() {
    this.getOutOfJailFreeCards++;
  }

  // ... các hành vi khác: sellProperty, mortgageProperty, checkMonopoly ...
  // Ví dụ kiểm tra độc quyền:
  checkAndAddMonopoly(periodName, gameManager) {
      const periodSquares = gameManager.board.getSquaresByHistoricalPeriod(periodName);
      if (periodSquares.length === 0) return;

      const allOwnedByPlayer = periodSquares.every(sq => this.ownedProperties.includes(sq.id));

      if (allOwnedByPlayer && !this.monopolySets.includes(periodName)) {
          this.monopolySets.push(periodName);
          gameManager.logGameAction(`${this.name} đã đạt độc quyền thời kỳ ${periodName}!`);
          // Có thể có hiệu ứng thưởng thêm
      }
  }
}

module.exports = Player;