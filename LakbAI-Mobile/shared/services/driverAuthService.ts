import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { buildAuth0Url } from '../../config/developerConfig';

export interface DriverCredentials {
  username: string;
  password: string;
  licenseNumber?: string;
}

export interface DriverProfile {
  id: string;
  username: string;
  email: string;
  fullName: string;
  licenseNumber: string;
  phoneNumber: string;
  address: string;
  dateOfBirth: string;
  profileImageUrl?: string;
  
  // Jeepney Assignment
  assignedJeepney: {
    id: string;
    jeepneyNumber: string;
    plateNumber: string;
    model: string;
    capacity: number;
    route: string;
    status: 'active' | 'maintenance' | 'inactive';
  } | null;

  // Driver Status
  status: 'active' | 'suspended' | 'inactive';
  verificationStatus: 'verified' | 'pending' | 'rejected';
  
  // Performance Data
  rating: number;
  totalTrips: number;
  yearsExperience: number;
  
  // Current Session
  currentShift: {
    startTime: string;
    isOnDuty: boolean;
    currentLocation: string;
    todayTrips: number;
    todayEarnings: number;
  };

  // Permissions
  permissions: {
    canGenerateQR: boolean;
    canScanCheckpoints: boolean;
    canViewEarnings: boolean;
    canUpdateLocation: boolean;
  };

  // Timestamps
  createdAt: string;
  lastLoginAt: string;
  profileCompletedAt?: string;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  token?: string;
  driverProfile?: DriverProfile;
  errors?: string[];
}

class DriverAuthService {
  private readonly API_BASE_URL = 'http://192.168.254.110/LakbAI/LakbAI-API'; // Updated for Joseph's setup
  private currentDriver: DriverProfile | null = null;
  private authToken: string | null = null;

  /**
   * Login with username/password and fetch complete driver profile
   */
  async login(credentials: DriverCredentials): Promise<LoginResponse> {
    try {
      console.log('🔐 Attempting driver login:', { username: credentials.username });

      // Use the existing authentication API
      const response = await fetch(`${buildAuth0Url()}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: credentials.username,
          password: credentials.password,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Driver login response error:', errorText);
        return {
          success: false,
          message: 'Login failed. Please check your credentials and try again.',
          errors: ['NETWORK_ERROR']
        };
      }

      const data = await response.json();
      console.log('Driver login response:', data);

      const user = (data && data.data && data.data.user) ? data.data.user : data.user;

      if (data.status === 'success' && user) {
        // Check if user is actually a driver
        if (user.user_type !== 'driver') {
          return {
            success: false,
            message: 'Invalid credentials. This account is not registered as a driver.',
            errors: ['INVALID_USER_TYPE']
          };
        }

        // Transform database user into DriverProfile
        const driverProfile = await this.transformUserToDriverProfile(user);
        
        this.currentDriver = driverProfile;
        this.authToken = `lakbai_driver_token_${user.id}_${Date.now()}`;
        
        // Store login data locally
        await this.storeLoginData(driverProfile, this.authToken);
        
        console.log('✅ Driver login successful:', driverProfile.fullName);
        
        return {
          success: true,
          message: `Welcome back, ${driverProfile.fullName}!`,
          token: this.authToken,
          driverProfile: driverProfile
        };
      } else {
        return {
          success: false,
          message: data.message || 'Invalid credentials. Please check your username and password.',
          errors: ['INVALID_CREDENTIALS']
        };
      }

    } catch (error) {
      console.error('❌ Driver login error:', error);
      return {
        success: false,
        message: 'Network error. Please check your connection and try again.',
        errors: ['NETWORK_ERROR']
      };
    }
  }

  /**
   * Transform database user data into DriverProfile format
   */
  private async transformUserToDriverProfile(user: any): Promise<DriverProfile> {
    const now = new Date().toISOString();
    
    // Fetch real jeepney assignment from API
    const jeepneyAssignment = await this.getDriverJeepneyAssignment(user);

    return {
      id: `driver_${user.id}`,
      username: user.username,
      email: user.email,
      fullName: `${user.first_name} ${user.last_name}`,
      licenseNumber: user.drivers_license_name || `D${user.id}-${Date.now().toString().slice(-6)}`,
      phoneNumber: user.phone_number,
      address: this.formatAddress(user),
      dateOfBirth: user.birthday,
      profileImageUrl: user.picture || `https://via.placeholder.com/150/0066cc/ffffff?text=${user.first_name?.charAt(0) || 'D'}${user.last_name?.charAt(0) || 'R'}`,
      
      assignedJeepney: jeepneyAssignment,

      status: user.is_verified ? 'active' : 'inactive',
      verificationStatus: user.is_verified ? 'verified' : 'pending',
      rating: 4.5 + (Math.random() * 0.8), // Random rating between 4.5-5.3
      totalTrips: Math.floor(Math.random() * 1000) + 500, // Random trips
      yearsExperience: Math.floor(Math.random() * 10) + 2, // Random experience

      currentShift: {
        startTime: now,
        isOnDuty: user.shift_status === 'active' || true,
        currentLocation: user.last_location || 'Robinson Tejero',
        todayTrips: Math.floor(Math.random() * 20),
        todayEarnings: Math.floor(Math.random() * 2000) + 500
      },

      permissions: {
        canGenerateQR: true,
        canScanCheckpoints: true,
        canViewEarnings: true,
        canUpdateLocation: true
      },

      createdAt: user.created_at,
      lastLoginAt: now,
      profileCompletedAt: user.profile_completed || now
    };
  }

  /**
   * Get driver's jeepney assignment from API
   */
  private async getDriverJeepneyAssignment(user: any): Promise<any> {
    try {
      const response = await fetch(`${this.API_BASE_URL}/jeepneys`);
      if (response.ok) {
        const data = await response.json();
        const jeepney = data.jeepneys?.find((j: any) => j.driver_id === user.id);
        if (jeepney) {
          return {
            id: jeepney.id,
            jeepneyNumber: jeepney.jeepney_number,
            plateNumber: jeepney.plate_number || `ABC ${String(user.id * 123).padStart(4, '0')}`,
            model: jeepney.model || 'Toyota Coaster',
            capacity: jeepney.capacity || 18,
            route: jeepney.route_name,
            status: 'active' as const
          };
        }
      }
    } catch (error) {
      console.warn('Failed to fetch jeepney assignment from API, using fallback:', error);
    }
    
    // Fallback to mock data if API fails
    const routes = [
      'SM Epza → SM Dasmariñas',
      'SM Dasmariñas → SM Epza',
      'Ayala Center - Lahug', 
      'SM City Cebu - IT Park',
      'Colon Street - USC Main',
      'Fuente Circle - Capitol Site'
    ];
    
    return {
      id: `jeep_${user.id}`,
      jeepneyNumber: `LKB-${String(user.id).padStart(3, '0')}`,
      plateNumber: `ABC ${String(user.id * 123).padStart(4, '0')}`,
      model: 'Toyota Coaster',
      capacity: 18,
      route: routes[user.id % routes.length],
      status: 'active' as const
    };
  }

  /**
   * Format user address
   */
  private formatAddress(user: any): string {
    const parts = [
      user.house_number,
      user.street_name,
      user.barangay,
      user.city_municipality,
      user.province
    ].filter(Boolean);
    
    return parts.join(', ') || 'Cebu City, Philippines';
  }

  /**
   * Mock driver login for development (kept for fallback)
   */
  private async mockDriverLogin(credentials: DriverCredentials): Promise<LoginResponse> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Mock driver database
    const mockDrivers: Record<string, DriverProfile> = {
      'juan.delacruz': {
        id: 'driver_001',
        username: 'juan.delacruz',
        email: 'juan@lakbai.com',
        fullName: 'Juan Dela Cruz',
        licenseNumber: 'D123-456-789',
        phoneNumber: '+63 912 345 6789',
        address: 'Cebu City, Philippines',
        dateOfBirth: '1985-03-15',
        profileImageUrl: 'https://via.placeholder.com/150/0066cc/ffffff?text=JDC',
        
        assignedJeepney: {
          id: 'jeep_001',
          jeepneyNumber: 'LKB-001',
          plateNumber: 'ABC 1234',
          model: 'Toyota Coaster',
          capacity: 18,
          route: 'SM Epza → SM Dasmariñas',
          status: 'active'
        },

        status: 'active',
        verificationStatus: 'verified',
        rating: 4.8,
        totalTrips: 1247,
        yearsExperience: 8,

        currentShift: {
          startTime: new Date().toISOString(),
          isOnDuty: true,
          currentLocation: 'Robinson Tejero',
          todayTrips: 12,
          todayEarnings: 1840
        },

        permissions: {
          canGenerateQR: true,
          canScanCheckpoints: true,
          canViewEarnings: true,
          canUpdateLocation: true
        },

        createdAt: '2023-01-15T08:00:00.000Z',
        lastLoginAt: new Date().toISOString(),
        profileCompletedAt: '2023-01-16T10:30:00.000Z'
      },

      'maria.santos': {
        id: 'driver_002',
        username: 'maria.santos',
        email: 'maria@lakbai.com',
        fullName: 'Maria Santos',
        licenseNumber: 'D987-654-321',
        phoneNumber: '+63 998 765 4321',
        address: 'Lahug, Cebu City',
        dateOfBirth: '1990-07-22',
        profileImageUrl: 'https://via.placeholder.com/150/cc6600/ffffff?text=MS',
        
        assignedJeepney: {
          id: 'jeep_002',
          jeepneyNumber: 'LKB-002',
          plateNumber: 'DEF 5678',
          model: 'Toyota Coaster',
          capacity: 20,
          route: 'Ayala Center - Lahug',
          status: 'active'
        },

        status: 'active',
        verificationStatus: 'verified',
        rating: 4.9,
        totalTrips: 892,
        yearsExperience: 5,

        currentShift: {
          startTime: new Date().toISOString(),
          isOnDuty: false,
          currentLocation: 'Ayala Center',
          todayTrips: 8,
          todayEarnings: 1200
        },

        permissions: {
          canGenerateQR: true,
          canScanCheckpoints: true,
          canViewEarnings: true,
          canUpdateLocation: true
        },

        createdAt: '2023-06-10T09:15:00.000Z',
        lastLoginAt: new Date().toISOString(),
        profileCompletedAt: '2023-06-11T14:20:00.000Z'
      }
    };

    // Validate credentials
    const driver = mockDrivers[credentials.username];
    
    if (!driver) {
      return {
        success: false,
        message: 'Invalid username or password.',
        errors: ['INVALID_CREDENTIALS']
      };
    }

    // Simple password validation (in real app, this would be hashed)
    const validPasswords = {
      'juan.delacruz': 'password123',
      'maria.santos': 'password456'
    };

    if (validPasswords[credentials.username] !== credentials.password) {
      return {
        success: false,
        message: 'Invalid username or password.',
        errors: ['INVALID_CREDENTIALS']
      };
    }

    // Check driver status
    if (driver.status !== 'active') {
      return {
        success: false,
        message: `Your account is ${driver.status}. Please contact administration.`,
        errors: ['ACCOUNT_INACTIVE']
      };
    }

    if (driver.verificationStatus !== 'verified') {
      return {
        success: false,
        message: 'Your account verification is pending. Please wait for approval.',
        errors: ['ACCOUNT_UNVERIFIED']
      };
    }

    // Update last login
    driver.lastLoginAt = new Date().toISOString();

    return {
      success: true,
      message: `Welcome back, ${driver.fullName}!`,
      token: `lakbai_driver_token_${driver.id}_${Date.now()}`,
      driverProfile: driver
    };
  }

  /**
   * Store login data locally
   */
  private async storeLoginData(driver: DriverProfile, token: string): Promise<void> {
    try {
      await AsyncStorage.multiSet([
        ['driver_profile', JSON.stringify(driver)],
        ['driver_auth_token', token],
        ['driver_login_timestamp', new Date().toISOString()]
      ]);
    } catch (error) {
      console.error('Failed to store login data:', error);
    }
  }

  /**
   * Restore login session from local storage
   */
  async restoreSession(): Promise<{
    success: boolean;
    driverProfile?: DriverProfile;
    message: string;
  }> {
    try {
      const storedData = await AsyncStorage.multiGet([
        'driver_profile',
        'driver_auth_token',
        'driver_login_timestamp'
      ]);

      const profile = storedData[0][1];
      const token = storedData[1][1];
      const timestamp = storedData[2][1];

      if (!profile || !token) {
        return {
          success: false,
          message: 'No saved session found'
        };
      }

      // Check if session is still valid (24 hours)
      const loginTime = new Date(timestamp || 0);
      const now = new Date();
      const hoursDiff = (now.getTime() - loginTime.getTime()) / (1000 * 60 * 60);

      if (hoursDiff > 24) {
        await this.logout();
        return {
          success: false,
          message: 'Session expired'
        };
      }

      const driverProfile = JSON.parse(profile) as DriverProfile;
      this.currentDriver = driverProfile;
      this.authToken = token;

      console.log('✅ Session restored for:', driverProfile.fullName);

      return {
        success: true,
        driverProfile,
        message: 'Session restored successfully'
      };

    } catch (error) {
      console.error('Failed to restore session:', error);
      return {
        success: false,
        message: 'Failed to restore session'
      };
    }
  }

  /**
   * Update driver profile
   */
  async updateProfile(updates: Partial<DriverProfile>): Promise<{
    success: boolean;
    message: string;
    updatedProfile?: DriverProfile;
  }> {
    try {
      if (!this.currentDriver) {
        return {
          success: false,
          message: 'No active session'
        };
      }

      // Update local profile
      this.currentDriver = { ...this.currentDriver, ...updates };
      
      // Store updated profile
      await AsyncStorage.setItem('driver_profile', JSON.stringify(this.currentDriver));

      // TODO: Sync with backend
      // await this.syncProfileWithBackend(this.currentDriver);

      return {
        success: true,
        message: 'Profile updated successfully',
        updatedProfile: this.currentDriver
      };

    } catch (error) {
      console.error('Failed to update profile:', error);
      return {
        success: false,
        message: 'Failed to update profile'
      };
    }
  }

  /**
   * Update current shift status
   */
  async updateShiftStatus(updates: Partial<DriverProfile['currentShift']>): Promise<{
    success: boolean;
    message: string;
  }> {
    try {
      if (!this.currentDriver) {
        return {
          success: false,
          message: 'No active session'
        };
      }

      this.currentDriver.currentShift = {
        ...this.currentDriver.currentShift,
        ...updates
      };

      await AsyncStorage.setItem('driver_profile', JSON.stringify(this.currentDriver));

      return {
        success: true,
        message: 'Shift status updated'
      };

    } catch (error) {
      console.error('Failed to update shift status:', error);
      return {
        success: false,
        message: 'Failed to update shift status'
      };
    }
  }

  /**
   * Logout and clear session
   */
  async logout(): Promise<void> {
    try {
      // Reset today's earnings and trips on logout
      if (this.currentDriver?.id) {
        const { earningsService } = await import('./earningsService');
        earningsService.resetTodaysData(this.currentDriver.id.toString());
        console.log('🔄 Reset today\'s earnings and trips on logout for driver:', this.currentDriver.id);
      }
      
      await AsyncStorage.multiRemove([
        'driver_profile',
        'driver_auth_token', 
        'driver_login_timestamp'
      ]);
      
      this.currentDriver = null;
      this.authToken = null;
      
      console.log('🔓 Driver logged out successfully');
    } catch (error) {
      console.error('Failed to logout:', error);
    }
  }

  /**
   * Get current driver profile
   */
  getCurrentDriver(): DriverProfile | null {
    return this.currentDriver;
  }

  /**
   * Get auth token
   */
  getAuthToken(): string | null {
    return this.authToken;
  }

  /**
   * Check if driver is logged in
   */
  isLoggedIn(): boolean {
    return this.currentDriver !== null && this.authToken !== null;
  }

  /**
   * Get test credentials for testing (real accounts from database)
   */
  getMockCredentials(): DriverCredentials[] {
    return [
      {
        username: 'kehlani',
        password: 'password123', // Update with actual password if different
        licenseNumber: 'D016-202501-051'
      },
      {
        username: 'test_driver', // Add other real driver usernames here
        password: 'password123',
        licenseNumber: 'D000-000000-000'
      }
    ];
  }
}

export const driverAuthService = new DriverAuthService();
export default driverAuthService;
