/**
 * Utility functions for authentication management
 */

/**
 * Clears all Auth0-related data from browser storage
 */
export const clearAuth0Data = () => {
  // Clear Auth0 tokens from localStorage
  const auth0Keys = Object.keys(localStorage).filter(key => 
    key.startsWith('auth0') || 
    key.includes('auth0') || 
    key.includes('token') ||
    key.includes('refresh') ||
    key.includes('access_token') ||
    key.includes('id_token')
  );
  auth0Keys.forEach(key => localStorage.removeItem(key));
  
  // Clear Auth0 app state and context, but preserve driver context if it exists
  const auth0AppState = localStorage.getItem('auth0_app_state');
  if (auth0AppState) {
    try {
      const parsedState = JSON.parse(auth0AppState);
      if (parsedState.driverContext && parsedState.driverContext.type === 'driver_signup') {
        console.log('🔄 Preserving driver context in auth0_app_state during clearAuth0Data');
        // Don't clear auth0_app_state if it contains driver context
      } else {
        localStorage.removeItem('auth0_app_state');
      }
    } catch (e) {
      // If we can't parse the state, clear it to be safe
      localStorage.removeItem('auth0_app_state');
    }
  }
  
  localStorage.removeItem('driver_signup_context');
  
  // Don't clear our custom driver signup key
  // localStorage.removeItem('lakbai_driver_signup');
  
  localStorage.removeItem('auth0_redirect_uri');
  localStorage.removeItem('auth0_state');
  
  // Clear sessionStorage
  sessionStorage.clear();
  
  // Clear all cookies
  document.cookie.split(";").forEach(function(c) { 
    document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); 
  });
  
  // Clear browser cache
  if (window.caches) {
    window.caches.keys().then(names => {
      names.forEach(name => {
        window.caches.delete(name);
      });
    });
  }
};

/**
 * Clears all admin authentication data
 */
export const clearAdminData = () => {
  localStorage.removeItem('adminEmail');
  localStorage.removeItem('adminName');
  localStorage.removeItem('adminAuthenticated');
  localStorage.removeItem('adminLoginTime');
};

/**
 * Clears all authentication data (both Auth0 and admin)
 */
export const clearAllAuthData = () => {
  clearAuth0Data();
  clearAdminData();
};

/**
 * Clears driver signup context specifically
 */
export const clearDriverSignupContext = () => {
  const context = localStorage.getItem('driver_signup_context');
  if (context) {
    console.log('🗑️ Clearing driver signup context:', JSON.parse(context));
  }

  // Check if auth0_app_state contains driver context before clearing
  const auth0AppState = localStorage.getItem('auth0_app_state');
  if (auth0AppState) {
    try {
      const parsedState = JSON.parse(auth0AppState);
      if (parsedState.driverContext && parsedState.driverContext.type === 'driver_signup') {
        console.log('🔄 Preserving driver context in auth0_app_state during clearDriverSignupContext');
        // Don't clear auth0_app_state if it contains driver context
      } else {
        localStorage.removeItem('auth0_app_state');
        console.log('🗑️ Cleared auth0_app_state (no driver context found)');
      }
    } catch (e) {
      console.log('❌ Error parsing auth0_app_state during clearDriverSignupContext:', e);
      localStorage.removeItem('auth0_app_state');
    }
  }

  localStorage.removeItem('driver_signup_context');

  // Don't clear our custom key as it's our primary fallback
  // localStorage.removeItem('lakbai_driver_signup');

  console.log('Driver signup context cleared (preserving lakbai_driver_signup key)');
};

// New function to completely clear driver signup context after profile completion
export const clearDriverSignupContextCompletely = () => {
  console.log('🗑️ Completely clearing all driver signup context after profile completion');
  
  localStorage.removeItem('lakbai_driver_signup');
  localStorage.removeItem('driver_signup_context');
  localStorage.removeItem('auth0_app_state');
  
  console.log('✅ All driver signup context cleared completely');
};

/**
 * Clears all signup and authentication context
 */
export const clearAllSignupContext = () => {
  // Don't clear driver signup context if it was just set (within last 5 seconds)
  const driverSignupContext = JSON.parse(localStorage.getItem('driver_signup_context') || '{}');
  if (driverSignupContext.timestamp && (Date.now() - driverSignupContext.timestamp) < 5000) {
    console.log('🔄 Preserving recent driver signup context during clearAllSignupContext');
  } else {
    clearDriverSignupContext();
  }
  
  // Don't clear our custom key as it's our primary fallback
  // localStorage.removeItem('lakbai_driver_signup');
  
  localStorage.removeItem('auth0_redirect_uri');
  localStorage.removeItem('auth0_state');
  sessionStorage.clear();
};

/**
 * Validates and clears stale Auth0 state
 */
export const validateAndClearAuth0State = () => {
  try {
    // Check for stale state (older than 10 minutes)
    const stateTimestamp = localStorage.getItem('auth0_state_timestamp');
    if (stateTimestamp) {
      const stateAge = Date.now() - parseInt(stateTimestamp);
      if (stateAge > 600000) { // 10 minutes
        console.log('Clearing stale Auth0 state');
        clearAllSignupContext();
        return false;
      }
    }
    return true;
  } catch (error) {
    console.error('Error validating Auth0 state:', error);
    clearAllSignupContext();
    return false;
  }
};

/**
 * Sets Auth0 state timestamp for validation
 */
export const setAuth0StateTimestamp = () => {
  localStorage.setItem('auth0_state_timestamp', Date.now().toString());
};

/**
 * Checks if user is authenticated via traditional admin login
 */
export const isTraditionalAdminAuthenticated = () => {
  return localStorage.getItem('adminAuthenticated') === 'true';
};

/**
 * Gets admin user info from localStorage
 */
export const getAdminUserInfo = () => {
  return {
    email: localStorage.getItem('adminEmail'),
    name: localStorage.getItem('adminName'),
    loginTime: localStorage.getItem('adminLoginTime')
  };
};

/**
 * Handles logout with proper Auth0 cleanup
 */
export const handleLogout = (isAuthenticated, auth0Logout, navigate) => {
  console.log('=== ADMIN LOGOUT START ===');
  
  // Clear all authentication data first
  clearAllAuthData();
  
  // Force Auth0 logout if user is authenticated via Auth0
  if (isAuthenticated) {
    try {
      console.log('Performing Auth0 logout...');
      auth0Logout({
        logoutParams: {
          returnTo: 'http://localhost:5173',
          clientId: 'ysVIQhHKqNIFT1to9F0K40NuLh7xFvEN'
        }
      });
      console.log('Auth0 logout initiated successfully');
    } catch (error) {
      console.error('Auth0 logout error:', error);
      // Fallback: manual redirect
      console.log('Fallback: manual redirect to admin login');
      window.location.href = '/admin-login';
    }
  } else {
    // Traditional logout - just redirect
    console.log('Traditional logout: redirecting to admin login');
    navigate('/admin-login');
  }
  
  console.log('=== ADMIN LOGOUT COMPLETE ===');
};

/**
 * Forces a completely fresh session by clearing everything
 */
export const forceFreshSession = () => {
  console.log('Forcing fresh session...');
  
  try {
    // Clear all Auth0 data
    clearAuth0Data();
    
    // Clear all admin data
    clearAdminData();
    
    // Clear any remaining keys
    const allKeys = Object.keys(localStorage);
    allKeys.forEach(key => {
      if (key.includes('auth0') || 
          key.includes('token') || 
          key.includes('session') ||
          key.includes('state') ||
          key.includes('context') ||
          key.includes('user') ||
          key.includes('login')) {
        console.log('Removing key:', key);
        localStorage.removeItem(key);
      }
    });
    
    // Clear sessionStorage
    sessionStorage.clear();
    
    // Clear cookies more aggressively
    const cookies = document.cookie.split(";");
    cookies.forEach(cookie => {
      const eqPos = cookie.indexOf("=");
      const name = eqPos > -1 ? cookie.substr(0, eqPos) : cookie;
      document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/";
      document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=" + window.location.hostname;
      document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=." + window.location.hostname;
    });
    
    // Clear IndexedDB for Auth0
    if (window.indexedDB) {
      const request = window.indexedDB.deleteDatabase('auth0');
      request.onsuccess = () => console.log('IndexedDB cleared');
      request.onerror = () => console.log('IndexedDB clear failed');
    }
    
    console.log('Fresh session established');
    
    // Reload the page to ensure clean state
    window.location.reload();
    
  } catch (error) {
    console.error('Error clearing session:', error);
    // Fallback: just reload the page
    window.location.reload();
  }
};

/**
 * Forces a fresh session specifically for driver signup
 * This ensures no previous authentication state interferes with new signups
 */
export const forceFreshDriverSignupSession = () => {
  console.log('=== FORCING FRESH DRIVER SIGNUP SESSION ===');
  
  try {
    // Clear all authentication data
    clearAllAuthData();
    
    // Clear any remaining keys that might interfere, but PRESERVE driver_signup_context
    const allKeys = Object.keys(localStorage);
    allKeys.forEach(key => {
      if (key.includes('auth0') || 
          key.includes('token') || 
          key.includes('session') ||
          key.includes('state') ||
          (key.includes('context') && key !== 'driver_signup_context') || // Preserve driver signup context
          key.includes('user') ||
          key.includes('login') ||
          (key.includes('signup') && key !== 'driver_signup_context')) { // Preserve driver signup context
        console.log('Removing key for fresh driver signup:', key);
        localStorage.removeItem(key);
      } else {
        console.log('Preserving key for driver signup:', key);
      }
    });
    
    // Clear sessionStorage
    sessionStorage.clear();
    
    // Clear cookies
    const cookies = document.cookie.split(";");
    cookies.forEach(cookie => {
      const eqPos = cookie.indexOf("=");
      const name = eqPos > -1 ? cookie.substr(0, eqPos) : cookie;
      document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/";
    });
    
    console.log('Fresh driver signup session established');
    
  } catch (error) {
    console.error('Error clearing driver signup session:', error);
  }
};

/**
 * Manual session clearing function (can be called from browser console)
 */
export const manualSessionClear = () => {
  console.log('Manual session clear initiated...');
  forceFreshSession();
};

// Make it available globally for manual use
if (typeof window !== 'undefined') {
  window.manualSessionClear = manualSessionClear;
  window.forceFreshSession = forceFreshSession;
}

// Separate storage namespaces for admin vs driver flows
const DRIVER_STORAGE_PREFIX = 'lakbai_driver_';
const ADMIN_STORAGE_PREFIX = 'lakbai_admin_';

// Driver-specific storage utilities
export const driverStorage = {
  set: (key, value) => {
    localStorage.setItem(`${DRIVER_STORAGE_PREFIX}${key}`, JSON.stringify(value));
  },
  
  get: (key, defaultValue = null) => {
    try {
      const item = localStorage.getItem(`${DRIVER_STORAGE_PREFIX}${key}`);
      return item ? JSON.parse(item) : defaultValue;
    } catch (e) {
      console.error(`Error parsing driver storage key ${key}:`, e);
      return defaultValue;
    }
  },
  
  remove: (key) => {
    localStorage.removeItem(`${DRIVER_STORAGE_PREFIX}${key}`);
  },
  
  clear: () => {
    Object.keys(localStorage)
      .filter(key => key.startsWith(DRIVER_STORAGE_PREFIX))
      .forEach(key => localStorage.removeItem(key));
  }
};

// Admin-specific storage utilities
export const adminStorage = {
  set: (key, value) => {
    localStorage.setItem(`${ADMIN_STORAGE_PREFIX}${key}`, JSON.stringify(value));
  },
  
  get: (key, defaultValue = null) => {
    try {
      const item = localStorage.getItem(`${ADMIN_STORAGE_PREFIX}${key}`);
      return item ? JSON.parse(item) : defaultValue;
    } catch (e) {
      console.error(`Error parsing admin storage key ${key}:`, e);
      return defaultValue;
    }
  },
  
  remove: (key) => {
    localStorage.removeItem(`${ADMIN_STORAGE_PREFIX}${key}`);
  },
  
  clear: () => {
    Object.keys(localStorage)
      .filter(key => key.startsWith(ADMIN_STORAGE_PREFIX))
      .forEach(key => localStorage.removeItem(key));
  }
};

// Clear all LakbAI-related storage
export const clearAllLakbAIStorage = () => {
  Object.keys(localStorage)
    .filter(key => key.startsWith('lakbai_'))
    .forEach(key => localStorage.removeItem(key));
  
  console.log('✅ All LakbAI storage cleared');
};
