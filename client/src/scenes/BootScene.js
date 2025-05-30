import Phaser from 'phaser';

export default class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene');
  }

  preload() {
    // Tải một logo hoặc hình ảnh nền cho màn hình loading
    // Điều này cho người dùng thấy game đang chạy ngay lập tức
    this.load.image('logo', 'assets/images/ui/logo_placeholder.png'); // Thay bằng đường dẫn logo của bạn
  }

  create() {
    // Sau khi tải xong tài nguyên tối thiểu, chuyển ngay sang PreloadScene
    this.scene.start('PreloadScene');
  }
}