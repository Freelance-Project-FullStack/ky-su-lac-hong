import PopupManager from '../utils/PopupManager';

export default class TestMainMenuScene extends Phaser.Scene {
  constructor() {
    super({ key: 'TestMainMenuScene' });
  }

  create() {
    console.log('TestMainMenuScene: create started');

    // Debug canvas
    console.log('TestMainMenuScene: Canvas:', this.game.canvas);
    console.log('TestMainMenuScene: Renderer:', this.game.renderer);

    const { width, height } = this.cameras.main;
    console.log('TestMainMenuScene: Camera size:', width, 'x', height);

    // Force canvas visibility from scene
    if (this.game.canvas) {
      this.game.canvas.style.display = 'block';
      this.game.canvas.style.visibility = 'visible';
      this.game.canvas.style.opacity = '1';
      this.game.canvas.style.border = '3px solid #ffd700';
      console.log('TestMainMenuScene: Canvas visibility forced');
    }
    
    // Background
    this.add.rectangle(width/2, height/2, width, height, 0x0f3460);
    
    // Title
    this.add.text(width/2, height/3, 'KỲ SỬ LẠC HỒNG', {
      fontSize: '48px',
      color: '#ffd700',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    
    // Subtitle
    this.add.text(width/2, height/3 + 80, 'Vietnamese Historical Board Game', {
      fontSize: '24px',
      color: '#ffffff'
    }).setOrigin(0.5);
    
    // Test message
    this.add.text(width/2, height/3 + 120, '(Test Mode - No Authentication Required)', {
      fontSize: '16px',
      color: '#ffaa00'
    }).setOrigin(0.5);
    
    // Start Game Button
    const startButton = this.add.rectangle(width/2, height/2 + 50, 200, 60, 0x4CAF50)
      .setInteractive()
      .on('pointerdown', () => {
        console.log('Start Game clicked');
        PopupManager.info('Thông báo', 'Game Scene chưa được triển khai');
      })
      .on('pointerover', () => startButton.setFillStyle(0x66BB6A))
      .on('pointerout', () => startButton.setFillStyle(0x4CAF50));
    
    this.add.text(width/2, height/2 + 50, 'START GAME', {
      fontSize: '20px',
      color: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    
    // Test Board Button
    const testButton = this.add.rectangle(width/2, height/2 + 130, 200, 60, 0x2196F3)
      .setInteractive()
      .on('pointerdown', () => {
        console.log('Test Board clicked');
        PopupManager.info('Thông báo', 'Test Board Scene chưa được triển khai');
      })
      .on('pointerover', () => testButton.setFillStyle(0x42A5F5))
      .on('pointerout', () => testButton.setFillStyle(0x2196F3));
    
    this.add.text(width/2, height/2 + 130, 'TEST BOARD', {
      fontSize: '20px',
      color: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    
    // Back to Login Button
    const backButton = this.add.rectangle(width/2, height/2 + 210, 200, 60, 0xFF5722)
      .setInteractive()
      .on('pointerdown', () => {
        console.log('Back to Login clicked');
        this.scene.start('LoginScene');
      })
      .on('pointerover', () => backButton.setFillStyle(0xFF7043))
      .on('pointerout', () => backButton.setFillStyle(0xFF5722));
    
    this.add.text(width/2, height/2 + 210, 'BACK TO LOGIN', {
      fontSize: '20px',
      color: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    
    console.log('TestMainMenuScene: UI created successfully');

    // Debug canvas position and visibility
    setTimeout(() => {
      const canvas = this.game.canvas;
      if (canvas) {
        console.log('=== CANVAS DEBUG FROM SCENE ===');
        console.log('Canvas element:', canvas);
        console.log('Canvas parent:', canvas.parentElement);
        console.log('Canvas position:', canvas.getBoundingClientRect());
        console.log('Canvas computed style:', window.getComputedStyle(canvas));
        console.log('Canvas in DOM:', document.contains(canvas));

        // Make canvas VERY visible
        canvas.style.position = 'fixed';
        canvas.style.top = '50px';
        canvas.style.left = '50px';
        canvas.style.zIndex = '9999';
        canvas.style.border = '10px solid red';
        canvas.style.background = 'yellow';
        canvas.style.opacity = '1';
        canvas.style.display = 'block';
        canvas.style.visibility = 'visible';

        console.log('Canvas forced to fixed position with red border and yellow background');
      } else {
        console.log('No canvas found in scene!');
      }
    }, 1000);

    // Also debug the game container
    setTimeout(() => {
      const container = document.getElementById('game-container');
      if (container) {
        console.log('=== CONTAINER DEBUG ===');
        console.log('Container:', container);
        console.log('Container style:', window.getComputedStyle(container));
        console.log('Container children:', container.children);
        console.log('Container innerHTML length:', container.innerHTML.length);

        // Make container visible
        container.style.background = 'blue';
        container.style.border = '5px solid green';
        container.style.minHeight = '720px';
        container.style.minWidth = '1280px';

        console.log('Container made visible with blue background');
      }
    }, 1500);
  }
}
