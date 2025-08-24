// Authentication service for admin login
class AuthService {
  // Test credentials
  static TEST_CREDENTIALS = {
    email: 'livadomc@gmail.com',
    password: 'admin'
  };

  // Storage keys
  static STORAGE_KEYS = {
    IS_LOGGED_IN: 'isAdminLoggedIn',
    USER_EMAIL: 'adminEmail',
    LOGIN_TIME: 'adminLoginTime'
  };

  /**
   * Authenticate user with test credentials
   * @param {string} email 
   * @param {string} password 
   * @returns {Promise<Object>} Authentication result
   */
  static async login(email, password) {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    if (email === this.TEST_CREDENTIALS.email && password === this.TEST_CREDENTIALS.password) {
      // Set authentication state
      localStorage.setItem(this.STORAGE_KEYS.IS_LOGGED_IN, 'true');
      localStorage.setItem(this.STORAGE_KEYS.USER_EMAIL, email);
      localStorage.setItem(this.STORAGE_KEYS.LOGIN_TIME, new Date().toISOString());
      
      return {
        success: true,
        user: {
          email,
          role: 'admin',
          loginTime: new Date().toISOString()
        }
      };
    } else {
      return {
        success: false,
        error: 'Invalid email or password'
      };
    }
  }

  /**
   * Logout current user
   */
  static logout() {
    localStorage.removeItem(this.STORAGE_KEYS.IS_LOGGED_IN);
    localStorage.removeItem(this.STORAGE_KEYS.USER_EMAIL);
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

    return {
      email: localStorage.getItem(this.STORAGE_KEYS.USER_EMAIL),
      role: 'admin',
      loginTime: localStorage.getItem(this.STORAGE_KEYS.LOGIN_TIME)
    };
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
