import Phaser from 'phaser';

export default class PreloadScene extends Phaser.Scene {
  constructor() {
    super('PreloadScene');
  }

  preload() {
    // Hiển thị logo đã tải từ BootScene
    this.add.image(this.cameras.main.centerX, this.cameras.main.centerY - 100, 'logo');

    // Tạo thanh tiến trình loading
    const progressBar = this.add.graphics();
    const progressBox = this.add.graphics();
    progressBox.fillStyle(0x222222, 0.8);
    progressBox.fillRect(this.cameras.main.centerX - 160, this.cameras.main.centerY, 320, 50);

    const loadingText = this.make.text({
      x: this.cameras.main.centerX,
      y: this.cameras.main.centerY - 50,
      text: 'Đang tải...',
      style: {
        font: '20px monospace',
        fill: '#ffffff'
      }
    }).setOrigin(0.5, 0.5);

    const percentText = this.make.text({
      x: this.cameras.main.centerX,
      y: this.cameras.main.centerY + 25,
      text: '0%',
      style: {
        font: '18px monospace',
        fill: '#ffffff'
      }
    }).setOrigin(0.5, 0.5);

    // Lắng nghe sự kiện tiến trình tải
    this.load.on('progress', (value) => {
      progressBar.clear();
      progressBar.fillStyle(0xffffff, 1);
      progressBar.fillRect(this.cameras.main.centerX - 150, this.cameras.main.centerY + 10, 300 * value, 30);
      percentText.setText(parseInt(value * 100) + '%');
    });

    // Lắng nghe sự kiện tải hoàn tất
    this.load.on('complete', () => {
      progressBar.destroy();
      progressBox.destroy();
      loadingText.destroy();
      percentText.destroy();
      this.scene.start('MainMenuScene'); // Chuyển đến màn hình chính
    });

    // --- BẮT ĐẦU TẢI TẤT CẢ TÀI SẢN GAME Ở ĐÂY ---
    // Đường dẫn ví dụ, bạn cần thay thế bằng tài nguyên thực tế của mình

    // 1. Giao diện (UI)
    this.load.image('mainMenuBackground', 'assets/images/ui/main_menu_bg.jpg');
    this.load.image('button_normal', 'assets/images/ui/button_normal.png');
    this.load.image('button_hover', 'assets/images/ui/button_hover.png');
    this.load.image('popup_background', 'assets/images/ui/popup_bg.png');

    // 2. Bàn cờ và quân cờ
    this.load.image('gameBoard', 'assets/images/board/ban_co_chinh.png');
    this.load.image('token_red', 'assets/images/tokens/token_red.png');
    this.load.image('token_blue', 'assets/images/tokens/token_blue.png');
    this.load.image('token_green', 'assets/images/tokens/token_green.png');
    this.load.image('token_yellow', 'assets/images/tokens/token_yellow.png');

    // 3. Công trình
    this.load.image('building_nha', 'assets/images/buildings/nha.png');
    this.load.image('building_den', 'assets/images/buildings/den.png');
    this.load.image('building_thanh', 'assets/images/buildings/thanh.png');

    // 4. Thẻ bài
    this.load.image('card_back', 'assets/images/cards/card_back.png');
    // Tải từng thẻ bài cụ thể nếu cần hiển thị hình ảnh
    this.load.image('card_hc_vua_hung', 'assets/images/cards/hc_vua_hung.png');
    this.load.image('card_sk_thien_tai', 'assets/images/cards/sk_thien_tai.png');
    // ...

    // 5. Âm thanh
    this.load.audio('dice_roll_sound', 'assets/audio/dice_roll.mp3');
    this.load.audio('player_move_sound', 'assets/audio/player_move.mp3');
    this.load.audio('buy_property_sound', 'assets/audio/buy_property.mp3');
    this.load.audio('background_music', 'assets/audio/background_music.mp3');
  }
}