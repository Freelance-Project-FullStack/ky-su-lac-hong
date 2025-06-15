// client/src/utils/PopupManager.js
import Swal from 'sweetalert2';

class PopupManager {
  constructor() {
    // Configure default SweetAlert2 theme
    this.defaultConfig = {
      customClass: {
        popup: 'ky-su-popup',
        title: 'ky-su-title',
        content: 'ky-su-content',
        confirmButton: 'ky-su-confirm-btn',
        cancelButton: 'ky-su-cancel-btn'
      },
      buttonsStyling: false,
      showClass: {
        popup: 'animate__animated animate__fadeInDown animate__faster'
      },
      hideClass: {
        popup: 'animate__animated animate__fadeOutUp animate__faster'
      }
    };
  }

  // Success popup
  success(title, text = '', options = {}) {
    return Swal.fire({
      ...this.defaultConfig,
      icon: 'success',
      title,
      text,
      confirmButtonText: 'OK',
      timer: options.timer || 3000,
      timerProgressBar: true,
      ...options
    });
  }

  // Error popup
  error(title, text = '', options = {}) {
    return Swal.fire({
      ...this.defaultConfig,
      icon: 'error',
      title,
      text,
      confirmButtonText: 'OK',
      ...options
    });
  }

  // Warning popup
  warning(title, text = '', options = {}) {
    return Swal.fire({
      ...this.defaultConfig,
      icon: 'warning',
      title,
      text,
      confirmButtonText: 'OK',
      ...options
    });
  }

  // Info popup
  info(title, text = '', options = {}) {
    return Swal.fire({
      ...this.defaultConfig,
      icon: 'info',
      title,
      text,
      confirmButtonText: 'OK',
      ...options
    });
  }

  // Confirmation popup
  confirm(title, text = '', options = {}) {
    return Swal.fire({
      ...this.defaultConfig,
      icon: 'question',
      title,
      text,
      showCancelButton: true,
      confirmButtonText: options.confirmText || 'Xác nhận',
      cancelButtonText: options.cancelText || 'Hủy',
      ...options
    });
  }

  // Custom popup with HTML content
  custom(options = {}) {
    return Swal.fire({
      ...this.defaultConfig,
      ...options
    });
  }

  // Loading popup
  loading(title = 'Đang xử lý...', text = '') {
    return Swal.fire({
      ...this.defaultConfig,
      title,
      text,
      allowOutsideClick: false,
      allowEscapeKey: false,
      showConfirmButton: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });
  }

  // Close loading popup
  closeLoading() {
    Swal.close();
  }

  // Toast notification (small popup at corner)
  toast(title, icon = 'success', position = 'top-end') {
    return Swal.fire({
      toast: true,
      position,
      icon,
      title,
      showConfirmButton: false,
      timer: 3000,
      timerProgressBar: true,
      customClass: {
        popup: 'ky-su-toast'
      }
    });
  }

  // Leaderboard popup with formatted content
  leaderboard(leaderboardData) {
    let content = '';
    
    if (leaderboardData.length === 0) {
      content = '<p class="no-data">Chưa có dữ liệu bảng xếp hạng</p>';
    } else {
      content = `
        <div class="leaderboard-container">
          <table class="leaderboard-table">
            <thead>
              <tr>
                <th>Hạng</th>
                <th>Người chơi</th>
                <th>Số trận</th>
                <th>Thắng</th>
                <th>Tỷ lệ thắng</th>
              </tr>
            </thead>
            <tbody>
              ${leaderboardData.map((player, index) => `
                <tr>
                  <td class="rank">${index + 1}</td>
                  <td class="player">${player.username}</td>
                  <td>${player.totalGames}</td>
                  <td>${player.totalWins}</td>
                  <td class="win-rate">${player.winRate.toFixed(1)}%</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `;
    }

    return this.custom({
      title: '🏆 Bảng Xếp Hạng',
      html: content,
      width: '600px',
      confirmButtonText: 'Đóng'
    });
  }

  // Game history popup
  gameHistory(historyData) {
    let content = '';
    
    if (historyData.length === 0) {
      content = '<p class="no-data">Chưa có lịch sử trận đấu</p>';
    } else {
      content = `
        <div class="history-container">
          ${historyData.map(game => `
            <div class="history-item">
              <div class="game-info">
                <span class="game-date">${new Date(game.createdAt).toLocaleDateString('vi-VN')}</span>
                <span class="game-status ${game.status}">${this.getGameStatusText(game.status)}</span>
              </div>
              <div class="game-details">
                <span>Người chơi: ${game.players.length}</span>
                ${game.winner ? `<span class="winner">Thắng: ${game.winner.username}</span>` : ''}
              </div>
            </div>
          `).join('')}
        </div>
      `;
    }

    return this.custom({
      title: '📜 Lịch Sử Trận Đấu',
      html: content,
      width: '500px',
      confirmButtonText: 'Đóng'
    });
  }

  getGameStatusText(status) {
    const statusMap = {
      'completed': 'Hoàn thành',
      'in_progress': 'Đang chơi',
      'waiting': 'Chờ người chơi',
      'cancelled': 'Đã hủy'
    };
    return statusMap[status] || status;
  }

  // Property purchase confirmation
  propertyPurchase(squareData) {
    return this.confirm(
      `Mua ${squareData.name}?`,
      `Giá: ${squareData.price.toLocaleString()} Vàng`,
      {
        confirmText: 'Mua',
        cancelText: 'Không mua',
        icon: 'question'
      }
    );
  }

  // Building construction confirmation
  buildingConstruction(buildingData) {
    return this.confirm(
      `Xây dựng ${buildingData.type}?`,
      `Giá: ${buildingData.cost.toLocaleString()} Vàng\nThu nhập: +${buildingData.income.toLocaleString()} Vàng/lượt`,
      {
        confirmText: 'Xây dựng',
        cancelText: 'Hủy',
        icon: 'question'
      }
    );
  }

  // Password input popup
  inputPassword(options = {}) {
    return Swal.fire({
      ...this.defaultConfig,
      icon: 'question',
      title: options.title || 'Nhập mật khẩu',
      text: options.text || '',
      input: 'password',
      inputPlaceholder: options.inputPlaceholder || 'Mật khẩu...',
      showCancelButton: true,
      confirmButtonText: options.confirmButtonText || 'OK',
      cancelButtonText: options.cancelButtonText || 'Hủy',
      inputValidator: (value) => {
        if (!value) {
          return 'Vui lòng nhập mật khẩu!';
        }
      },
      ...options
    });
  }

  // Room settings popup
  roomSettings(currentSettings = {}) {
    return Swal.fire({
      ...this.defaultConfig,
      title: '⚙️ Cài đặt phòng',
      html: `
        <div class="room-settings-form">
          <div class="form-group">
            <label for="roomName">Tên phòng:</label>
            <input type="text" id="roomName" class="swal2-input" value="${currentSettings.roomName || ''}" placeholder="Nhập tên phòng..." maxlength="30">
          </div>

          <div class="form-group">
            <label for="maxPlayers">Số người chơi tối đa:</label>
            <select id="maxPlayers" class="swal2-select">
              <option value="2" ${currentSettings.maxPlayers === 2 ? 'selected' : ''}>2 người</option>
              <option value="3" ${currentSettings.maxPlayers === 3 ? 'selected' : ''}>3 người</option>
              <option value="4" ${currentSettings.maxPlayers === 4 ? 'selected' : ''}>4 người</option>
            </select>
          </div>

          <div class="form-group">
            <label class="checkbox-label">
              <input type="checkbox" id="isPrivate" ${currentSettings.isPrivate ? 'checked' : ''}>
              <span class="checkmark"></span>
              Phòng riêng tư
            </label>
          </div>

          <div class="form-group" id="passwordGroup" style="display: ${currentSettings.isPrivate ? 'block' : 'none'}">
            <label for="password">Mật khẩu:</label>
            <input type="password" id="password" class="swal2-input" value="${currentSettings.password || ''}" placeholder="Nhập mật khẩu..." maxlength="20">
          </div>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: 'Cập nhật',
      cancelButtonText: 'Hủy',
      width: '400px',
      didOpen: () => {
        const isPrivateCheckbox = document.getElementById('isPrivate');
        const passwordGroup = document.getElementById('passwordGroup');

        isPrivateCheckbox.addEventListener('change', () => {
          passwordGroup.style.display = isPrivateCheckbox.checked ? 'block' : 'none';
        });
      },
      preConfirm: () => {
        const roomName = document.getElementById('roomName').value.trim();
        const maxPlayers = parseInt(document.getElementById('maxPlayers').value);
        const isPrivate = document.getElementById('isPrivate').checked;
        const password = document.getElementById('password').value.trim();

        if (!roomName) {
          Swal.showValidationMessage('Vui lòng nhập tên phòng');
          return false;
        }

        if (roomName.length < 3) {
          Swal.showValidationMessage('Tên phòng phải có ít nhất 3 ký tự');
          return false;
        }

        if (isPrivate && !password) {
          Swal.showValidationMessage('Vui lòng nhập mật khẩu cho phòng riêng tư');
          return false;
        }

        if (isPrivate && password.length < 4) {
          Swal.showValidationMessage('Mật khẩu phải có ít nhất 4 ký tự');
          return false;
        }

        const result = {
          roomName,
          maxPlayers,
          isPrivate
        };

        // Always include password field for validation
        if (isPrivate) {
          result.password = password;
        } else {
          result.password = '';
        }

        return result;
      }
    });
  }
}

// Export singleton instance
export default new PopupManager();
