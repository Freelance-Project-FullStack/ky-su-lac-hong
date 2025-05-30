// client/src/ui/Popup.js
import Phaser from 'phaser';

export default class Popup extends Phaser.GameObjects.Container {
  constructor(scene, x, y, width, height) {
    super(scene, x, y);
    this.width = width;
    this.height = height;

    // Background che mờ màn hình
    this.overlay = scene.add.rectangle(0, 0, scene.cameras.main.width, scene.cameras.main.height, 0x000000, 0.5)
        .setOrigin(0,0)
        .setInteractive() // Ngăn click xuyên qua popup
        .on('pointerdown', () => {}); // Chặn sự kiện

    // Khung Popup
    this.background = scene.add.rectangle(0, 0, width, height, 0xe0e0e0, 1).setStrokeStyle(2, 0x333333);
    this.add([this.overlay, this.background]);

    // Thêm vào scene
    scene.add.existing(this);
    this.setScrollFactor(0); // Để popup không bị cuộn theo camera
  }

  // Nút đóng popup
  addCloseButton() {
    const closeButton = this.scene.add.text(this.width / 2 - 20, -this.height / 2 + 20, 'X', {
        fontSize: '24px', fill: '#ff0000', fontStyle: 'bold'
    }).setOrigin(0.5).setInteractive();

    closeButton.on('pointerdown', () => {
        this.destroy();
    });
    this.add(closeButton);
  }

  // Ghi đè phương thức destroy để xóa cả overlay
  destroy(fromScene) {
    this.overlay.destroy();
    super.destroy(fromScene);
  }
}