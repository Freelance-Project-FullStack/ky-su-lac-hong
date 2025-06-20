import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import MainMenu from './components/MainMenu.jsx';
import GameLobby from './components/GameLobby.jsx';
import GameRoom from './components/GameRoom.jsx';
import LoginForm from './components/LoginForm.jsx';
import RegisterForm from './components/RegisterForm.jsx';
import socketService from './services/SocketService';
import apiService from './services/ApiService';
import { GameBoardProvider } from './contexts/GameBoardContext.jsx';

const AppContainer = styled.div`
  width: 100%;
  min-height: 100vh;
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
`;

// Các trạng thái của ứng dụng
const APP_STATE = {
  LOGIN: 'LOGIN',
  REGISTER: 'REGISTER',
  MAIN_MENU: 'MAIN_MENU',
  LOBBY: 'LOBBY',
  GAME_ROOM: 'GAME_ROOM',
};

const App = () => {
  const [appState, setAppState] = useState(APP_STATE.LOGIN);
  const [roomId, setRoomId] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);

  // Kiểm tra trạng thái đăng nhập khi component mount
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        // Kiểm tra token trong localStorage
        if (apiService.isAuthenticated()) {
          const userData = apiService.getUser();
          if (userData) {
            setIsAuthenticated(true);
            setUser(userData);
            setAppState(APP_STATE.MAIN_MENU);
            
            // Kết nối socket sau khi xác thực thành công
            socketService.connect();
          } else {
            // Nếu có token nhưng không có user data, thử lấy thông tin user
            const response = await apiService.getCurrentUser();
            setIsAuthenticated(true);
            setUser(response.user);
            setAppState(APP_STATE.MAIN_MENU);
            
            // Kết nối socket sau khi xác thực thành công
            socketService.connect();
          }
        }
      } catch (error) {
        console.error('Auth check error:', error);
        // Nếu có lỗi xác thực, đưa người dùng về trang đăng nhập
        apiService.clearToken();
        setIsAuthenticated(false);
        setUser(null);
        setAppState(APP_STATE.LOGIN);
      }
    };
    
    checkAuthStatus();
    
    // Cleanup khi unmount
    return () => {
      socketService.disconnect();
    };
  }, []);

  // Xử lý đăng nhập
  const handleLogin = async (credentials) => {
    try {
      const response = await apiService.login(credentials);
      setIsAuthenticated(true);
      setUser(response.user);
      setAppState(APP_STATE.MAIN_MENU);
      
      // Kết nối socket sau khi đăng nhập thành công
      socketService.connect();
      
      return response;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };
  
  // Xử lý đăng ký
  const handleRegister = async (userData) => {
    try {
      const response = await apiService.register(userData);
      setIsAuthenticated(true);
      setUser(response.user);
      setAppState(APP_STATE.MAIN_MENU);
      
      // Kết nối socket sau khi đăng ký thành công
      socketService.connect();
      
      return response;
    } catch (error) {
      console.error('Register error:', error);
      throw error;
    }
  };
  
  // Xử lý đăng xuất
  const handleLogout = async () => {
    try {
      await apiService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setIsAuthenticated(false);
      setUser(null);
      setAppState(APP_STATE.LOGIN);
      socketService.disconnect();
    }
  };
  
  // Xử lý chơi với tư cách khách
  const handleGuestPlay = () => {
    setIsAuthenticated(false);
    setUser(null);
    setAppState(APP_STATE.MAIN_MENU);
    socketService.connect();
  };

  // Xử lý chuyển đổi màn hình
  const handleNavigate = (screen, data = {}) => {
    switch (screen) {
      case APP_STATE.LOGIN:
        setAppState(APP_STATE.LOGIN);
        break;
      case APP_STATE.REGISTER:
        setAppState(APP_STATE.REGISTER);
        break;
      case APP_STATE.MAIN_MENU:
        setAppState(APP_STATE.MAIN_MENU);
        break;
      case APP_STATE.LOBBY:
        setAppState(APP_STATE.LOBBY);
        break;
      case APP_STATE.GAME_ROOM:
        setRoomId(data.roomId);
        setAppState(APP_STATE.GAME_ROOM);
        break;
      default:
        setAppState(APP_STATE.MAIN_MENU);
    }
  };

  // Render màn hình tương ứng với trạng thái hiện tại
  const renderScreen = () => {
    switch (appState) {
      case APP_STATE.LOGIN:
        return <LoginForm onLogin={handleLogin} onRegister={() => handleNavigate(APP_STATE.REGISTER)} onGuestPlay={handleGuestPlay} />;
      case APP_STATE.REGISTER:
        return <RegisterForm onRegister={handleRegister} onBackToLogin={() => handleNavigate(APP_STATE.LOGIN)} />;
      case APP_STATE.MAIN_MENU:
        return <MainMenu onNavigate={handleNavigate} onLogout={handleLogout} user={user} />;
      case APP_STATE.LOBBY:
        return <GameLobby onNavigate={handleNavigate} user={user} />;
      case APP_STATE.GAME_ROOM:
        return (
          <GameBoardProvider>
            <GameRoom roomId={roomId} onNavigate={handleNavigate} user={user} />
          </GameBoardProvider>
        );
      default:
        return <LoginForm onLogin={handleLogin} onRegister={() => handleNavigate(APP_STATE.REGISTER)} onGuestPlay={handleGuestPlay} />;
    }
  };

  return (
    <AppContainer>
      {renderScreen()}
    </AppContainer>
  );
};

export default App;
