import Phaser from 'phaser';
import BootScene from './scenes/BootScene';
import PreloadScene from './scenes/PreloadScene';
import MainMenuScene from './scenes/MainMenuScene';
import GameScene from './scenes/GameScene';

const config = {
  type: Phaser.AUTO, // Hoặc Phaser.WEBGL
  width: 1280, // Kích thước game
  height: 720,
  parent: 'game-container', // ID của div trong index.html
  dom: {
    createContainer: true
  },
  scene: [BootScene, PreloadScene, MainMenuScene, GameScene],
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  // physics, plugins, etc.
};

const game = new Phaser.Game(config);