import { SignUpData, LoginData } from '../types/authentication';
import { API_CONFIG } from '../../config/apiConfig';

// Use dynamic API configuration
const API_BASE_URL = API_CONFIG.BASE_URL;

interface ApiResponse<T = any> {
  status: 'success' | 'error';
  message: string;
  data?: T;
  user_id?: number;
  user?: any;
}

class AuthService {
  private async makeRequest<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const url = `${API_BASE_URL}/${endpoint}`;
      
      const defaultOptions: RequestInit = {
        headers: {
          'Content-Type': 'application/json',
        },
        ...options,
      };

      if (__DEV__) {
        console.log('API Request:', url);
      }

      const response = await fetch(url, defaultOptions);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('API request failed:', error);
      return {
        status: 'error',
        message: error instanceof Error ? error.message : 'Network error occurred'
      };
    }
  }

  async register(userData: SignUpData): Promise<ApiResponse> {
    return this.makeRequest('register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async login(credentials: LoginData): Promise<ApiResponse> {
    // Support both email and username login
    const loginData = {
      [credentials.username.includes('@') ? 'email' : 'username']: credentials.username,
      password: credentials.password,
    };

    return this.makeRequest('login', {
      method: 'POST',
      body: JSON.stringify(loginData),
    });
  }

  async testConnection(): Promise<ApiResponse> {
    return this.makeRequest('test', {
      method: 'GET',
    });
  }
}

export const authService = new AuthService();
