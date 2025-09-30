import { io, Socket } from 'socket.io-client';
import { getBaseUrl } from '../../config/apiConfig';
import { DEVELOPER_IP } from '../../config/developerConfig';

export interface WebSocketConfig {
  userId: string;
  userType: 'driver' | 'passenger' | 'admin';
  routeId?: string;
  driverInfo?: {
    name: string;
    jeepneyNumber: string;
    route: string;
  };
}

export interface DriverLocationUpdate {
  driverId: string;
  routeId: string;
  location: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
  timestamp: string;
  status: 'active' | 'offline';
  jeepneyNumber?: string;
}

export interface TripUpdate {
  tripId: string;
  driverId: string;
  routeId: string;
  passengerId?: string;
  earnings?: number;
  status: 'started' | 'completed';
  timestamp: string;
  endLocation?: string;
  distance?: number;
  duration?: number;
}

export interface QRScanNotification {
  driverId: string;
  passengerId: string;
  amount: number;
  checkpoint: string;
  tripId?: string;
  timestamp: string;
  scanType?: 'payment' | 'boarding';
}

export interface EarningsUpdate {
  driverId: string;
  amount: number;
  totalEarnings: number;
  tripCount?: number;
  timestamp: string;
}

type EventCallback<T> = (data: T) => void;

class WebSocketService {
  private static instance: WebSocketService;
  private socket: Socket | null = null;
  private isConnected = false;
  private isConnecting = false;
  private config: WebSocketConfig | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectInterval = 3000;

  // Event listeners
  private listeners: Map<string, Set<Function>> = new Map();

  private constructor() {}

  static getInstance(): WebSocketService {
    if (!WebSocketService.instance) {
      WebSocketService.instance = new WebSocketService();
    }
    return WebSocketService.instance;
  }

  /**
   * Connect to WebSocket server
   */
  async connect(config: WebSocketConfig): Promise<boolean> {
    if (this.isConnected || this.isConnecting) {
      console.log('🔌 WebSocket already connected or connecting');
      return this.isConnected;
    }

    this.isConnecting = true;
    this.config = config;

    try {
      // Get WebSocket server URL
      const wsUrl = this.getWebSocketUrl();
      console.log('🔌 Connecting to WebSocket server:', wsUrl);
      console.log('🔌 WebSocket config:', {
        userId: config.userId,
        userType: config.userType,
        routeId: config.routeId
      });

      // Create socket connection
      this.socket = io(wsUrl, {
        transports: ['websocket'],
        timeout: 10000,
        forceNew: true,
        reconnection: true,
        reconnectionAttempts: this.maxReconnectAttempts,
        reconnectionDelay: this.reconnectInterval,
      });

      // Set up event handlers
      this.setupEventHandlers();

      // Wait for connection
      return new Promise((resolve) => {
        const timeout = setTimeout(() => {
          console.error('❌ WebSocket connection timeout');
          this.isConnecting = false;
          resolve(false);
        }, 10000);

        this.socket?.on('connect', () => {
          clearTimeout(timeout);
          console.log('✅ WebSocket connected successfully');
          this.isConnected = true;
          this.isConnecting = false;
          this.reconnectAttempts = 0;
          
          // Authenticate user
          this.authenticate();
          resolve(true);
        });

        this.socket?.on('connect_error', (error) => {
          clearTimeout(timeout);
          console.error('❌ WebSocket connection error:', error);
          console.error('❌ WebSocket error details:', {
            message: error.message,
            description: error.description,
            context: error.context,
            type: error.type
          });
          this.isConnecting = false;
          resolve(false);
        });
      });

    } catch (error) {
      console.error('❌ WebSocket connection failed:', error);
      this.isConnecting = false;
      return false;
    }
  }

  /**
   * Disconnect from WebSocket server
   */
  disconnect(): void {
    if (this.socket) {
      console.log('🔌 Disconnecting WebSocket...');
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      this.config = null;
      this.listeners.clear();
    }
  }

  /**
   * Check if WebSocket is connected
   */
  isSocketConnected(): boolean {
    return this.isConnected && this.socket?.connected === true;
  }

  /**
   * Send driver location update
   */
  sendDriverLocationUpdate(location: string, coordinates: { latitude: number; longitude: number }): void {
    if (!this.isSocketConnected()) {
      console.warn('⚠️ WebSocket not connected, cannot send location update');
      return;
    }

    const locationData = {
      location,
      coordinates,
      timestamp: new Date().toISOString()
    };

    this.socket?.emit('driver-location-update', locationData);
    console.log('📍 Sent driver location update:', location);
  }

  /**
   * Send trip completion notification
   */
  sendTripCompleted(tripId: string, passengerId: string, earnings: number, endLocation?: string): void {
    if (!this.isSocketConnected()) {
      console.warn('⚠️ WebSocket not connected, cannot send trip completion');
      return;
    }

    const tripData = {
      tripId,
      passengerId,
      earnings,
      endLocation,
      timestamp: new Date().toISOString()
    };

    this.socket?.emit('trip-completed', tripData);
    console.log('✅ Sent trip completion:', tripId);
  }

  /**
   * Send QR scan notification
   */
  sendQRScan(passengerId: string, amount: number, checkpoint: string, tripId?: string): void {
    if (!this.isSocketConnected()) {
      console.warn('⚠️ WebSocket not connected, cannot send QR scan');
      return;
    }

    const scanData = {
      passengerId,
      amount,
      checkpoint,
      tripId,
      timestamp: new Date().toISOString()
    };

    this.socket?.emit('qr-scan', scanData);
    console.log('📱 Sent QR scan notification:', passengerId);
  }

  /**
   * Send earnings update
   */
  sendEarningsUpdate(amount: number, totalEarnings: number, tripCount?: number): void {
    if (!this.isSocketConnected()) {
      console.warn('⚠️ WebSocket not connected, cannot send earnings update');
      return;
    }

    const earningsData = {
      amount,
      totalEarnings,
      tripCount,
      timestamp: new Date().toISOString()
    };

    this.socket?.emit('earnings-update', earningsData);
    console.log('💰 Sent earnings update:', amount);
  }

  /**
   * Add event listener
   */
  on<T>(event: string, callback: EventCallback<T>): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)?.add(callback);

    // Also add to socket if connected
    if (this.socket) {
      this.socket.on(event, callback);
    }
  }

  /**
   * Remove event listener
   */
  off<T>(event: string, callback: EventCallback<T>): void {
    this.listeners.get(event)?.delete(callback);
    
    // Also remove from socket if connected
    if (this.socket) {
      this.socket.off(event, callback);
    }
  }

  /**
   * Remove all listeners for an event
   */
  removeAllListeners(event: string): void {
    this.listeners.delete(event);
    
    if (this.socket) {
      this.socket.removeAllListeners(event);
    }
  }

  /**
   * Get WebSocket server URL
   */
  private getWebSocketUrl(): string {
    // Use the same IP as your API but with WebSocket port
    const wsPort = 8080;
    return `ws://${DEVELOPER_IP}:${wsPort}`;
  }

  /**
   * Set up WebSocket event handlers
   */
  private setupEventHandlers(): void {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('🔌 WebSocket connected');
      this.isConnected = true;
    });

    this.socket.on('disconnect', (reason) => {
      console.log('🔌 WebSocket disconnected:', reason);
      this.isConnected = false;
      
      if (reason === 'io server disconnect') {
        // Server disconnected, try to reconnect
        this.handleReconnection();
      }
    });

    this.socket.on('authenticated', (data) => {
      console.log('✅ WebSocket authenticated:', data);
    });

    this.socket.on('authentication-error', (error) => {
      console.error('❌ WebSocket authentication error:', error);
    });

    this.socket.on('connect_error', (error) => {
      console.error('❌ WebSocket connection error:', error);
      this.handleReconnection();
    });

    // Set up listeners for stored events
    this.listeners.forEach((callbacks, event) => {
      callbacks.forEach(callback => {
        this.socket?.on(event, callback);
      });
    });
  }

  /**
   * Authenticate with WebSocket server
   */
  private authenticate(): void {
    if (!this.socket || !this.config) return;

    const authData = {
      userId: this.config.userId,
      userType: this.config.userType,
      routeId: this.config.routeId,
      driverInfo: this.config.driverInfo
    };

    this.socket.emit('authenticate', authData);
    console.log('🔐 Authenticating WebSocket:', this.config.userType, this.config.userId);
  }

  /**
   * Handle reconnection logic
   */
  private handleReconnection(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('❌ Max reconnection attempts reached');
      return;
    }

    this.reconnectAttempts++;
    console.log(`🔄 Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);

    setTimeout(() => {
      if (this.config && !this.isConnected) {
        this.connect(this.config);
      }
    }, this.reconnectInterval);
  }

  /**
   * Get connection status for debugging
   */
  getStatus() {
    return {
      isConnected: this.isConnected,
      isConnecting: this.isConnecting,
      reconnectAttempts: this.reconnectAttempts,
      config: this.config,
      socketConnected: this.socket?.connected || false,
      listeners: Array.from(this.listeners.keys())
    };
  }
}

// Export singleton instance
export const webSocketService = WebSocketService.getInstance();
export default webSocketService;
