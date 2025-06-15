import Phaser from 'phaser';
import SimpleBootScene from './scenes/SimpleBootScene';
import TestMainMenuScene from './scenes/TestMainMenuScene';
import PreloadScene from './scenes/PreloadScene';
import LoginScene from './scenes/LoginScene';
import MainMenuScene from './scenes/MainMenuScene';
import GameScene from './scenes/GameScene';
import './styles/popup-styles.css';

const config = {
  type: Phaser.AUTO, // Use AUTO instead of WEBGL for better compatibility
  width: 1280,
  height: 720,
  parent: 'game-container',
  backgroundColor: '#1a1a2e',
  transparent: false,
  antialias: true,
  powerPreference: 'default',
  dom: {
    createContainer: true
  },
  scene: SimpleBootScene,
  scale: {
    mode: Phaser.Scale.NONE,
    autoCenter: Phaser.Scale.NO_CENTER,
    width: 1280,
    height: 720
  },
  render: {
    antialias: false, // Disable antialias to reduce complexity
    pixelArt: false,
    roundPixels: true, // Enable round pixels for stability
    transparent: false,
    clearBeforeRender: true,
    preserveDrawingBuffer: false,
    premultipliedAlpha: true,
    failIfMajorPerformanceCaveat: false
  },
  audio: {
    disableWebAudio: true,  // Disable WebAudio to prevent AudioContext errors
    noAudio: true           // Completely disable audio for now
  },
  input: {
    mouse: true,
    touch: true,
    keyboard: true
  },
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 0 },
      debug: false
    }
  }
};

// Ensure only one game instance exists
if (window.game) {
  window.game.destroy(true);
}

// Add error handling for Phaser - just log, don't interfere
window.addEventListener('error', (event) => {
  console.error('Global error caught:', event.error);
  // Always prevent default to avoid browser error dialogs
  event.preventDefault();
  return false;
});

// Add unhandled promise rejection handler - just log
window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
  // Always prevent default to avoid browser error dialogs
  event.preventDefault();
  return false;
});

// Global cleanup function
window.cleanupGameResources = function() {
  console.log('Cleaning up game resources...');

  try {
    // Try to get socket service from any active scene
    if (window.game && window.game.scene) {
      const scenes = ['GameScene', 'MainMenuScene'];
      for (const sceneName of scenes) {
        const scene = window.game.scene.getScene(sceneName);
        if (scene && scene.socketService && scene.socketService.isConnected) {
          console.log(`Disconnecting socket from ${sceneName}`);
          scene.socketService.disconnect();
          break;
        }
      }
    }
  } catch (error) {
    console.error('Error during cleanup:', error);
  }
};

// Handle browser close/refresh - disconnect socket and leave room
window.addEventListener('beforeunload', () => {
  console.log('Browser closing/refreshing - cleaning up...');
  window.cleanupGameResources();

  // Don't show confirmation dialog - just clean up
  return undefined;
});

// Handle page visibility change (when user switches tabs or minimizes)
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    console.log('Page hidden - user switched tab or minimized');
    // Don't disconnect on tab switch, just log
  } else {
    console.log('Page visible - user returned to tab');
  }
});

console.log('🎮 Initializing Phaser game...');
console.log('📋 Game config:', config);

// Debug DOM before creating game
const gameContainer = document.getElementById('game-container');
console.log('Game container:', gameContainer);
console.log('Game container style:', gameContainer ? window.getComputedStyle(gameContainer) : 'no container');

// Ensure game container is ready
if (!gameContainer) {
  console.error('Game container not found!');
  throw new Error('Game container not found');
}

// Force game container visibility
gameContainer.style.display = 'block';
gameContainer.style.visibility = 'visible';
gameContainer.style.width = '100%';
gameContainer.style.height = '100vh';
gameContainer.style.position = 'relative';
gameContainer.style.zIndex = '1';
console.log('Game container visibility forced');

// Clear any existing canvas
const existingCanvas = gameContainer.querySelector('canvas');
if (existingCanvas) {
  console.log('Removing existing canvas');
  existingCanvas.remove();
}

try {
  const game = new Phaser.Game(config);
  window.game = game;

  console.log('✅ Phaser game created successfully');

  // Add other scenes after game creation
  game.scene.add('TestMainMenuScene', TestMainMenuScene);
  game.scene.add('LoginScene', LoginScene);
  game.scene.add('MainMenuScene', MainMenuScene);
  game.scene.add('GameScene', GameScene);

  console.log('All scenes added to game');

  // Debug canvas creation
  setTimeout(() => {
    const canvas = game.canvas;
    const container = document.getElementById('game-container');
    console.log('After 1 second:');
    console.log('- Canvas:', canvas);
    console.log('- Canvas in DOM:', canvas ? document.contains(canvas) : 'no canvas');
    console.log('- Container children:', container ? container.children.length : 'no container');
    console.log('- Container innerHTML length:', container ? container.innerHTML.length : 'no container');
  }, 1000);

  // Simple ready event to hide loading
  game.events.once('ready', () => {
    console.log('🎮 Phaser game is ready!');

    // Debug canvas
    const canvas = game.canvas;
    console.log('Canvas element:', canvas);
    console.log('Canvas parent:', canvas ? canvas.parentElement : 'no canvas');
    console.log('Canvas style:', canvas ? window.getComputedStyle(canvas) : 'no canvas');

    // Canvas should now be visible with proper CSS
    if (canvas) {
      console.log('Canvas found and should be visible');
    }

    // Hide loading fallback
    const loadingFallback = document.getElementById('loading-fallback');
    if (loadingFallback) {
      loadingFallback.style.display = 'none';
    }
  });

} catch (error) {
  console.error('❌ Failed to create Phaser game:', error);
}