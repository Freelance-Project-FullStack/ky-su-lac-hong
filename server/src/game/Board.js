// server/src/game/Board.js
const Square = require('./Square');
const rawSquaresData = require('../data/squares.json'); // Load dữ liệu bàn cờ

class Board {
  constructor() {
    this.squares = rawSquaresData.map(sqData => new Square(sqData));
    this.startSquareIndex = this.squares.findIndex(sq => sq.type === 'START');
    this.jailSquareIndex = this.squares.findIndex(sq => sq.type === 'JAIL');
    // if (this.startSquareIndex === -1) {
    //     throw new Error("Không tìm thấy ô START trên bàn cờ!");
    // }
    // if (this.jailSquareIndex === -1) {
    //     throw new Error("Không tìm thấy ô JAIL trên bàn cờ!");
    // }
  }

  getSquareByIndex(index) {
    return this.squares[index % this.squares.length]; // Xử lý vòng lặp
  }

  getSquareById(id) {
    return this.squares.find(sq => sq.id === id);
  }

  getSquareByName(name) {
    return this.squares.find(sq => sq.name === name);
  }

  getSquaresByHistoricalPeriod(periodName) {
    return this.squares.filter(sq => sq.historicalPeriod === periodName && sq.type === 'PROPERTY_LAND');
  }

  getTotalSquares() {
    return this.squares.length;
  }
}

module.exports = Board;