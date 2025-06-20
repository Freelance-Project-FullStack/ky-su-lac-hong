// client/src/gameObjects/BoardBuilder.js
import Phaser from 'phaser';
import { BOARD_LAYOUT, SQUARE_TYPES } from './BoardConfig';

export class BoardBuilder {
  constructor(scene) {
    this.scene = scene;
    this.boardSquares = [];
    this.squareSprites = {};
    this.boardConfig = null;
  }

  /**
   * Tạo bàn cờ hoàn chỉnh
   * @param {number} centerX - Tọa độ X trung tâm bàn cờ
   * @param {number} centerY - Tọa độ Y trung tâm bàn cờ
   * @param {number} boardSize - Kích thước bàn cờ
   */
  createBoard(centerX, centerY, boardSize) {
    // Lưu trữ cấu hình bàn cờ
    this.boardConfig = {
      centerX,
      centerY,
      width: boardSize,
      height: boardSize
    };

    // Vẽ nền bàn cờ
    this.createBoardBackground();

    // Vẽ các ô trên bàn cờ
    this.createBoardSquares();

    return {
      boardSquares: this.boardSquares,
      squareSprites: this.squareSprites,
      boardConfig: this.boardConfig
    };
  }

  /**
   * Tạo nền bàn cờ
   */
  createBoardBackground() {
    const { centerX, centerY, width, height } = this.boardConfig;

    try {
      // Sử dụng hình ảnh nền bàn cờ mới theo mẫu
      // Dùng 'mat_ban_co' làm hình nền chính
      this.boardImage = this.scene.add.image(centerX, centerY, 'mat_ban_co');
      this.boardImage.setDisplaySize(width, height);
      
      // Thêm hiệu ứng glow cho bàn cờ
      const glowFx = this.scene.add.graphics();
      glowFx.fillStyle(0xFFD700, 0.1); // Màu vàng nhạt
      glowFx.fillRect(
        centerX - width/2 - 10,
        centerY - height/2 - 10,
        width + 20,
        height + 20
      );
      glowFx.setBlendMode(Phaser.BlendModes.ADD);
      
      console.log('Đã tải hình ảnh bàn cờ thành công');
    } catch (error) {
      console.error('Không thể tải hình ảnh bàn cờ:', error);
      
      // Sử dụng hình chữ nhật màu nếu không tải được hình ảnh
      const boardBg = this.scene.add.rectangle(centerX, centerY, width, height, 0x8B4513);
      boardBg.setStrokeStyle(4, 0x4d2600);
      
      console.log('Sử dụng hình nền dự phòng cho bàn cờ');
    }
  }

  /**
   * Tạo các ô trên bàn cờ
   */
  createBoardSquares() {
    const { centerX, centerY, width, height } = this.boardConfig;
    this.boardSquares = [];
    this.squareSprites = {};

    // Tính kích thước ô và vị trí
    const squareSize = width * 0.11; // Tăng kích thước ô lên để vừa đủ 36 ô/vòng
    
    // Tạo các ô theo vị trí trên bàn cờ
    for (let i = 0; i < BOARD_LAYOUT.length; i++) {
      const squareConfig = BOARD_LAYOUT[i];
      
      // Tính vị trí của ô dựa trên thiết kế bàn cờ
      const pos = this.getSquarePosition(i, centerX, centerY, width, height);
      
      // Tính góc xoay dựa trên vị trí ô
      const angle = this.getSquareAngle(i);
      
      // Tạo ô cờ
      const square = this.createBoardSquare(squareConfig, pos.x, pos.y, squareSize, angle);
      
      // Lưu thông tin ô
      this.boardSquares.push({
        square,
        position: pos,
        info: squareConfig,
        index: i
      });
      
      // Lưu vào đối tượng squareSprites để truy cập dễ dàng
      this.squareSprites[`SQ${String(i).padStart(3, '0')}`] = square;
    }
    
    console.log(`Đã tạo ${this.boardSquares.length} ô trên bàn cờ`);
  }

  /**
   * Tạo một ô cờ hoàn chỉnh theo mẫu hình thang
   * @param {object} config - Dữ liệu của ô cờ từ mảng BOARD_LAYOUT
   * @param {number} x - Tọa độ x của ô
   * @param {number} y - Tọa độ y của ô
   * @param {number} squareSize - Kích thước ô
   * @param {number} angle - Góc xoay của ô (0, 90, 180, -90)
   */
  createBoardSquare(config, x, y, squareSize, angle = 0) {
    const { type, name, key } = config;
    
    // Tạo container chứa ô cờ
    const container = this.scene.add.container(x, y);
    
    // Tạo hình thang cho ô cờ
    const graphics = this.scene.add.graphics();
    
    // Màu sắc theo loại ô
    let fillColor = 0xFFFFFF;
    let borderColor = 0x000000;
    
    switch (type) {
      case 'land':
        fillColor = 0xE6D5AC; // Màu nâu nhạt cho ô đất
        borderColor = 0x8B4513; // Màu nâu đậm cho viền
        break;
      case 'water':
        fillColor = 0xADD8E6; // Màu xanh nhạt cho ô nước
        borderColor = 0x4682B4; // Màu xanh đậm cho viền
        break;
      case 'special':
        fillColor = 0xFFD700; // Màu vàng cho ô đặc biệt
        borderColor = 0xDAA520; // Màu vàng đậm cho viền
        break;
      case 'corner':
        fillColor = 0xDC143C; // Màu đỏ cho ô góc
        borderColor = 0x8B0000; // Màu đỏ đậm cho viền
        break;
    }
    
    // Vẽ hình thang
    const trapezoid = new Phaser.Geom.Polygon([
      new Phaser.Geom.Point(-squareSize/2, -squareSize/2),  // Điểm trái trên
      new Phaser.Geom.Point(squareSize/2, -squareSize/2),   // Điểm phải trên
      new Phaser.Geom.Point(squareSize/2.5, squareSize/2),  // Điểm phải dưới
      new Phaser.Geom.Point(-squareSize/2.5, squareSize/2)  // Điểm trái dướ
    ]);
    
    graphics.lineStyle(2, borderColor);
    graphics.fillStyle(fillColor, 1);
    graphics.fillPoints(trapezoid.points, true);
    graphics.strokePoints(trapezoid.points, true);
    
    container.add(graphics);
    
    // Thêm icon nếu có
    if (key && key !== '') {
      try {
        const icon = this.scene.add.image(0, -squareSize/4, key);
        icon.setDisplaySize(squareSize * 0.3, squareSize * 0.3);
        container.add(icon);
      } catch (error) {
        console.error(`Không thể tải icon cho ô ${name}:`, error);
      }
    }
    
    // Thêm tên ô
    const text = this.scene.add.text(0, squareSize/4, name, {
      fontFamily: 'Arial',
      fontSize: '12px',
      color: '#000000',
      align: 'center',
      wordWrap: { width: squareSize * 0.8 }
    });
    text.setOrigin(0.5, 0.5);
    container.add(text);
    
    // Xoay ô theo góc
    container.setAngle(angle);
    
    // Thêm hiệu ứng hover
    container.setInteractive(trapezoid, Phaser.Geom.Polygon.Contains);
    
    container.on('pointerover', () => {
      graphics.clear();
      graphics.lineStyle(3, 0xFF0000);
      graphics.fillStyle(fillColor, 1);
      graphics.fillPoints(trapezoid.points, true);
      graphics.strokePoints(trapezoid.points, true);
      this.showSquareTooltip(container, config);
    });
    
    container.on('pointerout', () => {
      graphics.clear();
      graphics.lineStyle(2, borderColor);
      graphics.fillStyle(fillColor, 1);
      graphics.fillPoints(trapezoid.points, true);
      graphics.strokePoints(trapezoid.points, true);
      this.hideSquareTooltip();
    });
    
    // Thêm sự kiện click
    graphics.on('pointerdown', () => {
      console.log(`Đã click vào ô ${config.name}`);
      
      // Hiệu ứng click
      this.scene.tweens.add({
        targets: container,
        scaleX: 0.95,
        scaleY: 0.95,
        duration: 50,
        yoyo: true,
        ease: 'Power1'
      });
      
      // Xử lý logic khi click vào ô
      // Phát âm thanh click nếu có
      if (this.scene.sound && this.scene.sound.add) {
        const clickSound = this.scene.sound.add('click_sound', { volume: 0.5 });
        clickSound.play();
      }
    });

    return container;
  }

  /**
   * Tính vị trí của ô dựa trên index
   * @param {number} index - Vị trí của ô trong mảng BOARD_LAYOUT
   * @param {number} centerX - Tọa độ X của tâm bàn cờ
   * @param {number} centerY - Tọa độ Y của tâm bàn cờ
   * @param {number} width - Chiều rộng bàn cờ
   * @param {number} height - Chiều cao bàn cờ
   */
  getSquarePosition(index, centerX, centerY, width, height) {
    const squaresPerSide = 9; // 9 ô mỗi cạnh
    const side = Math.floor(index / squaresPerSide); // Xác định cạnh (0: dưới, 1: phải, 2: trên, 3: trái)
    const posInSide = index % squaresPerSide; // Vị trí trong cạnh (0-8)
    
    // Tính toán kích thước và offset
    const boardScale = 0.85; // Tăng tỷ lệ kích thước bàn cờ
    const boardSize = Math.min(width, height) * boardScale;
    const baseOffset = boardSize / 2;
    
    // Tính bước nhảy giữa các ô
    const step = boardSize / (squaresPerSide + 1); // +1 để có khoảng cách hợp lý
    
    // Điều chỉnh offset cho từng cạnh
    const horizontalOffset = baseOffset * 0.95; // Giảm offset ngang để bàn cờ hẹp hơn
    const verticalOffset = baseOffset * 0.95; // Giảm offset dọc để bàn cờ hẹp hơn
    
    // Tính toán vị trí cơ bản
    let x = centerX;
    let y = centerY;
    
    // Điều chỉnh vị trí dựa trên cạnh
    switch (side) {
      case 0: // Cạnh dưới (trái sang phải)
        x = centerX - horizontalOffset + (posInSide + 0.5) * step;
        y = centerY + verticalOffset;
        break;
      case 1: // Cạnh phải (dưới lên trên)
        x = centerX + horizontalOffset;
        y = centerY + verticalOffset - (posInSide + 0.5) * step;
        break;
      case 2: // Cạnh trên (phải sang trái)
        x = centerX + horizontalOffset - (posInSide + 0.5) * step;
        y = centerY - verticalOffset;
        break;
      case 3: // Cạnh trái (trên xuống dưới)
        x = centerX - horizontalOffset;
        y = centerY - verticalOffset + (posInSide + 0.5) * step;
        break;
    }
    
    // Điều chỉnh vị trí cho các ô góc
    const config = BOARD_LAYOUT[index];
    if (config.type === 'corner') {
      const cornerOffset = step * 0.2; // Giảm offset góc để các ô góc không bị lệch quá
      switch (config.name) {
        case 'Lập Quốc': // Góc dưới phải
          x += cornerOffset;
          y -= cornerOffset;
          break;
        case 'Ngựa Ô': // Góc phải trên
          x -= cornerOffset;
          y -= cornerOffset;
          break;
        case 'Lễ hội\nTruyền thống': // Góc trên trái
          x -= cornerOffset;
          y += cornerOffset;
          break;
        case 'Nhà Tù': // Góc trái dưới
          x += cornerOffset;
          y += cornerOffset;
          break;
      }
    }
    
    return { x, y };
  }

  /**
   * Tính góc xoay của ô dựa trên index
   * @param {number} index - Vị trí của ô trong mảng BOARD_LAYOUT
   */
  getSquareAngle(index) {
    const squaresPerSide = 9; // 9 ô mỗi cạnh
    const side = Math.floor(index / squaresPerSide);
    const config = BOARD_LAYOUT[index];
    
    // Góc xoay mặc định theo cạnh
    let angle = 0;
    switch (side) {
      case 0: // Hàng dưới
        angle = 0;
        break;
      case 1: // Cột phải
        angle = 90;
        break;
      case 2: // Hàng trên
        angle = 180;
        break;
      case 3: // Cột trái
        angle = -90;
        break;
    }
    
    // Điều chỉnh góc xoay cho các ô đặc biệt
    if (config.type === 'corner') {
      switch (config.name) {
        case 'Lập Quốc':
          angle = 0; // Góc dưới phải
          break;
        case 'Ngựa Ô':
          angle = 90; // Góc phải trên
          break;
        case 'Lễ hội\nTruyền thống':
          angle = 180; // Góc trên trái
          break;
        case 'Nhà Tù':
          angle = -90; // Góc trái dưới
          break;
      }
    } else if (config.type === 'special') {
      // Các ô đặc biệt luôn hướng vào trong
      switch (side) {
        case 0: // Hàng dưới
          angle = 0;
          break;
        case 1: // Cột phải
          angle = 90;
          break;
        case 2: // Hàng trên
          angle = 180;
          break;
        case 3: // Cột trái
          angle = -90;
          break;
      }
    }
    
    return angle;
  }
  
  /**
   * Hiển thị tooltip với thông tin chi tiết về ô
   * @param {Phaser.GameObjects.Container} container - Container chứa ô
   * @param {object} config - Cấu hình của ô
   */
  showSquareTooltip(container, config) {
    // Xóa tooltip cũ nếu có
    this.hideSquareTooltip();
    
    // Tính toán kích thước và vị trí tooltip
    const tooltipWidth = 180;
    const tooltipHeight = 100;
    const tooltipX = container.x;
    const tooltipY = container.y - 70;
    
    // Tạo container cho tooltip
    const tooltipContainer = this.scene.add.container(tooltipX, tooltipY);
    
    // Tạo nền tooltip với hiệu ứng gradient
    const tooltipBg = this.scene.add.graphics();
    tooltipBg.lineStyle(2, 0xFFD700, 1); // Viền vàng
    tooltipBg.fillStyle(0x000000, 0.9);
    tooltipBg.fillRoundedRect(-tooltipWidth/2, -tooltipHeight/2, tooltipWidth, tooltipHeight, 8);
    tooltipBg.strokeRoundedRect(-tooltipWidth/2, -tooltipHeight/2, tooltipWidth, tooltipHeight, 8);
    
    // Thêm hiệu ứng bóng mờ
    const shadow = this.scene.add.graphics();
    shadow.fillStyle(0x000000, 0.3);
    shadow.fillRoundedRect(-tooltipWidth/2 + 2, -tooltipHeight/2 + 2, tooltipWidth, tooltipHeight, 8);
    
    // Tạo nội dung tooltip
    const titleStyle = {
      fontFamily: 'Arial',
      fontSize: '16px',
      color: '#FFD700',
      align: 'center',
      fontStyle: 'bold'
    };
    
    const contentStyle = {
      fontFamily: 'Arial',
      fontSize: '14px',
      color: '#FFFFFF',
      align: 'center'
    };
    
    // Tiêu đề
    const title = this.scene.add.text(0, -tooltipHeight/2 + 15, config.name, titleStyle);
    title.setOrigin(0.5);
    
    // Loại ô
    const type = this.scene.add.text(0, -5, `Loại: ${this.getSquareTypeName(config.type)}`, contentStyle);
    type.setOrigin(0.5);
    
    // Thông tin chi tiết
    let detail = '';
    switch (config.type) {
      case 'land':
        detail = 'Giá: 100 xu\nCó thể xây dựng';
        break;
      case 'water':
        detail = 'Không thể xây dựng\nPhải trả phí qua lại';
        break;
      case 'special':
        detail = 'Sự kiện đặc biệt\nCó thể nhận thưởng hoặc phạt';
        break;
      case 'corner':
        detail = 'Góc đặc biệt\nCó hiệu ứng riêng';
        break;
    }
    
    const details = this.scene.add.text(0, 20, detail, contentStyle);
    details.setOrigin(0.5);
    
    // Thêm các phần tử vào container
    tooltipContainer.add([shadow, tooltipBg, title, type, details]);
    
    // Lưu trữ tooltip để có thể xóa sau này
    this.currentTooltip = tooltipContainer;
  }
  
  /**
   * Ẩn tooltip
   */
  hideSquareTooltip() {
    if (this.currentTooltip) {
      // Thêm hiệu ứng fade out trước khi xóa
      this.scene.tweens.add({
        targets: this.currentTooltip,
        alpha: 0,
        duration: 150,
        ease: 'Power2',
        onComplete: () => {
          this.currentTooltip.destroy();
          this.currentTooltip = null;
        }
      });
    }
  }
  
  /**
   * Chuyển đổi loại ô sang tên hiển thị
   * @param {string} type - Loại ô (land, water, special, corner)
   * @returns {string} Tên hiển thị của loại ô
   */
  getSquareTypeName(type) {
    switch (type) {
      case 'land': return 'Đất';
      case 'water': return 'Nước';
      case 'special': return 'Đặc biệt';
      case 'corner': return 'Góc';
      default: return type;
    }
  }
}
