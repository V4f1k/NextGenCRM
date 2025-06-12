import { 
  UserModel, 
  LoginRequest, 
  LoginResponse, 
  RegisterRequest, 
  RegisterResponse 
} from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';

export interface ChangePasswordData {
  old_password: string;
  new_password: string;
  new_password_confirm: string;
}

class AuthService {
  private baseURL = API_BASE_URL;

  // Token management
  getAccessToken(): string | null {
    return localStorage.getItem('access_token');
  }

  getRefreshToken(): string | null {
    return localStorage.getItem('refresh_token');
  }

  setTokens(accessToken: string, refreshToken: string): void {
    localStorage.setItem('access_token', accessToken);
    localStorage.setItem('refresh_token', refreshToken);
  }

  clearTokens(): void {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
  }

  // User management
  getCurrentUser(): UserModel | null {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  }

  setCurrentUser(user: UserModel): void {
    localStorage.setItem('user', JSON.stringify(user));
  }

  // Check if user is authenticated
  isAuthenticated(): boolean {
    const token = this.getAccessToken();
    return !!token && !this.isTokenExpired(token);
  }

  // Check if token is expired
  private isTokenExpired(token: string): boolean {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return Date.now() >= payload.exp * 1000;
    } catch {
      return true;
    }
  }

  // API request wrapper with auth
  private async apiRequest(endpoint: string, options: RequestInit = {}): Promise<Response> {
    const token = this.getAccessToken();
    
    const config: RequestInit = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
    };

    const response = await fetch(`${this.baseURL}${endpoint}`, config);

    // Handle token refresh if access token expired
    if (response.status === 401 && token) {
      const refreshed = await this.refreshAccessToken();
      if (refreshed) {
        // Retry with new token
        config.headers = {
          ...config.headers,
          Authorization: `Bearer ${this.getAccessToken()}`,
        };
        return fetch(`${this.baseURL}${endpoint}`, config);
      } else {
        // Refresh failed, redirect to login
        this.logout();
        window.location.href = '/login';
      }
    }

    return response;
  }

  // Login
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    const response = await fetch(`${this.baseURL}/auth/login/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Login failed');
    }

    const data: LoginResponse = await response.json();
    
    // Store tokens and user info
    this.setTokens(data.access, data.refresh);
    this.setCurrentUser(data.user);

    return data;
  }

  // Register
  async register(userData: RegisterRequest): Promise<RegisterResponse> {
    const response = await fetch(`${this.baseURL}/auth/register/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Registration failed');
    }

    const data: RegisterResponse = await response.json();
    
    // Store tokens and user info
    this.setTokens(data.access, data.refresh);
    this.setCurrentUser(data.user);

    return data;
  }

  // Refresh access token
  async refreshAccessToken(): Promise<boolean> {
    const refreshToken = this.getRefreshToken();
    
    if (!refreshToken) {
      return false;
    }

    try {
      const response = await fetch(`${this.baseURL}/auth/refresh/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refresh: refreshToken }),
      });

      if (!response.ok) {
        return false;
      }

      const data = await response.json();
      this.setTokens(data.access, refreshToken);
      return true;
    } catch {
      return false;
    }
  }

  // Logout
  async logout(): Promise<void> {
    const refreshToken = this.getRefreshToken();
    
    if (refreshToken) {
      try {
        await this.apiRequest('/auth/logout/', {
          method: 'POST',
          body: JSON.stringify({ refresh_token: refreshToken }),
        });
      } catch {
        // Ignore errors on logout
      }
    }

    this.clearTokens();
  }

  // Get user profile
  async getProfile(): Promise<UserModel> {
    const response = await this.apiRequest('/profile/');
    
    if (!response.ok) {
      throw new Error('Failed to fetch profile');
    }

    const user: UserModel = await response.json();
    this.setCurrentUser(user);
    return user;
  }

  // Update user profile
  async updateProfile(userData: Partial<UserModel>): Promise<UserModel> {
    const response = await this.apiRequest('/profile/', {
      method: 'PATCH',
      body: JSON.stringify(userData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Profile update failed');
    }

    const user: UserModel = await response.json();
    this.setCurrentUser(user);
    return user;
  }

  // Change password
  async changePassword(passwordData: ChangePasswordData): Promise<void> {
    const response = await this.apiRequest('/profile/change-password/', {
      method: 'PATCH',
      body: JSON.stringify(passwordData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Password change failed');
    }
  }

  // Verify token
  async verifyToken(): Promise<boolean> {
    const token = this.getAccessToken();
    
    if (!token) {
      return false;
    }

    try {
      const response = await fetch(`${this.baseURL}/auth/verify/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token }),
      });

      return response.ok;
    } catch {
      return false;
    }
  }
}

export const authService = new AuthService();