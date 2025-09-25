// Authentication service for admin and driver login
import { API_CONFIG } from '../config/apiConfig';

class AuthService {
  // Test credentials
  static TEST_CREDENTIALS = {
    admin: {
      email: 'livadomc@gmail.com',
      password: 'admin'
    }
  };

  // Storage keys
  static STORAGE_KEYS = {
    IS_LOGGED_IN: 'isLoggedIn',
    USER_EMAIL: 'userEmail',
    USER_TYPE: 'userType',
    USER_ID: 'userId',
    LOGIN_TIME: 'loginTime'
  };

  /**
   * Authenticate user (admin or driver)
   * @param {string} email 
   * @param {string} password 
   * @returns {Promise<Object>} Authentication result
   */
  static async login(email, password) {
    try {
      console.log('AuthService.login called with:', { email, password });
      console.log('Admin credentials:', this.TEST_CREDENTIALS.admin);
      
      // First try admin login
      if (email === this.TEST_CREDENTIALS.admin.email && password === this.TEST_CREDENTIALS.admin.password) {
        console.log('Admin login successful');
        // Set authentication state for admin
        localStorage.setItem(this.STORAGE_KEYS.IS_LOGGED_IN, 'true');
        localStorage.setItem(this.STORAGE_KEYS.USER_EMAIL, email);
        localStorage.setItem(this.STORAGE_KEYS.USER_TYPE, 'admin');
        localStorage.setItem(this.STORAGE_KEYS.USER_ID, 'admin');
        localStorage.setItem(this.STORAGE_KEYS.LOGIN_TIME, new Date().toISOString());
        
        return {
          success: true,
          user: {
            email,
            role: 'admin',
            userType: 'admin',
            id: 'admin',
            loginTime: new Date().toISOString()
          }
        };
      }

      // Try driver login via API
      console.log('Trying driver authentication...');
      const driverResult = await this.authenticateDriver(email, password);
      if (driverResult.success) {
        console.log('Driver login successful');
        return driverResult;
      }

      console.log('Both admin and driver authentication failed');
      return {
        success: false,
        error: 'Invalid email or password'
      };
    } catch (error) {
      return {
        success: false,
        error: 'An error occurred during login'
      };
    }
  }

  /**
   * Authenticate driver via API
   * @param {string} email 
   * @param {string} password 
   * @returns {Promise<Object>} Authentication result
   */
  static async authenticateDriver(email, password) {
    try {
      console.log('authenticateDriver called with:', { email, password });
      
      // Use the proper authentication API endpoint
      const loginUrl = `${API_CONFIG.BASE_URL}/auth/login`;
      console.log('Login API URL:', loginUrl);
      
      const response = await fetch(loginUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email,
          password: password
        })
      });
      
      console.log('Login API Response status:', response.status);
      const data = await response.json();
      console.log('Login API Response data:', data);

      if (data.status === 'success' && data.user) {
        const user = data.user;
        
        // Check if the user is a driver
        if (user.user_type === 'driver') {
          // Set authentication state for driver
          localStorage.setItem(this.STORAGE_KEYS.IS_LOGGED_IN, 'true');
          localStorage.setItem(this.STORAGE_KEYS.USER_EMAIL, email);
          localStorage.setItem(this.STORAGE_KEYS.USER_TYPE, 'driver');
          localStorage.setItem(this.STORAGE_KEYS.USER_ID, user.id);
          localStorage.setItem(this.STORAGE_KEYS.LOGIN_TIME, new Date().toISOString());
          
          return {
            success: true,
            user: {
              id: user.id,
              email: user.email,
              firstName: user.first_name,
              lastName: user.last_name,
              phoneNumber: user.phone_number,
              role: 'driver',
              userType: 'driver',
              loginTime: new Date().toISOString()
            }
          };
        } else {
          return {
            success: false,
            error: 'Account is not a driver account'
          };
        }
      } else {
        return {
          success: false,
          error: data.message || 'Invalid email or password'
        };
      }
    } catch (error) {
      console.error('Driver authentication error:', error);
      return {
        success: false,
        error: 'Failed to authenticate driver'
      };
    }
  }

  /**
   * Logout current user
   */
  static logout() {
    localStorage.removeItem(this.STORAGE_KEYS.IS_LOGGED_IN);
    localStorage.removeItem(this.STORAGE_KEYS.USER_EMAIL);
    localStorage.removeItem(this.STORAGE_KEYS.USER_TYPE);
    localStorage.removeItem(this.STORAGE_KEYS.USER_ID);
    localStorage.removeItem(this.STORAGE_KEYS.LOGIN_TIME);
  }

  /**
   * Check if user is authenticated
   * @returns {boolean}
   */
  static isAuthenticated() {
    return localStorage.getItem(this.STORAGE_KEYS.IS_LOGGED_IN) === 'true';
  }

  /**
   * Get current user info
   * @returns {Object|null}
   */
  static getCurrentUser() {
    if (!this.isAuthenticated()) {
      return null;
    }

    const userType = localStorage.getItem(this.STORAGE_KEYS.USER_TYPE);
    return {
      email: localStorage.getItem(this.STORAGE_KEYS.USER_EMAIL),
      id: localStorage.getItem(this.STORAGE_KEYS.USER_ID),
      userType: userType,
      role: userType,
      loginTime: localStorage.getItem(this.STORAGE_KEYS.LOGIN_TIME)
    };
  }

  /**
   * Get current user type (admin or driver)
   * @returns {string|null}
   */
  static getUserType() {
    return localStorage.getItem(this.STORAGE_KEYS.USER_TYPE);
  }

  /**
   * Get current user ID
   * @returns {string|null}
   */
  static getUserId() {
    return localStorage.getItem(this.STORAGE_KEYS.USER_ID);
  }

  /**
   * Check if current user is admin
   * @returns {boolean}
   */
  static isAdmin() {
    return this.getUserType() === 'admin';
  }

  /**
   * Check if current user is driver
   * @returns {boolean}
   */
  static isDriver() {
    return this.getUserType() === 'driver';
  }

  /**
   * Check if session is still valid (optional session timeout)
   * @param {number} maxHours Maximum hours for session validity
   * @returns {boolean}
   */
  static isSessionValid(maxHours = 24) {
    if (!this.isAuthenticated()) {
      return false;
    }

    const loginTime = localStorage.getItem(this.STORAGE_KEYS.LOGIN_TIME);
    if (!loginTime) {
      return false;
    }

    const loginDate = new Date(loginTime);
    const now = new Date();
    const diffHours = (now - loginDate) / (1000 * 60 * 60);

    return diffHours < maxHours;
  }
}

export default AuthService;
