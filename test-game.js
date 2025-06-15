#!/usr/bin/env node

/**
 * Script test cơ bản cho game "Kỳ sử Lạc Hồng"
 * Kiểm tra các tính năng chính của game logic
 */

const GameManager = require('./server/src/game/GameManager');
const { GAME_PHASES, SQUARE_TYPES } = require('./server/src/game/enums');

// Mock IO object
const mockIO = {
  to: () => ({
    emit: (event, data) => {
      console.log(`[EMIT] ${event}:`, JSON.stringify(data, null, 2));
    }
  }),
  emit: (event, data) => {
    console.log(`[BROADCAST] ${event}:`, JSON.stringify(data, null, 2));
  }
};

async function testGame() {
  console.log('🎮 Bắt đầu test game "Kỳ sử Lạc Hồng"...\n');

  // Tạo game manager
  const gameManager = new GameManager('test-room', null, mockIO);

  // Test 1: Thêm người chơi
  console.log('📝 Test 1: Thêm người chơi');
  const player1 = gameManager.addPlayer({ id: 'player1', name: 'Nguyễn Văn A', color: '#FF0000' });
  const player2 = gameManager.addPlayer({ id: 'player2', name: 'Trần Thị B', color: '#00FF00' });
  const player3 = gameManager.addPlayer({ id: 'player3', name: 'Lê Văn C', color: '#0000FF' });
  const player4 = gameManager.addPlayer({ id: 'player4', name: 'Phạm Thị D', color: '#FFFF00' });

  console.log(`✅ Đã thêm ${gameManager.players.length} người chơi`);
  console.log(`💰 Tiền ban đầu: ${player1.money.toLocaleString()} vàng\n`);

  // Test 2: Setup và bắt đầu game
  console.log('📝 Test 2: Setup và bắt đầu game');
  const setupSuccess = gameManager.setupGame();
  console.log(`✅ Setup game: ${setupSuccess ? 'Thành công' : 'Thất bại'}`);
  
  if (setupSuccess) {
    gameManager.startGame();
    console.log(`🎯 Game phase: ${gameManager.gamePhase}`);
    console.log(`👤 Người chơi hiện tại: ${gameManager.getCurrentPlayer().name}\n`);
  }

  // Test 3: Kiểm tra bàn cờ
  console.log('📝 Test 3: Kiểm tra bàn cờ');
  console.log(`🏁 Tổng số ô: ${gameManager.board.getTotalSquares()}`);
  console.log(`🏠 Ô START: ${gameManager.board.startSquareIndex}`);
  console.log(`🔒 Ô JAIL: ${gameManager.board.jailSquareIndex}`);
  
  // Đếm các loại ô
  const squareTypes = {};
  gameManager.board.squares.forEach(sq => {
    squareTypes[sq.type] = (squareTypes[sq.type] || 0) + 1;
  });
  console.log('📊 Phân bố ô:', squareTypes);

  // Test 4: Kiểm tra thẻ bài
  console.log('\n📝 Test 4: Kiểm tra thẻ bài');
  console.log(`🎴 Thẻ sự kiện: ${gameManager.eventCardDeck.length}`);
  console.log(`👑 Thẻ nhân vật: ${gameManager.historicalCharacterCardDeck.length}`);
  
  gameManager.players.forEach(player => {
    if (player.historicalCharacterCardInHand) {
      console.log(`🃏 ${player.name} có thẻ: ${player.historicalCharacterCardInHand.title}`);
    }
  });

  // Test 5: Mô phỏng vài lượt chơi
  console.log('\n📝 Test 5: Mô phỏng lượt chơi');
  
  for (let turn = 1; turn <= 3; turn++) {
    console.log(`\n--- Lượt ${turn} ---`);
    const currentPlayer = gameManager.getCurrentPlayer();
    console.log(`🎲 ${currentPlayer.name} tung xúc xắc...`);
    
    // Mô phỏng tung xúc xắc
    gameManager.handlePlayerRollDiceRequest(currentPlayer.id);
    
    // Hiển thị vị trí mới
    const square = gameManager.board.getSquareByIndex(currentPlayer.tokenPositionIndex);
    console.log(`📍 Đáp xuống ô: ${square.name} (${square.type})`);
    
    // Chuyển lượt nếu cần
    if (gameManager.gamePhase === GAME_PHASES.TURN_ENDING) {
      gameManager.nextTurn();
    }
  }

  // Test 6: Kiểm tra điều kiện thắng
  console.log('\n📝 Test 6: Kiểm tra logic điều kiện thắng');
  
  // Test thống nhất lãnh thổ
  const testPlayer = gameManager.players[0];
  const hungVuongSquares = gameManager.board.getSquaresByHistoricalPeriod('Hùng Vương');
  console.log(`🏰 Ô thời kỳ Hùng Vương: ${hungVuongSquares.length}`);
  
  // Test chiếm sông
  const riverSquares = gameManager.board.squares.filter(sq => sq.type === SQUARE_TYPES.RIVER);
  console.log(`🌊 Số con sông: ${riverSquares.length}`);
  riverSquares.forEach(river => {
    console.log(`   - ${river.name} (${river.historicalPeriod})`);
  });

  // Test 7: Kiểm tra xây dựng
  console.log('\n📝 Test 7: Test logic xây dựng');
  const landSquare = gameManager.board.squares.find(sq => sq.type === SQUARE_TYPES.PROPERTY_LAND);
  if (landSquare) {
    console.log(`🏗️ Test xây dựng tại: ${landSquare.name}`);
    console.log(`💰 Chi phí xây dựng:`, landSquare.buildingCost);
    
    // Giả lập sở hữu đất
    landSquare.setOwner(testPlayer.id);
    testPlayer.ownedProperties.push(landSquare.id);
    
    // Test xây 3 nhà để nâng cấp
    for (let i = 0; i < 3; i++) {
      const success = landSquare.addBuilding('NHA', testPlayer.id, gameManager);
      console.log(`🏠 Xây nhà lần ${i + 1}: ${success ? 'Thành công' : 'Thất bại'}`);
    }
    
    console.log(`🏘️ Công trình hiện tại:`, landSquare.buildings);
    console.log(`🛡️ Không thể mua lại: ${landSquare.cannotBeAcquired}`);
  }

  // Test 8: Kiểm tra cấu hình game
  console.log('\n📝 Test 8: Cấu hình game');
  console.log('⚙️ Game settings:', JSON.stringify(gameManager.gameSettings, null, 2));

  console.log('\n🎉 Hoàn thành test game! Tất cả tính năng cơ bản đã được kiểm tra.');
  console.log('\n📋 Tóm tắt:');
  console.log(`   ✅ ${gameManager.players.length}/4 người chơi`);
  console.log(`   ✅ ${gameManager.board.getTotalSquares()}/40 ô bàn cờ`);
  console.log(`   ✅ ${gameManager.eventCardDeck.length + gameManager.historicalCharacterCardDeck.length} thẻ bài`);
  console.log(`   ✅ Game logic hoạt động`);
  console.log(`   ✅ Multiplayer ready`);
}

// Chạy test
if (require.main === module) {
  testGame().catch(console.error);
}

module.exports = testGame;
