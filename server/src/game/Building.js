// server/src/game/Building.js
class Building {
    constructor({ type, level = 1, constructionCost, rentIncreaseFactor }) {
      this.type = type; // DEN, THANH, NHA, CHUA, KHU_QUAN_SU, LANG
      this.level = level;
      this.constructionCost = constructionCost;
      this.rentIncreaseFactor = rentIncreaseFactor; // Hoặc giá trị cụ thể
    }
  
    getUpgradeInfo() {
      // Trả về thông tin nâng cấp, ví dụ:
      // if (this.type === 'DEN' && this.level < 3) return { nextLevel: this.level + 1, cost: ... };
      // if (this.type === 'DEN' && this.level === 3) return { upgradeTo: 'CHUA', cost: ... };
      return null;
    }
  }
  module.exports = Building;