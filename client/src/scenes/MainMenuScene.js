import Phaser from 'phaser';
import socketService from '../services/SocketService';
import ApiService from '../services/ApiService';
import PopupManager from '../utils/PopupManager';

export default class MainMenuScene extends Phaser.Scene {
  constructor() {
    super('MainMenuScene');
    this.apiService = ApiService;
    this.socketService = socketService;
    this.roomsList = [];
  }

  create(data) {
    console.log('MainMenuScene: create() called with data:', data);

    try {
      // Safety check
      if (!this.scene || !this.cameras || !this.add || !this.children) {
        console.error('MainMenuScene: Scene not properly initialized');
        return;
      }

      // Clear any existing scene data
      this.children.removeAll(true);

      const { width, height } = this.cameras.main;

      // Check authentication
      if (!this.apiService.isAuthenticated()) {
        console.log('MainMenuScene: Not authenticated, redirecting to LoginScene');
        try {
          if (this.scene && this.scene.start) {
            this.scene.start('LoginScene');
          } else {
            console.error('MainMenuScene: Scene manager not available');
          }
        } catch (error) {
          console.error('MainMenuScene: Error switching to LoginScene:', error);
        }
        return;
      }

      console.log('MainMenuScene: User authenticated, creating UI');

    // Background
    this.add.rectangle(width/2, height/2, width, height, 0x1a1a2e);

    // Title
    this.add.text(width/2, 60, 'KỲ SỬ LẠC HỒNG', {
      fontSize: '36px',
      fontFamily: 'Arial',
      color: '#ffd700',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    // User info
    const user = this.apiService.getUser();
    if (user) {
      this.add.text(width - 20, 20, `Welcome, ${user.username}!`, {
        fontSize: '16px',
        fontFamily: 'Arial',
        color: '#ffffff'
      }).setOrigin(1, 0);

      // Logout button
      const logoutBtn = this.add.text(width - 20, 45, 'Logout', {
        fontSize: '14px',
        fontFamily: 'Arial',
        color: '#ff6b6b',
        fontStyle: 'underline'
      }).setOrigin(1, 0);
      logoutBtn.setInteractive();
      logoutBtn.on('pointerdown', () => this.logout());
    }

    this.createMainMenu();
    this.createRoomsList();

    // Connect to socket
    this.socketService.connect();
    this.setupSocketListeners();

    // Load rooms
    this.loadRooms();

    // Check if we should refresh (coming from GameScene)
    if (data && data.shouldRefresh) {
      console.log('MainMenuScene: Refreshing due to return from GameScene');
      // Delay refresh to ensure UI is ready
      setTimeout(() => {
        this.loadRooms();
        PopupManager.toast('Danh sách phòng đã được làm mới', 'info');
      }, 500);
    }

    console.log('MainMenuScene: create() completed successfully');
    } catch (error) {
      console.error('MainMenuScene: Error in create():', error);
    }
  }

  createMainMenu() {
    const { width, height } = this.cameras.main;
    const centerX = width / 2;
    const startY = 150;

    // Create Room button
    const createRoomBtn = this.add.rectangle(centerX, startY, 250, 50, 0x4CAF50);
    createRoomBtn.setInteractive();
    createRoomBtn.on('pointerdown', () => this.showCreateRoomDialog());
    createRoomBtn.on('pointerover', () => createRoomBtn.setFillStyle(0x66BB6A));
    createRoomBtn.on('pointerout', () => createRoomBtn.setFillStyle(0x4CAF50));

    this.add.text(centerX, startY, 'Create Room', {
      fontSize: '18px',
      fontFamily: 'Arial',
      color: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    // Quick Join button
    const quickJoinBtn = this.add.rectangle(centerX, startY + 70, 250, 50, 0x2196F3);
    quickJoinBtn.setInteractive();
    quickJoinBtn.on('pointerdown', () => this.quickJoin());
    quickJoinBtn.on('pointerover', () => quickJoinBtn.setFillStyle(0x42A5F5));
    quickJoinBtn.on('pointerout', () => quickJoinBtn.setFillStyle(0x2196F3));

    this.add.text(centerX, startY + 70, 'Quick Join', {
      fontSize: '18px',
      fontFamily: 'Arial',
      color: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    // Removed Test Game button as requested

    // Game History button
    const historyBtn = this.add.rectangle(centerX, startY + 140, 250, 50, 0x9C27B0);
    historyBtn.setInteractive();
    historyBtn.on('pointerdown', () => this.showGameHistory());
    historyBtn.on('pointerover', () => historyBtn.setFillStyle(0xBA68C8));
    historyBtn.on('pointerout', () => historyBtn.setFillStyle(0x9C27B0));

    this.add.text(centerX, startY + 140, 'Game History', {
      fontSize: '18px',
      fontFamily: 'Arial',
      color: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    // Leaderboard button
    const leaderboardBtn = this.add.rectangle(centerX, startY + 210, 250, 50, 0xFF9800);
    leaderboardBtn.setInteractive();
    leaderboardBtn.on('pointerdown', () => this.showLeaderboard());
    leaderboardBtn.on('pointerover', () => leaderboardBtn.setFillStyle(0xFFB74D));
    leaderboardBtn.on('pointerout', () => leaderboardBtn.setFillStyle(0xFF9800));

    this.add.text(centerX, startY + 210, 'Leaderboard', {
      fontSize: '18px',
      fontFamily: 'Arial',
      color: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5);
  }

  createRoomsList() {
    const { width, height } = this.cameras.main;

    // Rooms panel background
    const panelBg = this.add.rectangle(width - 200, height/2, 380, height - 140, 0x000000, 0.8);
    panelBg.setStrokeStyle(2, 0xffd700);

    // Rooms panel title
    const titleBg = this.add.rectangle(width - 200, 130, 360, 40, 0xffd700, 0.9);
    this.add.text(width - 200, 130, '🏠 PHÒNG CHỜ', {
      fontSize: '18px',
      fontFamily: 'Arial',
      color: '#1a1a2e',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    // Refresh button
    const refreshBtn = this.add.rectangle(width - 50, 130, 35, 35, 0x4CAF50);
    refreshBtn.setInteractive();
    refreshBtn.on('pointerdown', () => {
      this.loadRooms();
      PopupManager.toast('Đã làm mới danh sách phòng', 'success');
    });
    refreshBtn.on('pointerover', () => refreshBtn.setFillStyle(0x66BB6A));
    refreshBtn.on('pointerout', () => refreshBtn.setFillStyle(0x4CAF50));

    this.add.text(width - 50, 130, '🔄', {
      fontSize: '16px'
    }).setOrigin(0.5);

    // Rooms container with scroll area
    this.roomsContainer = this.add.container(width - 200, 170);

    // No rooms message (initially hidden)
    this.noRoomsText = this.add.text(width - 200, height/2, 'Không có phòng chờ nào\n\nHãy tạo phòng mới để bắt đầu!', {
      fontSize: '16px',
      fontFamily: 'Arial',
      color: '#cccccc',
      align: 'center',
      lineSpacing: 8
    }).setOrigin(0.5);
    this.noRoomsText.setVisible(false);
  }

  async loadRooms() {
    try {
      const response = await this.apiService.getRooms({ status: 'waiting', limit: 8 });
      this.displayRooms(response.games);
    } catch (error) {
      console.error('Failed to load rooms:', error);
      PopupManager.error('Lỗi', 'Không thể tải danh sách phòng');
    }
  }

  displayRooms(rooms) {
    // Clear existing room displays
    this.roomsContainer.removeAll(true);

    // Show/hide no rooms message
    if (rooms.length === 0) {
      this.noRoomsText.setVisible(true);
      return;
    } else {
      this.noRoomsText.setVisible(false);
    }

    rooms.forEach((room, index) => {
      const y = index * 75; // Increased spacing

      // Room card background with gradient effect
      const roomBg = this.add.rectangle(0, y, 350, 65, 0x2a2a4e, 0.95);
      roomBg.setStrokeStyle(2, room.settings.isPrivate ? 0xff9800 : 0x4CAF50);

      // Room status indicator
      const statusColor = this.getRoomStatusColor(room);
      const statusIndicator = this.add.circle(-160, y - 20, 6, statusColor);

      // Room name with icon
      const roomIcon = room.settings.isPrivate ? '🔒' : '🏠';
      const displayName = room.roomName || room.roomId; // Fallback to roomId if roomName not available
      const roomName = displayName.length > 15 ? displayName.substring(0, 15) + '...' : displayName;
      const roomText = this.add.text(-150, y - 15, `${roomIcon} ${roomName}`, {
        fontSize: '14px',
        fontFamily: 'Arial',
        color: '#ffffff',
        fontStyle: 'bold'
      });

      // Players info with icons
      const playersColor = room.players.length >= room.settings.maxPlayers ? '#ff6b6b' : '#4ecdc4';
      const playersText = this.add.text(-150, y + 5, `👥 ${room.players.length}/${room.settings.maxPlayers} người chơi`, {
        fontSize: '12px',
        fontFamily: 'Arial',
        color: playersColor
      });

      // Room settings info
      const privateInfo = room.settings.isPrivate ? ' • 🔒 Riêng tư' : ' • 🏠 Công khai';
      const settingsText = this.add.text(-150, y + 20, `⚙️ ${room.settings.maxPlayers} người tối đa${privateInfo}`, {
        fontSize: '10px',
        fontFamily: 'Arial',
        color: '#cccccc'
      });

      // Join button with better styling
      const canJoin = room.players.length < room.settings.maxPlayers && room.status === 'waiting';
      const joinBtnColor = canJoin ? 0x4CAF50 : 0x666666;
      const joinBtn = this.add.rectangle(120, y, 80, 35, joinBtnColor);

      if (canJoin) {
        joinBtn.setInteractive();
        joinBtn.on('pointerdown', () => this.handleJoinRoom(room));
        joinBtn.on('pointerover', () => joinBtn.setFillStyle(0x66BB6A));
        joinBtn.on('pointerout', () => joinBtn.setFillStyle(0x4CAF50));
      }

      const joinText = this.add.text(120, y, canJoin ? 'Vào phòng' : 'Đầy', {
        fontSize: '12px',
        fontFamily: 'Arial',
        color: '#ffffff',
        fontStyle: 'bold'
      }).setOrigin(0.5);

      // Add hover effect for the entire room card
      roomBg.setInteractive();
      roomBg.on('pointerover', () => {
        roomBg.setFillStyle(0x3a3a5e);
      });
      roomBg.on('pointerout', () => {
        roomBg.setFillStyle(0x2a2a4e);
      });

      this.roomsContainer.add([roomBg, statusIndicator, roomText, playersText, settingsText, joinBtn, joinText]);
    });
  }

  getRoomStatusColor(room) {
    if (room.status === 'playing') return 0xff6b6b; // Red for playing
    if (room.players.length >= room.settings.maxPlayers) return 0xff9800; // Orange for full
    return 0x4CAF50; // Green for available
  }

  async showCreateRoomDialog() {
    try {
      const { value: formValues } = await PopupManager.custom({
        title: '🏠 Tạo Phòng Chơi',
        html: `
          <div style="text-align: left;">
            <label for="roomName" style="color: #ffd700; font-weight: bold;">Tên phòng:</label>
            <input id="roomName" class="swal2-input" placeholder="Nhập tên phòng..." value="Phòng của ${this.apiService.getUser()?.username || 'Player'}" style="background: rgba(45, 45, 68, 0.9) !important; color: white !important; border: 2px solid #4a4a6a !important;">

            <label for="maxPlayers" style="color: #ffd700; font-weight: bold; margin-top: 15px; display: block;">Số người chơi tối đa:</label>
            <select id="maxPlayers" class="swal2-input" style="background: rgba(45, 45, 68, 0.9) !important; color: white !important; border: 2px solid #4a4a6a !important;">
              <option value="2">2 người chơi</option>
              <option value="3">3 người chơi</option>
              <option value="4" selected>4 người chơi</option>
            </select>

            <label for="roomType" style="color: #ffd700; font-weight: bold; margin-top: 15px; display: block;">Loại phòng:</label>
            <select id="roomType" class="swal2-input" style="background: rgba(45, 45, 68, 0.9) !important; color: white !important; border: 2px solid #4a4a6a !important;">
              <option value="public">🏠 Công khai</option>
              <option value="private">🔒 Riêng tư (có mật khẩu)</option>
            </select>

            <div id="passwordField" style="display: none; margin-top: 15px;">
              <label for="roomPassword" style="color: #ffd700; font-weight: bold;">Mật khẩu phòng:</label>
              <input id="roomPassword" class="swal2-input" type="password" placeholder="Nhập mật khẩu (4-20 ký tự)..." maxlength="20" style="background: rgba(45, 45, 68, 0.9) !important; color: white !important; border: 2px solid #4a4a6a !important;">
              <small style="color: #cccccc; font-size: 12px; display: block; margin-top: 5px;">
                ⚠️ Lưu ý: Người chơi khác sẽ cần mật khẩu này để vào phòng
              </small>
            </div>
          </div>
        `,
        focusConfirm: false,
        showCancelButton: true,
        confirmButtonText: 'Tạo phòng',
        cancelButtonText: 'Hủy',
        didOpen: () => {
          // Setup event listener for room type change
          const roomTypeSelect = document.getElementById('roomType');
          const passwordField = document.getElementById('passwordField');

          if (roomTypeSelect && passwordField) {
            roomTypeSelect.addEventListener('change', function() {
              const isPrivate = this.value === 'private';
              passwordField.style.display = isPrivate ? 'block' : 'none';

              // Focus on password field when shown
              if (isPrivate) {
                setTimeout(() => {
                  const passwordInput = document.getElementById('roomPassword');
                  if (passwordInput) {
                    passwordInput.focus();
                  }
                }, 100);
              }
            });
          }
        },
        preConfirm: () => {
          const roomName = document.getElementById('roomName').value;
          const maxPlayers = parseInt(document.getElementById('maxPlayers').value);
          const roomType = document.getElementById('roomType').value;
          const password = document.getElementById('roomPassword').value;

          if (!roomName.trim()) {
            PopupManager.error('Lỗi', 'Vui lòng nhập tên phòng');
            return false;
          }

          if (roomType === 'private') {
            if (!password.trim()) {
              PopupManager.error('Lỗi', 'Vui lòng nhập mật khẩu cho phòng riêng tư');
              return false;
            }
            if (password.trim().length < 4) {
              PopupManager.error('Lỗi', 'Mật khẩu phải có ít nhất 4 ký tự');
              return false;
            }
            if (password.trim().length > 20) {
              PopupManager.error('Lỗi', 'Mật khẩu không được quá 20 ký tự');
              return false;
            }
          }

          return {
            roomName: roomName.trim(),
            maxPlayers,
            isPrivate: roomType === 'private',
            password: roomType === 'private' ? password.trim() : undefined
          };
        }
      });

      if (formValues) {
        PopupManager.loading('Đang tạo phòng...');
        const response = await this.apiService.createRoom(formValues);
        PopupManager.closeLoading();

        PopupManager.success('Thành công!', 'Phòng chơi đã được tạo', { timer: 1500 });

        // Automatically enter GameScene as room creator
        console.log('MainMenuScene: Room created, entering GameScene as creator');
        try {
          if (this.scene && this.scene.start) {
            this.scene.start('GameScene', { roomId: response.roomId });
          } else {
            console.error('MainMenuScene: Scene manager not available for GameScene');
          }
        } catch (sceneError) {
          console.error('MainMenuScene: Error starting GameScene:', sceneError);
        }
      }
    } catch (error) {
      console.error('Failed to create room:', error);
      PopupManager.closeLoading();
      PopupManager.error('Lỗi tạo phòng', error.response?.data?.error || error.message || 'Không thể tạo phòng chơi');
    }
  }

  async quickJoin() {
    try {
      PopupManager.loading('Đang tìm phòng...');
      // Only find public rooms for quick join
      const response = await this.apiService.getRooms({
        status: 'waiting',
        limit: 1,
        isPrivate: false
      });
      PopupManager.closeLoading();

      if (response.games.length > 0) {
        const room = response.games[0];
        // Double check it's not private and not full
        if (!room.settings.isPrivate && room.players.length < room.settings.maxPlayers) {
          this.joinRoom(room.roomId);
        } else {
          // Try to find another room
          this.quickJoin();
        }
      } else {
        const result = await PopupManager.confirm(
          'Không có phòng trống',
          'Không tìm thấy phòng chơi công khai nào. Bạn có muốn tạo phòng mới không?',
          {
            confirmText: 'Tạo phòng mới',
            cancelText: 'Hủy'
          }
        );

        if (result.isConfirmed) {
          this.showCreateRoomDialog();
        }
      }
    } catch (error) {
      console.error('Quick join failed:', error);
      PopupManager.closeLoading();
      PopupManager.error('Lỗi', 'Không thể tìm phòng chơi. Vui lòng thử lại sau.');
    }
  }

  async handleJoinRoom(room) {
    try {
      if (room.settings.isPrivate) {
        // Ask for password
        const displayName = room.roomName || room.roomId;
        const { value: password } = await PopupManager.inputPassword({
          title: '🔒 Phòng riêng tư',
          text: `Phòng "${displayName}" yêu cầu mật khẩu.\nVui lòng nhập mật khẩu để vào phòng.`,
          inputPlaceholder: 'Nhập mật khẩu...',
          confirmButtonText: 'Vào phòng',
          cancelButtonText: 'Hủy'
        });

        if (!password) return; // User cancelled

        await this.joinRoom(room.roomId, password);
      } else {
        await this.joinRoom(room.roomId);
      }
    } catch (error) {
      console.error('Failed to handle join room:', error);
      PopupManager.error('Lỗi vào phòng', error.response?.data?.error || error.message || 'Không thể vào phòng chơi');
    }
  }

  async joinRoom(roomId, password = null) {
    try {
      PopupManager.loading('Đang vào phòng...');
      await this.apiService.joinRoom(roomId, password);
      PopupManager.closeLoading();

      console.log('MainMenuScene: Room joined, starting GameScene');
      PopupManager.success('Thành công!', 'Đã vào phòng chơi', { timer: 1500 });

      try {
        if (this.scene && this.scene.start) {
          this.scene.start('GameScene', { roomId });
        } else {
          console.error('MainMenuScene: Scene manager not available for GameScene');
        }
      } catch (sceneError) {
        console.error('MainMenuScene: Error starting GameScene:', sceneError);
      }
    } catch (error) {
      console.error('Failed to join room:', error);
      PopupManager.closeLoading();

      const errorMsg = error.response?.data?.error || error.message || 'Không thể vào phòng chơi';

      // Special handling for "already in room" error
      if (errorMsg.includes('already in another room')) {
        const currentRoom = error.response?.data?.currentRoom;
        const result = await PopupManager.confirm(
          'Đã ở phòng khác',
          `Bạn đang ở trong phòng "${currentRoom}". Bạn có muốn rời phòng hiện tại và vào phòng mới không?`,
          {
            confirmText: 'Rời phòng cũ',
            cancelText: 'Ở lại'
          }
        );

        if (result.isConfirmed && currentRoom) {
          try {
            await this.apiService.leaveRoom(currentRoom);
            // Try joining the new room again
            await this.joinRoom(roomId, password);
          } catch (leaveError) {
            console.error('Failed to leave current room:', leaveError);
            PopupManager.error('Lỗi', 'Không thể rời phòng hiện tại');
          }
        }
      } else {
        PopupManager.error('Lỗi vào phòng', errorMsg);
      }
    }
  }

  async showGameHistory() {
    try {
      PopupManager.loading('Đang tải lịch sử trận đấu...');
      const response = await this.apiService.getGameHistory({ limit: 10 });
      PopupManager.closeLoading();

      PopupManager.gameHistory(response.games);
    } catch (error) {
      console.error('Failed to load game history:', error);
      PopupManager.closeLoading();
      PopupManager.error('Lỗi', 'Không thể tải lịch sử trận đấu. Vui lòng thử lại sau.');
    }
  }

  async showLeaderboard() {
    try {
      PopupManager.loading('Đang tải bảng xếp hạng...');
      const response = await this.apiService.getLeaderboard(10);
      PopupManager.closeLoading();

      PopupManager.leaderboard(response.leaderboard);
    } catch (error) {
      console.error('Failed to load leaderboard:', error);
      PopupManager.closeLoading();
      PopupManager.error('Lỗi', 'Không thể tải bảng xếp hạng. Vui lòng thử lại sau.');
    }
  }

  // testGame method removed as requested

  setupSocketListeners() {
    this.socketService.on('roomUpdate', (data) => {
      this.loadRooms(); // Refresh rooms list
    });

    this.socketService.on('roomListUpdated', () => {
      console.log('🔄 Room list updated, refreshing...');
      this.loadRooms(); // Refresh rooms list
    });
  }

  async logout() {
    try {
      const result = await PopupManager.confirm(
        'Đăng xuất',
        'Bạn có chắc chắn muốn đăng xuất không?',
        {
          confirmText: 'Đăng xuất',
          cancelText: 'Hủy'
        }
      );

      if (result.isConfirmed) {
        PopupManager.loading('Đang đăng xuất...');

        try {
          // First try to leave any current room
          try {
            const user = this.apiService.getUser();
            if (user && user.currentRoom) {
              console.log('Leaving current room before logout:', user.currentRoom);
              await this.apiService.leaveRoom(user.currentRoom);
            }
          } catch (leaveError) {
            console.error('Error leaving room during logout:', leaveError);
            // Continue with logout even if leave room fails
          }

          // Then logout
          await this.apiService.logout();
        } catch (apiError) {
          console.error('API logout error:', apiError);
          // Continue with forced logout
        }

        // Disconnect socket and clear data
        this.socketService.disconnect();
        this.apiService.clearToken();
        PopupManager.closeLoading();

        PopupManager.success('Thành công!', 'Đã đăng xuất', { timer: 1500 });
        setTimeout(() => {
          try {
            if (this.scene && this.scene.start) {
              this.scene.start('LoginScene');
            } else {
              console.error('MainMenuScene: Scene manager not available for logout');
            }
          } catch (sceneError) {
            console.error('MainMenuScene: Error switching to LoginScene after logout:', sceneError);
          }
        }, 1500);
      }
    } catch (error) {
      console.error('Logout error:', error);
      PopupManager.closeLoading();
      PopupManager.error('Lỗi đăng xuất', 'Không thể đăng xuất. Vui lòng thử lại.');
    }
  }

  destroy() {
    // Cleanup socket listeners
    this.socketService.off('roomUpdate');
    this.socketService.disconnect();

    // Clear all children
    this.children.removeAll(true);

    super.destroy();
  }
}