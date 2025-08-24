/**
 * LakbAI Driver Authentication Service
 * Handles local authentication for drivers (similar to mobile app)
 */

class LakbaiAuthService {
  constructor() {
    // Use browser-safe environment variable access
    this.baseURL = window.location.origin || 'http://localhost:3000';
    this.storagePrefix = 'lakbai_driver_';
  }

  // Store driver session
  async storeDriverSession(username, isProfileComplete = false) {
    try {
      const sessionData = {
        username,
        isProfileComplete,
        loginTime: new Date().toISOString(),
        role: 'driver'
      };

      localStorage.setItem(`${this.storagePrefix}session`, JSON.stringify(sessionData));
      console.log('✅ Driver session stored:', sessionData);
      return { success: true, data: sessionData };
    } catch (error) {
      console.error('❌ Failed to store driver session:', error);
      return { success: false, error: error.message };
    }
  }

  // Get current driver session
  getCurrentDriverSession() {
    try {
      const sessionData = localStorage.getItem(`${this.storagePrefix}session`);
      if (!sessionData) return null;
      
      const session = JSON.parse(sessionData);
      console.log('📋 Current driver session:', session);
      return session;
    } catch (error) {
      console.error('❌ Failed to get driver session:', error);
      return null;
    }
  }

  // Check if driver is authenticated
  isDriverAuthenticated() {
    const session = this.getCurrentDriverSession();
    return session && session.username;
  }

  // Check if driver profile is complete
  isDriverProfileComplete() {
    const session = this.getCurrentDriverSession();
    return session && session.isProfileComplete;
  }

  // Clear driver session
  clearDriverSession() {
    try {
      localStorage.removeItem(`${this.storagePrefix}session`);
      console.log('✅ Driver session cleared');
      return { success: true };
    } catch (error) {
      console.error('❌ Failed to clear driver session:', error);
      return { success: false, error: error.message };
    }
  }

  // Authenticate driver with username/password
  async authenticateDriver(username, password) {
    try {
      console.log('🔐 Authenticating driver:', username);
      
      // For now, use simple validation
      // In production, this would call your backend API
      if (!username || !password) {
        throw new Error('Username and password are required');
      }

      if (username.length < 3) {
        throw new Error('Username must be at least 3 characters long');
      }

      // Store session
      const result = await this.storeDriverSession(username, false);
      if (!result.success) {
        throw new Error('Failed to create session');
      }

      console.log('✅ Driver authentication successful');
      return { success: true, data: result.data };
    } catch (error) {
      console.error('❌ Driver authentication failed:', error);
      return { success: false, error: error.message };
    }
  }

  // Complete driver profile
  async completeDriverProfile(profileData) {
    try {
      console.log('📝 Completing driver profile:', profileData);
      
      // Validate required fields
      const requiredFields = [
        'username', 'firstName', 'lastName', 'phoneNumber',
        'houseNumber', 'streetName', 'barangay', 'cityMunicipality',
        'province', 'postalCode', 'birthMonth', 'birthDate', 'birthYear', 'gender'
      ];

      for (const field of requiredFields) {
        if (!profileData[field] || profileData[field].toString().trim() === '') {
          throw new Error(`${field} is required`);
        }
      }

      // Update session with profile completion
      const session = this.getCurrentDriverSession();
      if (!session) {
        throw new Error('No active driver session');
      }

      const updatedSession = {
        ...session,
        isProfileComplete: true,
        profileData: {
          ...profileData,
          completedAt: new Date().toISOString()
        }
      };

      localStorage.setItem(`${this.storagePrefix}session`, JSON.stringify(updatedSession));
      
      console.log('✅ Driver profile completed successfully');
      return { success: true, data: updatedSession };
    } catch (error) {
      console.error('❌ Failed to complete driver profile:', error);
      return { success: false, error: error.message };
    }
  }

  // Logout driver
  async logoutDriver() {
    try {
      console.log('🚪 Logging out driver');
      
      // Clear session
      const result = this.clearDriverSession();
      if (!result.success) {
        throw new Error('Failed to clear session');
      }

      console.log('✅ Driver logged out successfully');
      return { success: true };
    } catch (error) {
      console.error('❌ Failed to logout driver:', error);
      return { success: false, error: error.message };
    }
  }

  // Get driver profile data
  getDriverProfile() {
    try {
      const session = this.getCurrentDriverSession();
      if (!session || !session.profileData) {
        return null;
      }
      
      return session.profileData;
    } catch (error) {
      console.error('❌ Failed to get driver profile:', error);
      return null;
    }
  }

  // Update driver profile
  async updateDriverProfile(updates) {
    try {
      console.log('📝 Updating driver profile:', updates);
      
      const session = this.getCurrentDriverSession();
      if (!session) {
        throw new Error('No active driver session');
      }

      const updatedProfile = {
        ...session.profileData,
        ...updates,
        updatedAt: new Date().toISOString()
      };

      const updatedSession = {
        ...session,
        profileData: updatedProfile
      };

      localStorage.setItem(`${this.storagePrefix}session`, JSON.stringify(updatedSession));
      
      console.log('✅ Driver profile updated successfully');
      return { success: true, data: updatedProfile };
    } catch (error) {
      console.error('❌ Failed to update driver profile:', error);
      return { success: false, error: error.message };
    }
  }
}

// Create singleton instance
const lakbaiAuthService = new LakbaiAuthService();

export default lakbaiAuthService;
