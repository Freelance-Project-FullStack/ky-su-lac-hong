import Phaser from 'phaser';
import socketService from '../services/SocketService';

export default class MainMenuScene extends Phaser.Scene {
  constructor() {
    super('MainMenuScene');
  }

  create() {
    // Kết nối tới server ngay khi vào màn hình chính
    if (!socketService.socket || !socketService.socket.connected) {
        socketService.connect();
    }

    // Hiển thị nền
    this.add.image(0, 0, 'mainMenuBackground').setOrigin(0);

    // Hiển thị tiêu đề game
    this.add.text(this.cameras.main.centerX, 100, 'Kỳ Sử Lạc Hồng', {
      fontSize: '64px',
      fontFamily: '"Arial Black", Gadget, sans-serif',
      color: '#e6d8ad',
      stroke: '#4a2d14',
      strokeThickness: 8
    }).setOrigin(0.5);

    // --- Form nhập liệu ---
    // Sử dụng DOM Element của Phaser để hiển thị các thẻ HTML input
    this.inputPlayerName = this.add.dom(this.cameras.main.centerX, 250).createFromHTML(`
        <input type="text" id="playerNameInput" class="game-input" placeholder="Nhập tên của bạn" style="width: 300px;">
    `);

    this.inputRoomId = this.add.dom(this.cameras.main.centerX, 400).createFromHTML(`
        <input type="text" id="roomIdInput" class="game-input" placeholder="Nhập mã phòng" style="width: 300px;">
    `);

    // --- Các nút bấm ---
    const createRoomButton = this.add.text(this.cameras.main.centerX, 320, 'Tạo Phòng Mới', {
        fontSize: '24px', fill: '#fff', backgroundColor: '#28a745', padding: { x: 20, y: 10 },
        fontFamily: 'Arial, sans-serif', fontStyle: 'bold',
    }).setOrigin(0.5).setInteractive();

    const joinRoomButton = this.add.text(this.cameras.main.centerX, 470, 'Vào Phòng', {
        fontSize: '24px', fill: '#fff', backgroundColor: '#007bff', padding: { x: 20, y: 10 },
        fontFamily: 'Arial, sans-serif', fontStyle: 'bold',
    }).setOrigin(0.5).setInteractive();
    
    // Thông báo lỗi
    this.errorText = this.add.text(this.cameras.main.centerX, 550, '', {
        fontSize: '18px', fill: '#ff4d4d', fontStyle: 'bold'
    }).setOrigin(0.5);


    // --- Xử lý sự kiện ---
    createRoomButton.on('pointerdown', () => {
      const playerName = this.inputPlayerName.getChildByID('playerNameInput').value;
      if (playerName.trim()) {
        socketService.createRoom(playerName);
        this.errorText.setText('');
      } else {
        this.errorText.setText('Vui lòng nhập tên của bạn!');
      }
    });

    joinRoomButton.on('pointerdown', () => {
      const playerName = this.inputPlayerName.getChildByID('playerNameInput').value;
      const roomId = this.inputRoomId.getChildByID('roomIdInput').value;
      if (!playerName.trim()) {
        this.errorText.setText('Vui lòng nhập tên của bạn!');
        return;
      }
      if (!roomId.trim()) {
        this.errorText.setText('Vui lòng nhập mã phòng!');
        return;
      }
      socketService.joinRoom(roomId, playerName);
      this.errorText.setText('');
    });

    // Lắng nghe phản hồi từ server
    socketService.on('roomCreated', this.handleRoomJoined, this);
    socketService.on('joinedRoom', this.handleRoomJoined, this);
    socketService.on('serverError', this.handleServerError, this);
  }

  handleRoomJoined(data) {
    // Dọn dẹp các listener của scene này trước khi chuyển
    this.cleanupListeners();
    // Chuyển sang màn hình chơi game, truyền dữ liệu ban đầu
    this.scene.start('GameScene', { initialGameState: data.initialGameState });
  }

  handleServerError({ message }) {
    this.errorText.setText(`Lỗi: ${message}`);
  }

  cleanupListeners() {
      // Quan trọng: Gỡ bỏ các listener khi scene này không còn hoạt động
      // để tránh việc chúng được gọi lại ở các scene khác.
      socketService.removeAllListeners('roomCreated');
      socketService.removeAllListeners('joinedRoom');
      socketService.removeAllListeners('serverError');
  }

  shutdown() {
      // Được gọi khi scene này bị tắt
      this.cleanupListeners();
  }
}