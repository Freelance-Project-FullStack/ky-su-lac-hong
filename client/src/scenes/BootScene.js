import Phaser from 'phaser';

export default class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene');
  }

  preload() {
    // Không load gì cả, chỉ để khởi tạo
    console.log('BootScene: preload started');
  }

  create() {
    console.log('BootScene: create started');

    // Safety check
    if (!this.scene || !this.cameras || !this.add || !this.time) {
      console.error('BootScene: Scene not properly initialized');
      return;
    }

    // Hide loading fallback when BootScene starts
    const loadingFallback = document.getElementById('loading-fallback');
    if (loadingFallback) {
      loadingFallback.style.display = 'none';
      console.log('Loading fallback hidden from BootScene');
    }

    try {
      // Hiển thị loading text
      const { width, height } = this.cameras.main;
      console.log(`BootScene: Canvas size ${width}x${height}`);

      // Create background
      const bg = this.add.rectangle(width/2, height/2, width, height, 0x1a1a2e);
      bg.setDepth(-1);
      console.log('BootScene: Background created');

      // Create main title
      const titleText = this.add.text(width/2, height/2 - 50, 'Kỳ Sử Lạc Hồng', {
        fontSize: '48px',
        color: '#ffd700',
        fontFamily: 'Arial, sans-serif',
        fontStyle: 'bold',
        stroke: '#000000',
        strokeThickness: 2
      }).setOrigin(0.5);
      console.log('BootScene: Title created');

      // Create loading text
      const loadingText = this.add.text(width/2, height/2 + 20, 'Đang khởi động game...', {
        fontSize: '24px',
        color: '#ffffff',
        fontFamily: 'Arial, sans-serif'
      }).setOrigin(0.5);
      console.log('BootScene: Loading text created');

      // Create version text
      this.add.text(width/2, height/2 + 60, 'Vietnamese Historical Board Game', {
        fontSize: '16px',
        color: '#cccccc',
        fontFamily: 'Arial, sans-serif'
      }).setOrigin(0.5);

      // Add loading animation
      this.tweens.add({
        targets: loadingText,
        alpha: 0.3,
        duration: 1000,
        yoyo: true,
        repeat: -1
      });

      console.log('BootScene: UI elements created successfully');

      // Chuyển sang LoginScene sau 2 giây
      this.time.delayedCall(2000, () => {
        console.log('BootScene: switching to LoginScene');
        try {
          if (this.scene && this.scene.start) {
            this.scene.start('LoginScene');
          } else {
            console.error('BootScene: Scene manager not available');
          }
        } catch (error) {
          console.error('BootScene: Error switching to LoginScene:', error);
        }
      });

    } catch (error) {
      console.error('BootScene: Error in create():', error);
      // Fallback - try to continue anyway
      this.time.delayedCall(1000, () => {
        console.log('BootScene: fallback - switching to LoginScene');
        try {
          if (this.scene && this.scene.start) {
            this.scene.start('LoginScene');
          } else {
            console.error('BootScene: Scene manager not available in fallback');
          }
        } catch (fallbackError) {
          console.error('BootScene: Fallback also failed:', fallbackError);
        }
      });
    }
  }
}