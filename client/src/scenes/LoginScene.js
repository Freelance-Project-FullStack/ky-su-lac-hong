import Phaser from 'phaser';
import React from 'react';
import ReactDOM from 'react-dom/client';
import ApiService from '../services/ApiService';
import LoginForm from '../components/LoginForm.jsx';
import RegisterForm from '../components/RegisterForm.jsx';

export default class LoginScene extends Phaser.Scene {
  constructor() {
    super('LoginScene');
    this.apiService = ApiService;
    this.showingRegister = false;
  }

  create() {
    console.log('LoginScene: create started');

    // Safety check
    if (!this.scene || !this.cameras || !this.add) {
      console.error('LoginScene: Scene not properly initialized');
      return;
    }

    // Add background first to ensure something is visible
    const { width, height } = this.cameras.main;
    const bg = this.add.rectangle(width/2, height/2, width, height, 0x1a1a2e);
    bg.setDepth(-1);

    // Add temporary text to show scene is working
    const tempText = this.add.text(width/2, height/2, 'Login Scene Loaded', {
      fontSize: '32px',
      color: '#ffffff',
      fontFamily: 'Arial, sans-serif'
    }).setOrigin(0.5);

    console.log('LoginScene: Background and temp text created');

    // Check if already logged in and verify token
    if (this.apiService.isAuthenticated()) {
      console.log('LoginScene: Found token, verifying...');
      this.verifyAndProceed();
      return;
    }

    // No token found, show login form
    console.log('LoginScene: No token found, creating React login form');
    this.createReactLoginForm();
  }

  async verifyAndProceed() {
    try {
      console.log('LoginScene: Verifying token...');
      const result = await this.apiService.verifyToken();
      console.log('LoginScene: Token verification result:', result);

      if (result && result.valid) {
        console.log('LoginScene: Token valid, switching to MainMenuScene');
        try {
          if (this.scene && this.scene.start) {
            this.scene.start('MainMenuScene', { shouldRefresh: true });
          } else {
            console.error('LoginScene: Scene manager not available');
          }
        } catch (error) {
          console.error('LoginScene: Error switching to MainMenuScene:', error);
        }
      } else {
        console.log('LoginScene: Token invalid, showing login form');
        this.createReactLoginForm();
      }
    } catch (error) {
      console.error('LoginScene: Token verification failed:', error);
      this.createReactLoginForm();
    }
  }

  createReactLoginForm() {
    try {
      // Create container for React component
      this.loginContainer = document.createElement('div');
      this.loginContainer.id = 'login-react-container';
      this.loginContainer.style.position = 'absolute';
      this.loginContainer.style.top = '0';
      this.loginContainer.style.left = '0';
      this.loginContainer.style.width = '100%';
      this.loginContainer.style.height = '100%';
      this.loginContainer.style.zIndex = '1000';
      document.body.appendChild(this.loginContainer);

      console.log('LoginScene: React container created');

      // Create React root and render LoginForm
      this.reactRoot = ReactDOM.createRoot(this.loginContainer);
      this.renderCurrentForm();

      console.log('LoginScene: React form rendered');
    } catch (error) {
      console.error('LoginScene: Error creating React form:', error);
    }
  }



  async handleLogin(formData) {
    try {
      console.log('LoginScene: Attempting login with:', formData);
      const result = await this.apiService.login(formData);
      console.log('LoginScene: Login successful:', result);

      this.cleanupReactForm();
      console.log('LoginScene: Switching to MainMenuScene after login');
      try {
        if (this.scene && this.scene.start) {
          this.scene.start('MainMenuScene', { shouldRefresh: true });
        } else {
          console.error('LoginScene: Scene manager not available after login');
        }
      } catch (error) {
        console.error('LoginScene: Error switching to MainMenuScene after login:', error);
      }
    } catch (error) {
      console.error('LoginScene: Login error:', error);
      throw new Error(error.response?.data?.error || error.message || 'Login failed');
    }
  }

  renderCurrentForm() {
    if (this.showingRegister) {
      this.reactRoot.render(
        React.createElement(RegisterForm, {
          onRegister: this.handleRegister.bind(this),
          onBackToLogin: this.showLoginForm.bind(this)
        })
      );
    } else {
      this.reactRoot.render(
        React.createElement(LoginForm, {
          onLogin: this.handleLogin.bind(this),
          onRegister: this.showRegisterForm.bind(this),
          onGuestPlay: this.playAsGuest.bind(this)
        })
      );
    }
  }

  showRegisterForm() {
    this.showingRegister = true;
    this.renderCurrentForm();
  }

  showLoginForm() {
    this.showingRegister = false;
    this.renderCurrentForm();
  }

  async handleRegister(formData) {
    try {
      await this.apiService.register(formData);
      console.log('Registration successful');
      this.cleanupReactForm();
      this.scene.start('MainMenuScene', { shouldRefresh: true });
    } catch (error) {
      console.error('Registration error:', error);
      throw new Error(error.response?.data?.error || error.message || 'Registration failed');
    }
  }

  playAsGuest() {
    // For guest play, we'll create a temporary user session
    const guestUser = {
      id: `guest_${Date.now()}`,
      username: `Guest_${Math.random().toString(36).substring(2, 7)}`,
      isGuest: true
    };

    this.apiService.setUser(guestUser);
    this.cleanupReactForm();
    this.scene.start('MainMenuScene', { shouldRefresh: true });
  }

  cleanupReactForm() {
    if (this.reactRoot) {
      this.reactRoot.unmount();
      this.reactRoot = null;
    }
    if (this.loginContainer && this.loginContainer.parentNode) {
      this.loginContainer.parentNode.removeChild(this.loginContainer);
      this.loginContainer = null;
    }
  }

  destroy() {
    this.cleanupReactForm();
    super.destroy();
  }
}
