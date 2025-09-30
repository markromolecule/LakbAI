const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
require('dotenv').config();

const app = express();
const server = http.createServer(app);

// Configure CORS for your mobile and admin apps
const io = socketIo(server, {
  cors: {
    origin: [
      "http://localhost:3000",  // Admin dashboard
      "http://192.168.254.115:3000",  // Current developer IP
      "exp://192.168.254.115:8081",   // Expo development current IP
      "exp://localhost:8081",       // Expo local
      "*"  // Allow all origins for development
    ],
    methods: ["GET", "POST"],
    credentials: true
  }
});

// Enable CORS and JSON parsing for HTTP endpoints
app.use(cors());
app.use(express.json());

// Store connected users and their data
const connectedUsers = new Map();
const driverLocations = new Map();
const tripUpdates = new Map();
const activeTrips = new Map();

console.log('🚀 LakbAI WebSocket Server Starting...');

// WebSocket connection handling
io.on('connection', (socket) => {
  console.log(`🔌 User connected: ${socket.id}`);

  // Handle user authentication and role assignment
  socket.on('authenticate', (data) => {
    try {
      const { userId, userType, routeId, driverInfo } = data;
      
      const userData = {
        userId,
        userType, // 'driver', 'passenger', 'admin'
        routeId,
        socketId: socket.id,
        connectedAt: new Date().toISOString(),
        driverInfo: driverInfo || null
      };

      connectedUsers.set(socket.id, userData);

      console.log(`👤 User authenticated: ${userType} - ${userId} ${routeId ? `(Route: ${routeId})` : ''}`);
      
      // Join user to appropriate rooms
      if (routeId) {
        socket.join(`route-${routeId}`);
        console.log(`📍 User joined route room: route-${routeId}`);
      }
      if (userType === 'driver') {
        socket.join('drivers');
        socket.join(`driver-${userId}`);
      }
      if (userType === 'passenger') {
        socket.join('passengers');
        socket.join(`passenger-${userId}`);
      }
      if (userType === 'admin') {
        socket.join('admins');
      }

      socket.emit('authenticated', { 
        success: true, 
        socketId: socket.id,
        connectedUsers: connectedUsers.size
      });

      // Send current driver locations to new passengers
      if (userType === 'passenger' && routeId) {
        const routeDrivers = Array.from(driverLocations.values())
          .filter(driver => driver.routeId === routeId);
        
        if (routeDrivers.length > 0) {
          socket.emit('initial-driver-locations', routeDrivers);
        }
      }

    } catch (error) {
      console.error('❌ Authentication error:', error);
      socket.emit('authentication-error', { error: error.message });
    }
  });

  // Handle driver location updates
  socket.on('driver-location-update', (data) => {
    try {
      const user = connectedUsers.get(socket.id);
      if (user && user.userType === 'driver') {
        const locationData = {
          driverId: user.userId,
          routeId: user.routeId,
          location: data.location,
          coordinates: data.coordinates,
          timestamp: new Date().toISOString(),
          status: 'active',
          jeepneyNumber: user.driverInfo?.jeepneyNumber || 'Unknown'
        };

        // Store driver location
        driverLocations.set(user.userId, locationData);

        // Broadcast to passengers on the same route
        io.to(`route-${user.routeId}`).emit('driver-location-update', locationData);
        
        // Broadcast to admins
        io.to('admins').emit('driver-location-update', locationData);

        console.log(`📍 Driver location updated: ${user.userId} at ${data.location}`);
      }
    } catch (error) {
      console.error('❌ Driver location update error:', error);
    }
  });

  // Handle trip start notifications
  socket.on('trip-started', (data) => {
    try {
      const user = connectedUsers.get(socket.id);
      if (user && user.userType === 'driver') {
        const tripData = {
          tripId: data.tripId,
          driverId: user.userId,
          routeId: user.routeId,
          passengerId: data.passengerId,
          startLocation: data.startLocation,
          timestamp: new Date().toISOString(),
          status: 'active'
        };

        // Store active trip
        activeTrips.set(data.tripId, tripData);

        // Notify the specific passenger
        io.to(`passenger-${data.passengerId}`).emit('trip-started', tripData);
        
        // Broadcast to admins
        io.to('admins').emit('trip-started', tripData);

        console.log(`🚌 Trip started: ${data.tripId} - Driver: ${user.userId}, Passenger: ${data.passengerId}`);
      }
    } catch (error) {
      console.error('❌ Trip start error:', error);
    }
  });

  // Handle trip completion notifications
  socket.on('trip-completed', (data) => {
    try {
      const user = connectedUsers.get(socket.id);
      if (user && user.userType === 'driver') {
        const tripData = {
          tripId: data.tripId,
          driverId: user.userId,
          routeId: user.routeId,
          passengerId: data.passengerId,
          earnings: data.earnings,
          endLocation: data.endLocation,
          distance: data.distance,
          duration: data.duration,
          timestamp: new Date().toISOString(),
          status: 'completed'
        };

        // Update trip data
        tripUpdates.set(data.tripId, tripData);
        activeTrips.delete(data.tripId);

        // Notify the specific passenger
        if (data.passengerId) {
          io.to(`passenger-${data.passengerId}`).emit('trip-completed', tripData);
        }
        
        // Broadcast to passengers on route
        io.to(`route-${user.routeId}`).emit('trip-completed', tripData);
        
        // Broadcast to admins
        io.to('admins').emit('trip-completed', tripData);

        console.log(`✅ Trip completed: ${data.tripId} - Earnings: ₱${data.earnings}`);
      }
    } catch (error) {
      console.error('❌ Trip completion error:', error);
    }
  });

  // Handle QR code scan notifications
  socket.on('qr-scan', (data) => {
    try {
      const user = connectedUsers.get(socket.id);
      if (user && user.userType === 'driver') {
        const scanData = {
          driverId: user.userId,
          routeId: user.routeId,
          passengerId: data.passengerId,
          amount: data.amount,
          checkpoint: data.checkpoint,
          tripId: data.tripId,
          timestamp: new Date().toISOString(),
          scanType: data.scanType || 'payment'
        };

        // Notify the specific passenger
        if (data.passengerId) {
          io.to(`passenger-${data.passengerId}`).emit('qr-scan-notification', scanData);
        }
        
        // Broadcast to admins
        io.to('admins').emit('qr-scan', scanData);

        console.log(`📱 QR scan: Driver ${user.userId} scanned passenger ${data.passengerId} - ₱${data.amount}`);
      }
    } catch (error) {
      console.error('❌ QR scan error:', error);
    }
  });

  // Handle earnings updates
  socket.on('earnings-update', (data) => {
    try {
      const user = connectedUsers.get(socket.id);
      if (user && user.userType === 'driver') {
        const earningsData = {
          driverId: user.userId,
          amount: data.amount,
          totalEarnings: data.totalEarnings,
          tripCount: data.tripCount,
          timestamp: new Date().toISOString()
        };

        // Send to the specific driver
        io.to(`driver-${user.userId}`).emit('earnings-update', earningsData);
        
        // Broadcast to admins
        io.to('admins').emit('earnings-update', earningsData);

        console.log(`💰 Earnings update: Driver ${user.userId} earned ₱${data.amount} (Total: ₱${data.totalEarnings})`);
      }
    } catch (error) {
      console.error('❌ Earnings update error:', error);
    }
  });

  // Handle passenger notifications
  socket.on('passenger-notification', (data) => {
    try {
      const user = connectedUsers.get(socket.id);
      
      const notificationData = {
        ...data,
        timestamp: new Date().toISOString(),
        fromUser: user?.userId || 'system'
      };

      // Send to specific passenger or all passengers
      if (data.passengerId) {
        io.to(`passenger-${data.passengerId}`).emit('notification', notificationData);
      } else if (data.routeId) {
        io.to(`route-${data.routeId}`).emit('notification', notificationData);
      } else {
        io.to('passengers').emit('notification', notificationData);
      }

      console.log(`🔔 Passenger notification sent: ${data.title}`);
    } catch (error) {
      console.error('❌ Passenger notification error:', error);
    }
  });

  // Handle route status updates
  socket.on('route-status-update', (data) => {
    try {
      const user = connectedUsers.get(socket.id);
      if (user && (user.userType === 'driver' || user.userType === 'admin')) {
        const statusData = {
          routeId: data.routeId,
          status: data.status, // 'active', 'busy', 'inactive'
          availableDrivers: data.availableDrivers,
          timestamp: new Date().toISOString()
        };

        // Broadcast to all users on this route
        io.to(`route-${data.routeId}`).emit('route-status-update', statusData);
        
        // Broadcast to admins
        io.to('admins').emit('route-status-update', statusData);

        console.log(`🛣️ Route status update: Route ${data.routeId} is now ${data.status}`);
      }
    } catch (error) {
      console.error('❌ Route status update error:', error);
    }
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    try {
      const user = connectedUsers.get(socket.id);
      if (user) {
        console.log(`👋 User disconnected: ${user.userType} - ${user.userId}`);
        
        // Clean up user data
        connectedUsers.delete(socket.id);
        
        if (user.userType === 'driver') {
          // Mark driver as offline
          const driverLocation = driverLocations.get(user.userId);
          if (driverLocation) {
            driverLocation.status = 'offline';
            driverLocation.lastSeen = new Date().toISOString();
            
            // Notify route passengers that driver is offline
            io.to(`route-${user.routeId}`).emit('driver-status-update', {
              driverId: user.userId,
              status: 'offline',
              timestamp: new Date().toISOString()
            });
          }
        }
      } else {
        console.log(`👋 Unknown user disconnected: ${socket.id}`);
      }
    } catch (error) {
      console.error('❌ Disconnect handling error:', error);
    }
  });
});

// API endpoints for your PHP backend to send data
app.post('/api/driver-location', (req, res) => {
  try {
    const { driverId, routeId, location, coordinates, jeepneyNumber } = req.body;
    
    const locationData = {
      driverId,
      routeId,
      location,
      coordinates,
      jeepneyNumber,
      timestamp: new Date().toISOString(),
      status: 'active'
    };

    // Store and broadcast location
    driverLocations.set(driverId, locationData);
    io.to(`route-${routeId}`).emit('driver-location-update', locationData);
    io.to('admins').emit('driver-location-update', locationData);
    
    console.log(`📍 API: Driver location updated - ${driverId} at ${location}`);
    res.json({ success: true, message: 'Location update sent' });
  } catch (error) {
    console.error('❌ API driver location error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Endpoint for PHP to send trip completion
app.post('/api/trip-completed', (req, res) => {
  try {
    const { tripId, driverId, routeId, passengerId, earnings } = req.body;
    
    const tripData = {
      tripId,
      driverId,
      routeId,
      passengerId,
      earnings,
      timestamp: new Date().toISOString(),
      status: 'completed'
    };

    // Store and broadcast trip completion
    tripUpdates.set(tripId, tripData);
    
    if (passengerId) {
      io.to(`passenger-${passengerId}`).emit('trip-completed', tripData);
    }
    io.to(`route-${routeId}`).emit('trip-completed', tripData);
    io.to('admins').emit('trip-completed', tripData);
    
    console.log(`✅ API: Trip completed - ${tripId} - ₱${earnings}`);
    res.json({ success: true, message: 'Trip completion sent' });
  } catch (error) {
    console.error('❌ API trip completion error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Endpoint for PHP to send QR scan notifications
app.post('/api/qr-scan', (req, res) => {
  try {
    const { driverId, passengerId, amount, checkpoint, tripId } = req.body;
    
    const scanData = {
      driverId,
      passengerId,
      amount,
      checkpoint,
      tripId,
      timestamp: new Date().toISOString()
    };

    // Send to specific passenger and admins
    if (passengerId) {
      io.to(`passenger-${passengerId}`).emit('qr-scan-notification', scanData);
    }
    io.to('admins').emit('qr-scan', scanData);
    
    console.log(`📱 API: QR scan - Driver ${driverId} → Passenger ${passengerId} - ₱${amount}`);
    res.json({ success: true, message: 'QR scan notification sent' });
  } catch (error) {
    console.error('❌ API QR scan error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Endpoint for PHP to send earnings updates
app.post('/api/earnings-update', (req, res) => {
  try {
    const { driverId, amount, totalEarnings, tripCount } = req.body;
    
    const earningsData = {
      driverId,
      amount,
      totalEarnings,
      tripCount,
      timestamp: new Date().toISOString()
    };

    // Send to specific driver and admins
    io.to(`driver-${driverId}`).emit('earnings-update', earningsData);
    io.to('admins').emit('earnings-update', earningsData);
    
    console.log(`💰 API: Earnings update - Driver ${driverId} earned ₱${amount} (Total: ₱${totalEarnings})`);
    res.json({ success: true, message: 'Earnings update sent' });
  } catch (error) {
    console.error('❌ API earnings update error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy',
    timestamp: new Date().toISOString(),
    connectedUsers: connectedUsers.size,
    driverLocations: driverLocations.size,
    activeTrips: activeTrips.size,
    tripUpdates: tripUpdates.size,
    connections: {
      drivers: Array.from(connectedUsers.values()).filter(u => u.userType === 'driver').length,
      passengers: Array.from(connectedUsers.values()).filter(u => u.userType === 'passenger').length,
      admins: Array.from(connectedUsers.values()).filter(u => u.userType === 'admin').length
    }
  });
});

// Get connected users (for debugging)
app.get('/api/status', (req, res) => {
  res.json({
    connectedUsers: Array.from(connectedUsers.values()),
    driverLocations: Array.from(driverLocations.values()),
    activeTrips: Array.from(activeTrips.values())
  });
});

const PORT = process.env.PORT || 8080;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 LakbAI WebSocket Server running on port ${PORT}`);
  console.log(`📱 Mobile app should connect to: ws://192.168.8.104:${PORT}`);
  console.log(`💻 Admin dashboard should connect to: ws://localhost:${PORT}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
  console.log(`📊 Status endpoint: http://localhost:${PORT}/api/status`);
});
