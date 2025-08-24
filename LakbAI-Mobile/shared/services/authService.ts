import { SignUpData, LoginData } from '../types/authentication';
import { API_CONFIG } from '../../config/apiConfig';

/**
 * Authentication Service
 * 
 * Test User for Debugging:
 * - Username: livado
 * - Password: livado123
 * - User Type: driver
 * - Purpose: Redirects to driver screen for testing
 */

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
    // Test user for debugging - redirects to driver screen
    if (credentials.username === 'livado' && credentials.password === 'Livado123') {
      console.log('Test user login detected - redirecting to driver screen');
      return {
        status: 'success',
        message: 'Test user login successful',
        user: {
          id: 999,
          username: 'livado',
          email: 'livado@test.com',
          user_type: 'driver',
          first_name: 'Test',
          last_name: 'Driver',
          phone_number: '+639123456789',
          gender: 'Male',
          birthday: '1990-01-01',
          house_number: '123',
          street_name: 'Test Street',
          barangay: 'Test Barangay',
          city_municipality: 'Test City',
          province: 'Test Province',
          postal_code: '1234'
        }
      };
    }

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
