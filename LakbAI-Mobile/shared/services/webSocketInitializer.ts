import { webSocketService, WebSocketConfig } from './webSocketService';
import sessionManager from './sessionManager';

export class WebSocketInitializer {
  private static initialized = false;
  private static currentConfig: WebSocketConfig | null = null;

  /**
   * Initialize WebSocket connection for the current user
   */
  static async initialize(): Promise<boolean> {
    if (this.initialized && webSocketService.isSocketConnected()) {
      console.log('🔌 WebSocket already initialized and connected');
      return true;
    }

    try {
      // Get current user session
      const session = await sessionManager.getUserSession();
      if (!session) {
        console.log('❌ No user session found, cannot initialize WebSocket');
        return false;
      }

      // Determine user type and create config
      const config = await this.createWebSocketConfig(session);
      if (!config) {
        console.log('❌ Could not create WebSocket config');
        return false;
      }

      // Connect to WebSocket server
      const connected = await webSocketService.connect(config);
      if (connected) {
        this.initialized = true;
        this.currentConfig = config;
        console.log('✅ WebSocket initialized successfully');
        return true;
      } else {
        console.log('❌ Failed to connect to WebSocket server');
        return false;
      }

    } catch (error) {
      console.error('❌ Error initializing WebSocket:', error);
      return false;
    }
  }

  /**
   * Reinitialize WebSocket if configuration changes
   */
  static async reinitialize(): Promise<boolean> {
    console.log('🔄 Reinitializing WebSocket...');
    
    // Disconnect existing connection
    this.disconnect();
    
    // Initialize with new config
    return await this.initialize();
  }

  /**
   * Disconnect WebSocket
   */
  static disconnect(): void {
    webSocketService.disconnect();
    this.initialized = false;
    this.currentConfig = null;
    console.log('🔌 WebSocket disconnected');
  }

  /**
   * Check if WebSocket is connected
   */
  static isConnected(): boolean {
    return this.initialized && webSocketService.isSocketConnected();
  }

  /**
   * Get current WebSocket status
   */
  static getStatus() {
    return {
      initialized: this.initialized,
      connected: webSocketService.isSocketConnected(),
      config: this.currentConfig,
      serviceStatus: webSocketService.getStatus()
    };
  }

  /**
   * Create WebSocket configuration from user session
   */
  private static async createWebSocketConfig(session: any): Promise<WebSocketConfig | null> {
    try {
      // Determine user type based on session data
      let userType: 'driver' | 'passenger' | 'admin' = 'passenger';
      let routeId: string | undefined;
      let driverInfo: any = undefined;

      // Check if this is a driver session
      if (session.userType === 'driver') {
        userType = 'driver';
        routeId = session.dbUserData?.route || '1';
        driverInfo = {
          name: session.username || session.dbUserData?.name,
          jeepneyNumber: session.dbUserData?.jeepney_number,
          route: session.dbUserData?.route || '1'
        };
      }
      // Check if this is a passenger session
      else if (session.userType === 'passenger') {
        userType = 'passenger';
        // For passengers, we might not have a specific route initially
        routeId = session.dbUserData?.route || '1'; // Default route
      }
      // Check if this is an admin session
      else if (session.userType === 'admin') {
        userType = 'admin';
      }

      const config: WebSocketConfig = {
        userId: session.userId,
        userType,
        routeId,
        driverInfo
      };

      console.log('📝 Created WebSocket config:', {
        userId: config.userId,
        userType: config.userType,
        routeId: config.routeId,
        hasDriverInfo: !!config.driverInfo
      });

      return config;

    } catch (error) {
      console.error('❌ Error creating WebSocket config:', error);
      return null;
    }
  }

  /**
   * Update route for current user (useful for passengers changing routes)
   */
  static async updateRoute(routeId: string): Promise<boolean> {
    if (!this.currentConfig) {
      console.log('❌ No current WebSocket config to update');
      return false;
    }

    // Update route in current config
    this.currentConfig.routeId = routeId;

    // Reinitialize with new route
    return await this.reinitialize();
  }

  /**
   * Send driver location update (for driver app)
   */
  static sendDriverLocation(location: string, coordinates: { latitude: number; longitude: number }): void {
    if (!this.isConnected()) {
      console.warn('⚠️ WebSocket not connected, cannot send location');
      return;
    }

    if (this.currentConfig?.userType !== 'driver') {
      console.warn('⚠️ Only drivers can send location updates');
      return;
    }

    webSocketService.sendDriverLocationUpdate(location, coordinates);
  }

  /**
   * Send QR scan notification (for driver app)
   */
  static sendQRScan(passengerId: string, amount: number, checkpoint: string, tripId?: string): void {
    if (!this.isConnected()) {
      console.warn('⚠️ WebSocket not connected, cannot send QR scan');
      return;
    }

    if (this.currentConfig?.userType !== 'driver') {
      console.warn('⚠️ Only drivers can send QR scan notifications');
      return;
    }

    webSocketService.sendQRScan(passengerId, amount, checkpoint, tripId);
  }

  /**
   * Send trip completion (for driver app)
   */
  static sendTripCompleted(tripId: string, passengerId: string, earnings: number, endLocation?: string): void {
    if (!this.isConnected()) {
      console.warn('⚠️ WebSocket not connected, cannot send trip completion');
      return;
    }

    if (this.currentConfig?.userType !== 'driver') {
      console.warn('⚠️ Only drivers can send trip completion');
      return;
    }

    webSocketService.sendTripCompleted(tripId, passengerId, earnings, endLocation);
  }

  /**
   * Send earnings update (for driver app)
   */
  static sendEarningsUpdate(amount: number, totalEarnings: number, tripCount?: number): void {
    if (!this.isConnected()) {
      console.warn('⚠️ WebSocket not connected, cannot send earnings update');
      return;
    }

    if (this.currentConfig?.userType !== 'driver') {
      console.warn('⚠️ Only drivers can send earnings updates');
      return;
    }

    webSocketService.sendEarningsUpdate(amount, totalEarnings, tripCount);
  }
}

export default WebSocketInitializer;
