import axios from 'axios';

class ApiService {
  constructor() {
    this.baseURL = process.env.NODE_ENV === 'production' 
      ? '/api' 
      : 'http://localhost:3000/api';
    
    this.api = axios.create({
      baseURL: this.baseURL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    // Request interceptor to add auth token
    this.api.interceptors.request.use(
      (config) => {
        const token = this.getToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor to handle errors
    this.api.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          this.clearToken();
          // Don't redirect automatically, let the scene handle it
          console.log('ApiService: 401 error, token cleared');
        }
        return Promise.reject(error);
      }
    );
  }

  // Token management
  setToken(token) {
    localStorage.setItem('token', token);
  }

  getToken() {
    return localStorage.getItem('token');
  }

  clearToken() {
    localStorage.removeItem('token');
    localStorage.removeItem('user_data');
  }

  // User management
  setUser(user) {
    localStorage.setItem('user_data', JSON.stringify(user));
  }

  getUser() {
    const userData = localStorage.getItem('user_data');
    return userData ? JSON.parse(userData) : null;
  }

  isAuthenticated() {
    return !!this.getToken();
  }

  async verifyToken() {
    try {
      console.log('ApiService: Verifying token with URL:', `${this.baseURL}/auth/verify`);
      const response = await this.api.get('/auth/verify');
      console.log('ApiService: Token verification response:', response.data);
      return response.data;
    } catch (error) {
      console.error('ApiService: Token verification error:', error);
      console.error('ApiService: Error details:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
        url: error.config?.url
      });
      this.clearToken();
      return false;
    }
  }

  // Auth API calls
  async register(userData) {
    const response = await this.api.post('/auth/register', userData);
    if (response.data.token) {
      this.setToken(response.data.token);
      this.setUser(response.data.user);
    }
    return response.data;
  }

  async login(credentials) {
    const response = await this.api.post('/auth/login', credentials);
    if (response.data.token) {
      this.setToken(response.data.token);
      this.setUser(response.data.user);
    }
    return response.data;
  }

  async logout() {
    try {
      await this.api.post('/auth/logout');
    } finally {
      this.clearToken();
    }
  }

  async getCurrentUser() {
    const response = await this.api.get('/auth/me');
    this.setUser(response.data.user);
    return response.data;
  }

  async updateProfile(profileData) {
    const response = await this.api.put('/auth/profile', profileData);
    this.setUser(response.data.user);
    return response.data;
  }

  async checkUsername(username) {
    const response = await this.api.get(`/auth/check-username/${username}`);
    return response.data;
  }

  // Game API calls
  async getRooms(params = {}) {
    const response = await this.api.get('/game/rooms', { params });
    return response.data;
  }

  async createRoom(roomData) {
    const response = await this.api.post('/game/rooms', roomData);
    return response.data;
  }

  async getRoom(roomId) {
    const response = await this.api.get(`/game/rooms/${roomId}`);
    return response.data;
  }

  async joinRoom(roomId, password = null) {
    const body = {};
    if (password) {
      body.password = password;
    }
    const response = await this.api.post(`/game/rooms/${roomId}/join`, body);
    return response.data;
  }

  async leaveRoom(roomId) {
    const response = await this.api.post(`/game/rooms/${roomId}/leave`);
    return response.data;
  }

  async updateRoom(roomId, roomData) {
    const response = await this.api.put(`/game/rooms/${roomId}`, roomData);
    return response.data;
  }

  async closeRoom(roomId) {
    const response = await this.api.delete(`/game/rooms/${roomId}`);
    return response.data;
  }

  async getGameHistory(params = {}) {
    const response = await this.api.get('/game/history', { params });
    return response.data;
  }

  async getLeaderboard(limit = 10) {
    const response = await this.api.get('/game/leaderboard', { 
      params: { limit } 
    });
    return response.data;
  }

  async getHealthCheck() {
    const response = await this.api.get('/health');
    return response.data;
  }
}

export default new ApiService();
