// server/src/game/Square.js
const { SQUARE_TYPES } = require('./enums'); // Giả sử có file enums

class Square {
  constructor({
    id, name, type, purchasePrice = 0, baseRent = 0, rentByBuildingLevel = [],
    historicalPeriod = null, canBePurchased = false, canBuildHere = false,
    buildingCost = {}, // VD: { NHA: 5000, DEN: 8000 }
    visualAsset = null
  }) {
    this.id = id;
    this.name = name;
    this.type = type; // PROPERTY_LAND, EVENT_CHANCE, TAX_PAYMENT, etc.
    this.ownerId = null;
    this.buildings = []; // Mảng các đối tượng Building, hoặc số lượng { NHA: 2, DEN: 1 }
    this.purchasePrice = purchasePrice;
    this.baseRent = baseRent; // Tiền thuê đất trống
    this.rentByBuildingLevel = rentByBuildingLevel; // Mảng tiền thuê theo số nhà/cấp công trình
    this.currentTaxAmount = 0; // Có thể thay đổi bởi Lễ Hội, Độc Quyền
    this.historicalPeriod = historicalPeriod;
    this.canBePurchased = canBePurchased;
    this.canBuildHere = canBuildHere;
    this.visualAsset = visualAsset; // Tham chiếu hình ảnh/sprite

    this.buildingCost = buildingCost; // Chi phí xây từng loại nhà ban đầu
    this.isMortgaged = false;
  }

  calculateCurrentRent(visitingPlayer, gameManager) {
    if (!this.isOwned() || this.ownerId === visitingPlayer.id || this.isMortgaged) {
      return 0;
    }

    let rent = this.baseRent;
    // Logic tính tiền thuê dựa trên số lượng/loại công trình
    // Ví dụ đơn giản: đếm số nhà (type 'NHA')
    const housesCount = this.buildings.filter(b => b.type === 'NHA').length; // Giả sử building là mảng object
    if (housesCount > 0 && housesCount <= this.rentByBuildingLevel.length) {
      rent = this.rentByBuildingLevel[housesCount - 1];
    }
    // TODO: Xử lý độc quyền (tăng gấp đôi tiền thuê đất trống)
    // const owner = gameManager.getPlayerById(this.ownerId);
    // if (owner && owner.hasMonopoly(this.historicalPeriod)) { rent *= 2; }

    // TODO: Xử lý Lễ Hội (tăng thuế/thuê)
    if (this.currentTaxAmount > this.baseRent) { // Dấu hiệu có Lễ Hội
        rent = this.currentTaxAmount;
    }

    return rent;
  }

  isOwned() {
    return this.ownerId !== null;
  }

  setOwner(playerId) {
    this.ownerId = playerId;
  }

  addBuilding(buildingType, playerId, gameManager) {
    if (this.ownerId !== playerId || !this.canBuildHere) {
      // gameManager.emitErrorToPlayer(playerId, "Không thể xây dựng ở đây hoặc bạn không sở hữu ô này.");
      return false;
    }

    // Kiểm tra số lượng công trình hiện tại (ví dụ tối đa 3 nhà -> Làng)
    const existingBuildingsOfType = this.buildings.filter(b => b.type === buildingType).length;

    // TODO: Logic nâng cấp (3 Đền -> Chùa, etc.)
    // if (existingBuildingsOfType >= 3 && buildingType === BUILDING_TYPES.NHA) { /* nâng cấp lên Làng */ }

    // Tạm thời chỉ thêm
    const cost = this.buildingCost[buildingType]; // Lấy chi phí từ định nghĩa ô đất
    if (!cost) {
        gameManager.emitGameLogToPlayer(playerId, `Loại công trình ${buildingType} không xác định chi phí.`);
        return false;
    }

    const player = gameManager.getPlayerById(playerId);
    if (player.canAfford(cost)) {
      player.subtractMoney(cost);
      this.buildings.push({ type: buildingType, level: 1 }); // Cần class Building đầy đủ hơn
      gameManager.logGameAction(`${player.name} xây ${buildingType} tại ${this.name}.`);
      gameManager.emitPlayerUpdate(player);
      gameManager.emitSquareUpdate(this);
      return true;
    } else {
      gameManager.emitGameLogToPlayer(playerId, `Không đủ Vàng để xây ${buildingType}.`);
      return false;
    }
  }

  // Hàm này sẽ được gọi bởi GameManager khi người chơi đáp xuống ô
  performLandingAction(player, gameManager) {
    gameManager.logGameAction(`${player.name} đáp xuống ô ${this.name}.`);

    switch (this.type) {
      case SQUARE_TYPES.PROPERTY_LAND:
        if (this.isOwned()) {
          if (this.ownerId !== player.id && !this.isMortgaged) {
            const rent = this.calculateCurrentRent(player, gameManager);
            if (rent > 0) {
              gameManager.requestPlayerPayment(player.id, this.ownerId, rent, "Tiền thuê đất");
            }
          } else if (this.ownerId === player.id) {
            // Cho phép xây dựng nếu là đất của mình
             gameManager.promptPlayerAction(player.id, 'LAND_ACTION_BUILD', { squareId: this.id, costs: this.buildingCost });
          }
        } else if (this.canBePurchased) {
          // Đất trống, có thể mua
          gameManager.promptPlayerAction(player.id, 'LAND_ACTION_BUY', { squareId: this.id, price: this.purchasePrice });
        }
        break;
      case SQUARE_TYPES.EVENT_CHANCE:
      case SQUARE_TYPES.EVENT_FATE:
        const card = gameManager.playerDrawsEventCard(player, this.type);
        if (card) {
          gameManager.applyEventCardEffect(player, card);
        }
        break;
      case SQUARE_TYPES.TAX_PAYMENT:
        const taxAmount = this.baseRent; // Giả sử baseRent của ô thuế là số tiền thuế
        gameManager.requestPlayerPayment(player.id, 'bank', taxAmount, "Thuế thu nhập");
        break;
      case SQUARE_TYPES.GO_TO_JAIL:
        gameManager.sendPlayerToJail(player);
        break;
      case SQUARE_TYPES.JAIL:
        if (player.isInJail) {
          gameManager.emitGameLog(`${player.name} đang "thăm tù".`);
        } else {
          gameManager.emitGameLog(`${player.name} ở ô "Giam Cầm" nhưng không bị bắt.`);
        }
        break;
      case SQUARE_TYPES.START:
        // Thường tiền qua START được xử lý khi di chuyển, không phải khi đáp chính xác
        gameManager.emitGameLog(`${player.name} ở ô LẬP QUỐC.`);
        break;
      case SQUARE_TYPES.FREE_PARKING:
        gameManager.emitGameLog(`${player.name} an toàn tại ${this.name}.`);
        break;
      case SQUARE_TYPES.SPECIAL_ACTION_HORSE: // Ngựa Ô
        gameManager.promptPlayerAction(player.id, 'SPECIAL_ACTION_HORSE_CHOOSE_DESTINATION', { currentSquareId: this.id });
        break;
      case SQUARE_TYPES.SPECIAL_ACTION_FESTIVAL: // Lễ Hội
        const ownedDistricts = player.ownedProperties.map(sqId => gameManager.board.getSquareById(sqId))
                                .filter(sq => sq && sq.historicalPeriod && sq.canBuildHere); // Chỉ các vùng đất có thể tổ chức
        if (ownedDistricts.length > 0) {
            gameManager.promptPlayerAction(player.id, 'SPECIAL_ACTION_FESTIVAL_CHOOSE_DISTRICT', { availableDistricts: ownedDistricts.map(sq=>({id: sq.id, name: sq.name})) });
        } else {
            gameManager.emitGameLog(`${player.name} không có vùng đất nào để tổ chức Lễ Hội.`);
            gameManager.setGamePhase(GAME_PHASES.TURN_ENDING); // Chuyển sang kết thúc lượt nếu không có hành động
        }
        break;
      default:
        // Không có hành động đặc biệt, có thể chuyển sang kết thúc lượt
        gameManager.setGamePhase(GAME_PHASES.TURN_ENDING);
    }
  }
  mortgage(player, gameManager) {
    if (this.ownerId !== player.id || this.isMortgaged || this.buildings.length > 0) {
      gameManager.emitGameLogToPlayer(player.id, "Không thể cầm cố ô này (phải bán hết công trình trước, hoặc đã cầm cố).", "error");
      return false;
    }
    const mortgageValue = this.purchasePrice / 2;
    player.addMoney(mortgageValue);
    this.isMortgaged = true;
    gameManager.logGameAction(`${player.name} đã cầm cố ${this.name} và nhận ${mortgageValue} Vàng.`);
    gameManager.emitPlayerUpdate(player);
    gameManager.emitSquareUpdate(this);
    return true;
  }

  unmortgage(player, gameManager) {
    if (this.ownerId !== player.id || !this.isMortgaged) {
      gameManager.emitGameLogToPlayer(player.id, "Không thể chuộc lại ô này.", "error");
      return false;
    }
    const unmortgageCost = Math.floor((this.purchasePrice / 2) * 1.1); // Giá chuộc = giá cầm cố + 10% lãi
    if (!player.canAfford(unmortgageCost)) {
      gameManager.emitGameLogToPlayer(player.id, `Không đủ ${unmortgageCost} Vàng để chuộc lại.`, "warning");
      return false;
    }
    player.subtractMoney(unmortgageCost);
    this.isMortgaged = false;
    gameManager.logGameAction(`${player.name} đã chuộc lại ${this.name} với giá ${unmortgageCost} Vàng.`);
    gameManager.emitPlayerUpdate(player);
    gameManager.emitSquareUpdate(this);
    return true;
  }

  sellBuilding(player, buildingType, gameManager) {
    if (this.ownerId !== player.id) return false;
    const buildingIndex = this.buildings.findIndex(b => b.type === buildingType);
    if (buildingIndex === -1) {
        gameManager.emitGameLogToPlayer(player.id, `Không có ${buildingType} để bán tại ${this.name}.`, "warning");
        return false;
    }
    // Giả sử giá bán lại = 1/2 giá xây
    const buildingOriginalCost = this.buildingCost[buildingType] || 0;
    const sellValue = buildingOriginalCost / 2;

    this.buildings.splice(buildingIndex, 1);
    player.addMoney(sellValue);
    gameManager.logGameAction(`${player.name} đã bán một ${buildingType} tại ${this.name} và nhận ${sellValue} Vàng.`);
    gameManager.emitPlayerUpdate(player);
    gameManager.emitSquareUpdate(this);
    return true;
  }
}

module.exports = Square;