import { useAuth0 } from '@auth0/auth0-react';

/**
 * Enhanced Auth0 Service for LakbAI Admin
 * Provides robust logout functionality and error handling
 */

class Auth0Service {
  /**
   * Enhanced logout function with multiple fallback strategies
   */
  static async logout() {
    try {
      // Clear all browser storage
      this.clearAllStorage();
      
      // Get Auth0 logout function
      const { logout } = useAuth0();
      
      // Try Auth0 logout with multiple returnTo options
      const returnToOptions = [
        'http://localhost:5173',
        'http://localhost:5173/',
        'http://127.0.0.1:5173',
        'http://127.0.0.1:5173/',
        window.location.origin,
        window.location.origin + '/'
      ];
      
      for (const returnTo of returnToOptions) {
        try {
          await logout({
            logoutParams: {
              returnTo,
              clientId: 'ysVIQhHKqNIFT1to9F0K40NuLh7xFvEN'
            }
          });
          console.log('Auth0 logout successful with returnTo:', returnTo);
          return;
        } catch (error) {
          console.warn(`Auth0 logout failed with returnTo ${returnTo}:`, error);
          continue;
        }
      }
      
      // If all Auth0 logout attempts fail, use manual redirect
      console.warn('All Auth0 logout attempts failed, using manual redirect');
      window.location.href = '/';
      
    } catch (error) {
      console.error('Logout error:', error);
      // Final fallback
      window.location.href = '/';
    }
  }
  
  /**
   * Clear all browser storage and cache
   */
  static clearAllStorage() {
    try {
      // Clear localStorage
      localStorage.clear();
      
      // Clear sessionStorage
      sessionStorage.clear();
      
      // Clear cookies
      document.cookie.split(";").forEach(function(c) { 
        document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); 
      });
      
      // Clear Auth0 cache
      if (window.caches) {
        window.caches.keys().then(names => {
          names.forEach(name => {
            window.caches.delete(name);
          });
        });
      }
      
      // Clear any Auth0 specific storage
      Object.keys(localStorage).forEach(key => {
        if (key.includes('auth0') || key.includes('auth')) {
          localStorage.removeItem(key);
        }
      });
      
      console.log('All storage cleared successfully');
    } catch (error) {
      console.warn('Error clearing storage:', error);
    }
  }
  
  /**
   * Force logout with manual redirect (bypasses Auth0)
   */
  static forceLogout() {
    this.clearAllStorage();
    window.location.href = '/';
  }
}

export default Auth0Service;
