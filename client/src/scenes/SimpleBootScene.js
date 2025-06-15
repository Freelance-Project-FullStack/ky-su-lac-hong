import Phaser from 'phaser';

class SimpleBootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'SimpleBootScene' });
  }

  create() {
    console.log('SimpleBootScene: create started');

    try {
      // Get camera dimensions safely
      const width = this.cameras.main.width || 1280;
      const height = this.cameras.main.height || 720;
      console.log('SimpleBootScene: Using dimensions:', width, 'x', height);

      // Create beautiful gradient background
      const bg = this.add.rectangle(width/2, height/2, width, height, 0x1a1a2e);
      console.log('SimpleBootScene: Background created');

      // Add game logo/title with Vietnamese styling
      const titleText = this.add.text(width/2, height/2 - 100, 'KỲ SỬ LẠC HỒNG', {
        fontSize: '64px',
        color: '#ffd700',
        align: 'center',
        fontStyle: 'bold',
        fontFamily: 'Arial, sans-serif',
        stroke: '#8B4513',
        strokeThickness: 3
      }).setOrigin(0.5);

      // Add subtitle
      const subtitleText = this.add.text(width/2, height/2 - 30, 'Trò chơi Board Game Lịch sử Việt Nam', {
        fontSize: '24px',
        color: '#ffffff',
        align: 'center',
        fontFamily: 'Arial, sans-serif'
      }).setOrigin(0.5);

      // Add loading indicator
      const loadingText = this.add.text(width/2, height/2 + 50, 'Đang khởi tạo...', {
        fontSize: '20px',
        color: '#cccccc',
        align: 'center',
        fontFamily: 'Arial, sans-serif'
      }).setOrigin(0.5);

      // Add animated loading dots
      let dotCount = 0;
      const loadingDots = this.time.addEvent({
        delay: 500,
        callback: () => {
          dotCount = (dotCount + 1) % 4;
          loadingText.setText('Đang khởi tạo' + '.'.repeat(dotCount));
        },
        loop: true
      });

      // Add version info
      this.add.text(width - 20, height - 20, 'v1.0.0 Beta', {
        fontSize: '14px',
        color: '#666666',
        fontFamily: 'Arial, sans-serif'
      }).setOrigin(1, 1);

      console.log('SimpleBootScene: UI elements created successfully');

      // Switch to LoginScene after 3 seconds (proper game flow)
      this.time.delayedCall(3000, () => {
        console.log('SimpleBootScene: switching to LoginScene');
        loadingDots.destroy(); // Clean up timer
        this.scene.start('LoginScene');
      });

    } catch (error) {
      console.error('SimpleBootScene: Error in create():', error);
      // Fallback - still try to continue
      this.time.delayedCall(2000, () => {
        console.log('SimpleBootScene: fallback - switching to LoginScene');
        this.scene.start('LoginScene');
      });
    }
  }
}

export default SimpleBootScene;
