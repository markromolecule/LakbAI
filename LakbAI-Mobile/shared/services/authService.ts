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
      // For traditional auth endpoints, we need to include the action in the request body
      // and call the base API URL
      const url = API_BASE_URL;
      
      // Add the action to the request body for traditional auth endpoints
      let requestBody = options.body;
      if (endpoint === 'register' || endpoint === 'login') {
        const bodyData = JSON.parse(options.body as string);
        bodyData.action = endpoint;
        requestBody = JSON.stringify(bodyData);
      }
      
      const defaultOptions: RequestInit = {
        headers: {
          'Content-Type': 'application/json',
        },
        ...options,
        body: requestBody,
      };

      if (__DEV__) {
        console.log('API Request:', url);
        console.log('Request Body:', requestBody);
      }

      // Add timeout to prevent hanging requests
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

      try {
        const response = await fetch(url, {
          ...defaultOptions,
          signal: controller.signal,
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        return data;
      } catch (fetchError: unknown) {
        clearTimeout(timeoutId);
        
        if (fetchError instanceof Error && fetchError.name === 'AbortError') {
          throw new Error('Request timeout - server not responding');
        }
        
        throw fetchError;
      }
    } catch (error) {
      console.error('API request failed:', error);
      
      // Provide more specific error messages
      let errorMessage = 'Network error occurred';
      
      if (error instanceof Error) {
        if (error.message.includes('timeout')) {
          errorMessage = 'Server not responding - please check your connection';
        } else if (error.message.includes('Network request failed')) {
          errorMessage = 'Cannot connect to server - please check your network';
        } else if (error.message.includes('fetch')) {
          errorMessage = 'Network request failed - please try again';
        } else {
          errorMessage = error.message;
        }
      }
      
      return {
        status: 'error',
        message: errorMessage
      };
    }
  }

  /**
   * Check if the backend server is reachable
   */
  async checkBackendConnectivity(): Promise<{ reachable: boolean; responseTime: number; error?: string }> {
    const startTime = Date.now();
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout for connectivity check
      
      try {
        const response = await fetch(API_BASE_URL, {
          method: 'HEAD', // Just check if server responds, don't download content
          signal: controller.signal,
        });
        
        clearTimeout(timeoutId);
        const responseTime = Date.now() - startTime;
        
        return {
          reachable: response.ok,
          responseTime,
        };
      } catch (fetchError: unknown) {
        clearTimeout(timeoutId);
        
        if (fetchError instanceof Error && fetchError.name === 'AbortError') {
          return {
            reachable: false,
            responseTime: Date.now() - startTime,
            error: 'Request timeout - server not responding'
          };
        }
        
        throw fetchError;
      }
    } catch (error) {
      const responseTime = Date.now() - startTime;
      
      return {
        reachable: false,
        responseTime,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Perform a health check on the backend server
   */
  async performHealthCheck(): Promise<{ status: string; message: string; data?: any }> {
    try {
      // Get the base URL without the specific route
      const baseUrl = API_BASE_URL.replace('/routes/api.php', '');
      const healthCheckUrl = `${baseUrl}/routes/health_check.php`;
      
      console.log('🔍 Testing health check at:', healthCheckUrl);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
      
      try {
        const response = await fetch(healthCheckUrl, {
          method: 'GET',
          signal: controller.signal,
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        return {
          status: 'ok',
          message: 'Health check successful',
          data
        };
      } catch (fetchError: unknown) {
        clearTimeout(timeoutId);
        
        if (fetchError instanceof Error && fetchError.name === 'AbortError') {
          throw new Error('Health check timeout - server not responding');
        }
        
        throw fetchError;
      }
    } catch (error) {
      console.error('Health check failed:', error);
      return {
        status: 'error',
        message: error instanceof Error ? error.message : 'Health check failed'
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
