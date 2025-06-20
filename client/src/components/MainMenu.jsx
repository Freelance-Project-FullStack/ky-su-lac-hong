import React, { useState } from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { useApi } from '../hooks/useApi';
import { useSocket } from '../hooks/useSocket';
import { APP_STATE } from '../constants/appStates';
import Swal from 'sweetalert2';

const MenuContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  padding: 2rem;
`;

const Title = styled(motion.h1)`
  color: #e94560;
  font-size: 3rem;
  margin-bottom: 2rem;
  text-align: center;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
`;

const MenuButton = styled(motion.button)`
  background: #0f3460;
  color: white;
  border: none;
  padding: 1rem 2rem;
  margin: 0.5rem;
  border-radius: 8px;
  font-size: 1.2rem;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);

  &:hover {
    background: #e94560;
    transform: translateY(-2px);
    box-shadow: 0 6px 8px rgba(0, 0, 0, 0.2);
  }
`;

const buttonVariants = {
  hover: {
    scale: 1.05,
    transition: {
      duration: 0.2
    }
  },
  tap: {
    scale: 0.95
  }
};

const MainMenu = ({ onNavigate, onLogout, user }) => {
  const { handleCreateRoom: apiCreateRoom } = useApi();
  const { handleJoinRoom } = useSocket();
  const [isCreatingRoom, setIsCreatingRoom] = useState(false);
  const [isJoiningRoom, setIsJoiningRoom] = useState(false);

  return (
    <MenuContainer>
      <Title
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        Ký Sử Lạc Hồng
      </Title>

      <MenuButton
        variants={buttonVariants}
        whileHover="hover"
        whileTap="tap"
        onClick={() => {
          // Kiểm tra xem người dùng đã đăng nhập chưa
          if (!user && !apiService.isAuthenticated()) {
            Swal.fire({
              icon: 'warning',
              title: 'Cần đăng nhập',
              text: 'Bạn cần đăng nhập để tạo phòng mới.',
              confirmButtonText: 'Đăng nhập',
              showCancelButton: true,
              cancelButtonText: 'Hủy'
            }).then((result) => {
              if (result.isConfirmed) {
                onNavigate(APP_STATE.LOGIN);
              }
            });
            return;
          }
          
          // Hiển thị hộp thoại nhập thông tin tạo phòng
          Swal.fire({
            title: 'Tạo phòng mới',
            html: `
              <div style="margin-bottom: 15px;">
                <label for="room-name" style="display: block; text-align: left; margin-bottom: 5px;">Tên phòng:</label>
                <input id="room-name" class="swal2-input" placeholder="Tên phòng">
              </div>
              <div style="margin-bottom: 15px;">
                <label for="max-players" style="display: block; text-align: left; margin-bottom: 5px;">Số lượng người chơi:</label>
                <select id="max-players" class="swal2-select">
                  <option value="2">2 người chơi</option>
                  <option value="3">3 người chơi</option>
                  <option value="4">4 người chơi</option>
                </select>
              </div>
              <div style="margin-bottom: 15px;">
                <label style="display: block; text-align: left; margin-bottom: 5px;">Loại phòng:</label>
                <div style="display: flex; gap: 15px;">
                  <label style="display: flex; align-items: center; cursor: pointer;">
                    <input type="radio" name="room-type" value="public" checked style="margin-right: 5px;"> Công khai
                  </label>
                  <label style="display: flex; align-items: center; cursor: pointer;">
                    <input type="radio" name="room-type" value="private" style="margin-right: 5px;"> Riêng tư
                  </label>
                </div>
              </div>
              <div id="password-container" style="margin-bottom: 15px; display: none;">
                <label for="room-password" style="display: block; text-align: left; margin-bottom: 5px;">Mật khẩu phòng:</label>
                <input id="room-password" type="password" class="swal2-input" placeholder="Mật khẩu">
              </div>
            `,
            showCancelButton: true,
            confirmButtonText: 'Tạo phòng',
            cancelButtonText: 'Hủy',
            didOpen: () => {
              // Hiển thị/ẩn trường mật khẩu khi chọn loại phòng
              const privateRadio = document.querySelector('input[name="room-type"][value="private"]');
              const publicRadio = document.querySelector('input[name="room-type"][value="public"]');
              const passwordContainer = document.getElementById('password-container');
              
              privateRadio.addEventListener('change', () => {
                passwordContainer.style.display = 'block';
              });
              
              publicRadio.addEventListener('change', () => {
                passwordContainer.style.display = 'none';
              });
            },
            preConfirm: () => {
              const roomName = document.getElementById('room-name').value;
              const maxPlayers = parseInt(document.getElementById('max-players').value);
              const isPrivate = document.querySelector('input[name="room-type"][value="private"]').checked;
              const password = document.getElementById('room-password').value;
              
              if (!roomName) {
                Swal.showValidationMessage('Vui lòng nhập tên phòng!');
                return false;
              }
              
              if (isPrivate && !password) {
                Swal.showValidationMessage('Vui lòng nhập mật khẩu cho phòng riêng tư!');
                return false;
              }
              
              return { 
                roomName, 
                maxPlayers, 
                isPrivate, 
                password: isPrivate ? password : null 
              };
            }
          }).then((result) => {
            if (result.isConfirmed) {
              setIsCreatingRoom(true);
              const { roomName, maxPlayers, isPrivate, password } = result.value;
              
              console.log('Tạo phòng:', {
                roomName,
                maxPlayers,
                isPrivate,
                hasPassword: !!password
              });
              
              // Log chi tiết dữ liệu trước khi gửi API
              console.log('Dữ liệu gửi đi:', {
                roomName,
                maxPlayers,
                isPrivate,
                password
              });
              
              // Gọi API tạo phòng
              apiCreateRoom({
                roomName,
                maxPlayers,
                isPrivate,
                password
              }).then(response => {
                console.log('Phòng đã được tạo:', response);
                setIsCreatingRoom(false);
                
                // Chuyển đến màn hình phòng chơi
                onNavigate(APP_STATE.GAME_ROOM, { roomId: response.room.roomId });
              }).catch(error => {
                console.error('Lỗi khi tạo phòng:', error);
                console.error('Chi tiết lỗi:', {
                  status: error.response?.status,
                  data: error.response?.data,
                  message: error.response?.data?.message,
                  error: error.message
                });
                setIsCreatingRoom(false);
                Swal.fire({
                  icon: 'error',
                  title: 'Lỗi',
                  text: error.response?.data?.message || 'Không thể tạo phòng. Vui lòng thử lại sau.'
                });
              });
            }
          });
        }}
        disabled={isCreatingRoom}
      >
        {isCreatingRoom ? 'Đang tạo phòng...' : 'Tạo phòng mới'}
      </MenuButton>

      <MenuButton
        variants={buttonVariants}
        whileHover="hover"
        whileTap="tap"
        onClick={() => {
          // Hiển thị hộp thoại nhập mã phòng và tên người chơi
          Swal.fire({
            title: 'Tham gia phòng',
            html: `
              <div style="margin-bottom: 15px;">
                <label for="room-id" style="display: block; text-align: left; margin-bottom: 5px;">Mã phòng:</label>
                <input id="room-id" class="swal2-input" placeholder="Mã phòng">
              </div>
              <div style="margin-bottom: 15px;">
                <label for="player-name" style="display: block; text-align: left; margin-bottom: 5px;">Tên người chơi:</label>
                <input id="player-name" class="swal2-input" placeholder="Tên người chơi">
              </div>
            `,
            showCancelButton: true,
            confirmButtonText: 'Tham gia',
            cancelButtonText: 'Hủy',
            preConfirm: () => {
              const roomId = document.getElementById('room-id').value;
              const playerName = document.getElementById('player-name').value;
              if (!roomId) {
                Swal.showValidationMessage('Vui lòng nhập mã phòng!');
                return false;
              }
              if (!playerName) {
                Swal.showValidationMessage('Vui lòng nhập tên người chơi!');
                return false;
              }
              return { roomId, playerName };
            }
          }).then((result) => {
            if (result.isConfirmed) {
              setIsJoiningRoom(true);
              const { roomId, playerName } = result.value;
              console.log('Tham gia phòng:', roomId, 'với tên:', playerName);
              
              // Gọi API tham gia phòng
              handleJoinRoom(roomId, playerName);
              
              // Lắng nghe sự kiện tham gia phòng thành công
              const onJoinedRoom = (roomData) => {
                console.log('Đã tham gia phòng:', roomData);
                setIsJoiningRoom(false);
                
                // Chuyển đến màn hình phòng chơi
                onNavigate(APP_STATE.GAME_ROOM, { roomId: roomData.roomId });
                
                // Hủy lắng nghe sự kiện
                socketService.off('joinedRoom', onJoinedRoom);
              };
              
              // Đăng ký lắng nghe sự kiện
              socketService.on('joinedRoom', onJoinedRoom);
            }
          });
        }}
        disabled={isJoiningRoom}
      >
        {isJoiningRoom ? 'Đang tham gia...' : 'Tham gia phòng'}
      </MenuButton>

    <MenuButton
      variants={buttonVariants}
      whileHover="hover"
      whileTap="tap"
      onClick={() => {
        // Hiển thị hộp thoại nhập mã phòng và tên người chơi
        Swal.fire({
          title: 'Tham gia phòng',
          html: `
            <div style="margin-bottom: 15px;">
              <label for="room-id" style="display: block; text-align: left; margin-bottom: 5px;">Mã phòng:</label>
              <input id="room-id" class="swal2-input" placeholder="Mã phòng">
            </div>
            <div style="margin-bottom: 15px;">
              <label for="player-name" style="display: block; text-align: left; margin-bottom: 5px;">Tên người chơi:</label>
              <input id="player-name" class="swal2-input" placeholder="Tên người chơi">
            </div>
          `,
          showCancelButton: true,
          confirmButtonText: 'Tham gia',
          cancelButtonText: 'Hủy',
          preConfirm: () => {
            const roomId = document.getElementById('room-id').value;
            const playerName = document.getElementById('player-name').value;
            if (!roomId) {
              Swal.showValidationMessage('Vui lòng nhập mã phòng!');
              return false;
            }
            if (!playerName) {
              Swal.showValidationMessage('Vui lòng nhập tên người chơi!');
              return false;
            }
            return { roomId, playerName };
          }
        }).then((result) => {
          if (result.isConfirmed) {
            setIsJoiningRoom(true);
            const { roomId, playerName } = result.value;
            console.log('Tham gia phòng:', roomId, 'với tên:', playerName);
            
            // Gọi API tham gia phòng
            handleJoinRoom(roomId, playerName);
            
            // Lắng nghe sự kiện tham gia phòng thành công
            const onJoinedRoom = (roomData) => {
              console.log('Đã tham gia phòng:', roomData);
              setIsJoiningRoom(false);
              
              // Chuyển đến màn hình phòng chơi
              onNavigate(APP_STATE.GAME_ROOM, { roomId: roomData.roomId });
              
              // Hủy lắng nghe sự kiện
              socketService.off('joinedRoom', onJoinedRoom);
            };
            
            // Đăng ký lắng nghe sự kiện
            socketService.on('joinedRoom', onJoinedRoom);
          }
        });
      }}
      disabled={isJoiningRoom}
    >
      {isJoiningRoom ? 'Đang tham gia...' : 'Tham gia phòng'}
    </MenuButton>

    <MenuButton
      variants={buttonVariants}
      whileHover="hover"
      whileTap="tap"
      onClick={() => {/* TODO: Implement tutorial */}}
    >
      Hướng dẫn
    </MenuButton>
    <MenuButton
      variants={buttonVariants}
      whileHover="hover"
      whileTap="tap"
      onClick={() => {/* TODO: Implement settings */}}
    >
      Cài đặt
    </MenuButton>
    
    <MenuButton
      variants={buttonVariants}
      whileHover="hover"
      whileTap="tap"
      style={{ backgroundColor: '#ff6b6b' }}
      onClick={() => onNavigate(APP_STATE.GAME_ROOM, { roomId: 'test-room-123' })}
    >
      Test Màn Hình Chơi
    </MenuButton>
    </MenuContainer>
  );
};

export default MainMenu;
