import { useCallback } from 'react';
import apiService from '../services/ApiService';

export const useApi = () => {
  // Auth actions
  const handleRegister = useCallback(async (userData) => {
    try {
      const response = await apiService.register(userData);
      return response;
    } catch (error) {
      console.error('Register error:', error);
      throw error;
    }
  }, []);

  const handleLogin = useCallback(async (credentials) => {
    try {
      const response = await apiService.login(credentials);
      return response;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }, []);

  const handleLogout = useCallback(async () => {
    try {
      await apiService.logout();
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  }, []);

  const handleUpdateProfile = useCallback(async (profileData) => {
    try {
      const response = await apiService.updateProfile(profileData);
      return response;
    } catch (error) {
      console.error('Update profile error:', error);
      throw error;
    }
  }, []);

  const handleCheckUsername = useCallback(async (username) => {
    try {
      const response = await apiService.checkUsername(username);
      return response;
    } catch (error) {
      console.error('Check username error:', error);
      throw error;
    }
  }, []);

  // Game actions
  const handleGetRooms = useCallback(async (params = {}) => {
    try {
      const response = await apiService.getRooms(params);
      return response;
    } catch (error) {
      console.error('Get rooms error:', error);
      throw error;
    }
  }, []);

  const handleCreateRoom = useCallback(async (roomData) => {
    try {
      const response = await apiService.createRoom(roomData);
      return response;
    } catch (error) {
      console.error('Create room error:', error);
      throw error;
    }
  }, []);

  const handleGetRoom = useCallback(async (roomId) => {
    try {
      const response = await apiService.getRoom(roomId);
      return response;
    } catch (error) {
      console.error('Get room error:', error);
      throw error;
    }
  }, []);

  const handleJoinRoom = useCallback(async (roomId, password) => {
    try {
      const response = await apiService.joinRoom(roomId, password);
      return response;
    } catch (error) {
      console.error('Join room error:', error);
      throw error;
    }
  }, []);

  const handleLeaveRoom = useCallback(async (roomId) => {
    try {
      const response = await apiService.leaveRoom(roomId);
      return response;
    } catch (error) {
      console.error('Leave room error:', error);
      throw error;
    }
  }, []);

  const handleUpdateRoom = useCallback(async (roomId, roomData) => {
    try {
      const response = await apiService.updateRoom(roomId, roomData);
      return response;
    } catch (error) {
      console.error('Update room error:', error);
      throw error;
    }
  }, []);

  const handleCloseRoom = useCallback(async (roomId) => {
    try {
      const response = await apiService.closeRoom(roomId);
      return response;
    } catch (error) {
      console.error('Close room error:', error);
      throw error;
    }
  }, []);

  const handleGetGameHistory = useCallback(async (params = {}) => {
    try {
      const response = await apiService.getGameHistory(params);
      return response;
    } catch (error) {
      console.error('Get game history error:', error);
      throw error;
    }
  }, []);

  const handleGetLeaderboard = useCallback(async (limit = 10) => {
    try {
      const response = await apiService.getLeaderboard(limit);
      return response;
    } catch (error) {
      console.error('Get leaderboard error:', error);
      throw error;
    }
  }, []);

  return {
    // Auth actions
    handleRegister,
    handleLogin,
    handleLogout,
    handleUpdateProfile,
    handleCheckUsername,

    // Game actions
    handleGetRooms,
    handleCreateRoom,
    handleGetRoom,
    handleJoinRoom,
    handleLeaveRoom,
    handleUpdateRoom,
    handleCloseRoom,
    handleGetGameHistory,
    handleGetLeaderboard,

    // Helper methods
    isAuthenticated: apiService.isAuthenticated,
    getCurrentUser: apiService.getCurrentUser,
    getUser: apiService.getUser,
  };
};
