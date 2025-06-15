import Phaser from 'phaser';

export default class PreloadScene extends Phaser.Scene {
  constructor() {
    super('PreloadScene');
  }

  preload() {
    console.log('PreloadScene: preload started');

    // Tạo background
    const { width, height } = this.cameras.main;
    const bg = this.add.rectangle(width/2, height/2, width, height, 0x1a1a2e);
    bg.setDepth(-1);

    // Add title
    this.add.text(width/2, height/2 - 100, 'Kỳ Sử Lạc Hồng', {
      fontSize: '36px',
      color: '#ffd700',
      fontFamily: 'Arial, sans-serif',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    // Tạo thanh tiến trình loading
    const progressBar = this.add.graphics();
    const progressBox = this.add.graphics();
    progressBox.fillStyle(0x222222, 0.8);
    progressBox.fillRect(width/2 - 160, height/2, 320, 50);

    // Add border to progress box
    progressBox.lineStyle(2, 0x444444);
    progressBox.strokeRect(width/2 - 160, height/2, 320, 50);

    const loadingText = this.make.text({
      x: width/2,
      y: height/2 - 50,
      text: 'Đang tải tài nguyên...',
      style: {
        font: '20px Arial, sans-serif',
        fill: '#ffffff'
      }
    }).setOrigin(0.5, 0.5);

    const percentText = this.make.text({
      x: width/2,
      y: height/2 + 25,
      text: '0%',
      style: {
        font: '18px Arial, sans-serif',
        fill: '#ffffff'
      }
    }).setOrigin(0.5, 0.5);

    // Lắng nghe sự kiện tiến trình tải
    this.load.on('progress', (value) => {
      progressBar.clear();
      progressBar.fillStyle(0x4CAF50, 1);
      progressBar.fillRect(width/2 - 150, height/2 + 10, 300 * value, 30);
      percentText.setText(parseInt(value * 100) + '%');

      // Add glow effect
      if (value > 0) {
        progressBar.fillStyle(0x81C784, 0.5);
        progressBar.fillRect(width/2 - 150, height/2 + 10, 300 * value, 30);
      }
    });

    // Lắng nghe sự kiện tải hoàn tất
    this.load.on('complete', () => {
      console.log('PreloadScene: Loading complete, switching to LoginScene');
      progressBar.destroy();
      progressBox.destroy();
      loadingText.destroy();
      percentText.destroy();

      // Add a small delay to show completion
      this.time.delayedCall(500, () => {
        this.scene.start('LoginScene'); // Chuyển đến màn hình đăng nhập
      });
    });

    // --- TẠM THỜI KHÔNG TẢI ASSETS ĐỂ TRÁNH LỖI ---
    // Sẽ thêm assets sau khi có file thực tế
    console.log('PreloadScene: Skipping asset loading for now');

    // Tạo một số placeholder assets bằng graphics
    this.createPlaceholderAssets();
  }

  createPlaceholderAssets() {
    // Tạo placeholder textures bằng graphics
    const graphics = this.add.graphics();

    // Tạo texture cho button
    graphics.fillStyle(0x4CAF50);
    graphics.fillRoundedRect(0, 0, 200, 50, 10);
    graphics.generateTexture('button_normal', 200, 50);

    graphics.clear();
    graphics.fillStyle(0x45a049);
    graphics.fillRoundedRect(0, 0, 200, 50, 10);
    graphics.generateTexture('button_hover', 200, 50);

    // Tạo texture cho game board
    graphics.clear();
    graphics.fillStyle(0x8B4513);
    graphics.fillRect(0, 0, 800, 600);
    graphics.generateTexture('gameBoard', 800, 600);

    // Tạo texture cho tokens
    const colors = [0xFF0000, 0x0000FF, 0x00FF00, 0xFFFF00];
    const tokenNames = ['token_red', 'token_blue', 'token_green', 'token_yellow'];

    colors.forEach((color, index) => {
      graphics.clear();
      graphics.fillStyle(color);
      graphics.fillCircle(15, 15, 15);
      graphics.generateTexture(tokenNames[index], 30, 30);
    });

    graphics.destroy();
    console.log('PreloadScene: Placeholder assets created');
  }
}