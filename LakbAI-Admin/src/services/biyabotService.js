// BiyaBot Service - AI-Enhanced Smart Chatbot
import GeminiService from './geminiService.js';

const API_BASE_URL = 'http://localhost/LakbAI/LakbAI-API/routes/api.php';

// Environment configuration for Gemini API
// Guaranteed fallback API key
const FALLBACK_GEMINI_API_KEY = 'AIzaSyD20q0ucYolbJ6E3hhZQgKbnWy38-DVGec';

let GEMINI_API_KEY = '';
try {
  // Check for environment variable or configuration
  GEMINI_API_KEY = process.env.REACT_APP_GEMINI_API_KEY || 
                   window.ENV?.GEMINI_API_KEY || 
                   localStorage.getItem('GEMINI_API_KEY') || 
                   FALLBACK_GEMINI_API_KEY || ''; // Use fallback as last resort
  
  console.log('🔑 Admin BiyaBot - API Key loading attempts:');
  console.log('  - process.env.REACT_APP_GEMINI_API_KEY:', process.env.REACT_APP_GEMINI_API_KEY ? 'Found' : 'Not found');
  console.log('  - window.ENV?.GEMINI_API_KEY:', window.ENV?.GEMINI_API_KEY ? 'Found' : 'Not found');
  console.log('  - localStorage.getItem:', localStorage.getItem('GEMINI_API_KEY') ? 'Found' : 'Not found');
  console.log('  - Fallback key:', FALLBACK_GEMINI_API_KEY ? 'Available' : 'Not available');
  console.log('  - Final GEMINI_API_KEY length:', GEMINI_API_KEY.length);
} catch (error) {
  console.warn('⚠️ Error loading Gemini API key, using fallback:', error);
  GEMINI_API_KEY = FALLBACK_GEMINI_API_KEY;
}

class BiyaBotService {
  constructor() {
    this.geminiService = null;
    this.useAI = false;
    this.cache = new Map();
    this.CACHE_DURATION = 30 * 1000; // 30 seconds cache
    this.initializeGeminiService();
  }

  /**
   * Initialize Gemini AI service if API key is available
   */
  initializeGeminiService() {
    if (GEMINI_API_KEY && GEMINI_API_KEY.trim().length > 0) {
      try {
        this.geminiService = new GeminiService(GEMINI_API_KEY);
        this.useAI = true;
        console.log('🤖✨ Admin Gemini AI service initialized successfully');
      } catch (error) {
        console.error('❌ Failed to initialize Admin Gemini service:', error);
        this.useAI = false;
      }
    } else {
      console.log('ℹ️ Gemini API key not provided for admin, using rule-based responses only');
      this.useAI = false;
    }
  }

  /**
   * Process message with HYBRID approach (Database + AI)
   */
  async processMessage(message) {
    try {
      console.log('🤖 Admin BiyaBot processing message:', message);

      const lowerMessage = message.toLowerCase();
      
      // STEP 1: Check if it's a specific data request (fare, route, jeepney)
      const isFareQuery = lowerMessage.includes('magkano') || lowerMessage.includes('fare') || 
                          lowerMessage.includes('pamasahe') || lowerMessage.includes('how much') ||
                          lowerMessage.includes('bayad');
      
      const isRouteQuery = lowerMessage.includes('route') || lowerMessage.includes('ruta') ||
                           lowerMessage.includes('paano') || lowerMessage.includes('papunta') ||
                           lowerMessage.includes('how to get');
      
      const isJeepneyQuery = lowerMessage.includes('jeep') || lowerMessage.includes('sasakyan') ||
                             lowerMessage.includes('where') || lowerMessage.includes('nasaan') ||
                             lowerMessage.includes('location');

      // STEP 2: If it's a data request, fetch from database FIRST
      if (isFareQuery || isRouteQuery || isJeepneyQuery) {
        console.log('📊 Detected data query, fetching from database...');
        
        // Try to extract locations for fare calculation
        if (isFareQuery) {
          const locations = this.extractLocations(message);
          if (locations.from && locations.to) {
            console.log(`💰 Calculating fare: ${locations.from} → ${locations.to}`);
            try {
              const fareResult = await this.calculateFareByNames(locations.from, locations.to);
              if (fareResult && fareResult.status === 'success' && fareResult.fare_info) {
                const info = fareResult.fare_info;
                // Return database result with friendly formatting
                const tagalogResponse = `💰 Pamasahe mula ${info.from_checkpoint} papunta ${info.to_checkpoint}:\n\n💵 ₱${info.fare_amount}\n\n🚌 Ruta: ${info.route_name}\n\nIto po ang eksaktong presyo base sa aming database! 🎯`;
                const englishResponse = `💰 Fare from ${info.from_checkpoint} to ${info.to_checkpoint}:\n\n💵 ₱${info.fare_amount}\n\n🚌 Route: ${info.route_name}\n\nThis is the exact price from our database! 🎯`;
                
                return lowerMessage.includes('magkano') || lowerMessage.includes('pamasahe') ? 
                       tagalogResponse : englishResponse;
              }
            } catch (error) {
              console.error('❌ Error calculating fare:', error);
            }
          }
        }
      }

      // STEP 3: For general queries or if data fetch failed, use AI with context
      if (this.useAI && this.geminiService) {
        try {
          console.log('🤖✨ Using AI for response...');
          const context = await this.gatherSystemContext();
          const aiResponse = await this.geminiService.generateResponse(message, context);
          
          if (aiResponse && aiResponse.message && aiResponse.type !== 'error') {
            console.log('✅ AI response generated successfully');
            return aiResponse.message;
          }
        } catch (error) {
          console.warn('⚠️ AI service failed:', error);
        }
      }

      // STEP 4: Final fallback
      return `I received your message: "${message}". Please try asking about fares, routes, or jeepney locations! 🚌`;

    } catch (error) {
      console.error('❌ Error processing message:', error);
      return 'Sorry, I encountered an error. Please try again!';
    }
  }

  /**
   * Extract location names from message (similar to mobile version)
   */
  extractLocations(message) {
    const result = { from: null, to: null };
    const cleanMessage = message.toLowerCase().trim();
    
    // Enhanced patterns for better extraction (English and Tagalog)
    const patterns = [
      // "Magkano mula X hanggang Y"
      /(?:magkano|pamasahe|how much|fare).*?(?:mula|from)\s+([^\s]+(?:\s+[^\s]+)*?)\s+(?:hanggang|papunta\s+sa|to)\s+(.+?)(?:\?|$)/i,
      // "From X to Y"  
      /(?:from|mula)\s+([^\s]+(?:\s+[^\s]+)*?)\s+(?:hanggang|papunta\s+sa|to)\s+(.+?)(?:\?|$)/i,
      // "X to Y"
      /([a-zA-Z\s]+)\s+(?:hanggang|to|papunta)\s+(.+?)(?:\?|$)/i,
    ];
    
    for (const pattern of patterns) {
      const match = cleanMessage.match(pattern);
      if (match) {
        let fromLoc = match[1].replace(/^(magkano|how much|fare|pamasahe)\s*/i, '').trim();
        let toLoc = match[2].replace(/\?$/, '').trim();
        
        result.from = this.findBestLocationMatch(fromLoc);
        result.to = this.findBestLocationMatch(toLoc);
        
        if (result.from && result.to) {
          console.log(`✅ Extracted locations: "${result.from}" → "${result.to}"`);
          break;
        }
      }
    }
    
    return result;
  }

  /**
   * Find best matching checkpoint name
   */
  findBestLocationMatch(location) {
    const cleanLoc = location.toLowerCase().trim();
    
    // Common checkpoint names
    const checkpoints = [
      'SM Epza', 'Robinson Tejero', 'Malabon', 'Riverside', 'Lancaster New City',
      'Pasong Camachile I', 'Open Canal', 'Santiago', 'Bella Vista', 'San Francisco',
      'Country Meadow', 'Pabahay', 'Monterey', 'Langkaan', 'Tierra Vista',
      'Robinson Dasmariñas', 'SM Dasmariñas'
    ];
    
    // Enhanced aliases
    const aliases = {
      'sm': 'SM Epza', 'sm epza': 'SM Epza', 'epza': 'SM Epza',
      'sm dasma': 'SM Dasmariñas', 'dasma': 'SM Dasmariñas', 'sm dasmariñas': 'SM Dasmariñas',
      'lancaster': 'Lancaster New City', 'lanc': 'Lancaster New City',
      'pascam': 'Pasong Camachile I', 'pasong camachile': 'Pasong Camachile I',
      'rob tejero': 'Robinson Tejero', 'robinson': 'Robinson Tejero',
      'monterey': 'Monterey', 'mont': 'Monterey'
    };
    
    // Check aliases first
    if (aliases[cleanLoc]) return aliases[cleanLoc];
    
    // Exact match
    let match = checkpoints.find(cp => cp.toLowerCase() === cleanLoc);
    if (match) return match;
    
    // Fuzzy matching
    match = checkpoints.find(cp => cp.toLowerCase().includes(cleanLoc) || cleanLoc.includes(cp.toLowerCase()));
    if (match) return match;
    
    return null;
  }

  /**
   * Gather system context for AI responses
   */
  async gatherSystemContext() {
    try {
      const context = {
        availableLocations: [],
        routes: [],
        activeJeepneys: [],
        jeepneyLocations: [],
        fareMatrix: [],
        currentTime: new Date().toLocaleString('en-PH', { timeZone: 'Asia/Manila' }),
        systemInfo: 'LakbAI Jeepney Transportation System - Admin Panel - Cavite, Philippines'
      };

      // Try to fetch real-time data
      try {
        // Fetch routes
        const routesData = await this.getRoutes();
        if (routesData && routesData.status === 'success' && Array.isArray(routesData.routes)) {
          context.routes = routesData.routes;
        } else {
          console.warn('⚠️ Routes data is not valid:', routesData);
        }

        // Fetch jeepneys
        const jeepneysData = await this.getJeepneys();
        if (jeepneysData && jeepneysData.status === 'success' && Array.isArray(jeepneysData.jeepneys)) {
          context.activeJeepneys = jeepneysData.jeepneys;
        } else {
          console.warn('⚠️ Jeepneys data is not valid:', jeepneysData);
        }

        // Fetch checkpoints
        const checkpointsData = await this.getAllCheckpoints();
        if (checkpointsData && checkpointsData.status === 'success' && Array.isArray(checkpointsData.checkpoints)) {
          context.availableLocations = checkpointsData.checkpoints.map(cp => cp.checkpoint_name || 'Unknown');
        } else {
          console.warn('⚠️ Checkpoints data is not valid:', checkpointsData);
        }

        // Get system stats
        const statsData = await this.getSystemStats();
        if (statsData && statsData.status === 'success') {
          context.systemStats = statsData.stats;
        }

      } catch (error) {
        console.warn('⚠️ Some context data could not be fetched:', error);
      }

      return context;
    } catch (error) {
      console.error('❌ Failed to gather system context:', error);
      return {
        availableLocations: [],
        routes: [],
        activeJeepneys: [],
        jeepneyLocations: [],
        fareMatrix: [],
        currentTime: new Date().toLocaleString('en-PH', { timeZone: 'Asia/Manila' }),
        systemInfo: 'LakbAI Jeepney Transportation System - Admin Panel - Cavite, Philippines'
      };
    }
  }

  /**
   * Cache management
   */
  getFromCache(key) {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return cached.data;
    }
    return null;
  }

  setCache(key, data) {
    this.cache.set(key, { data, timestamp: Date.now() });
  }

  // Get all routes
  async getRoutes() {
    try {
      const response = await fetch(`${API_BASE_URL}/routes`);
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching routes:', error);
      return { status: 'error', message: 'Failed to fetch routes' };
    }
  }

  // Get checkpoints for a specific route
  async getCheckpointsByRoute(routeId) {
    try {
      const response = await fetch(`${API_BASE_URL}/routes/${routeId}/checkpoints`);
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching checkpoints:', error);
      return { status: 'error', message: 'Failed to fetch checkpoints' };
    }
  }

  // Get all checkpoints
  async getAllCheckpoints() {
    try {
      const routesResponse = await this.getRoutes();
      if (routesResponse.status !== 'success') {
        return routesResponse;
      }

      const allCheckpoints = [];
      for (const route of routesResponse.routes) {
        const checkpointsResponse = await this.getCheckpointsByRoute(route.id);
        if (checkpointsResponse.status === 'success') {
          allCheckpoints.push(...checkpointsResponse.checkpoints);
        }
      }
      
      return { status: 'success', checkpoints: allCheckpoints };
    } catch (error) {
      console.error('Error fetching all checkpoints:', error);
      return { status: 'error', message: 'Failed to fetch checkpoints' };
    }
  }

  // Get fare between two checkpoints
  async getFareBetweenCheckpoints(fromCheckpointId, toCheckpointId, routeId = null) {
    try {
      let url = `${API_BASE_URL}/fare-matrix/fare/${fromCheckpointId}/${toCheckpointId}`;
      if (routeId) {
        url += `?route_id=${routeId}`;
      }
      
      const response = await fetch(url);
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching fare:', error);
      return { status: 'error', message: 'Failed to fetch fare information' };
    }
  }

  // Get fare matrix for a route
  async getFareMatrixForRoute(routeId) {
    try {
      const response = await fetch(`${API_BASE_URL}/fare-matrix/route/${routeId}`);
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching fare matrix:', error);
      return { status: 'error', message: 'Failed to fetch fare matrix' };
    }
  }

  // Get all jeepneys
  async getJeepneys() {
    try {
      const response = await fetch(`${API_BASE_URL}/jeepneys`);
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching jeepneys:', error);
      return { status: 'error', message: 'Failed to fetch jeepneys' };
    }
  }

  // Get driver locations for a route (real-time data)
  async getDriverLocationsForRoute(routeId) {
    try {
      const response = await fetch(`${API_BASE_URL}/mobile/locations/route/${routeId}`);
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching driver locations:', error);
      return { status: 'error', message: 'Failed to fetch driver locations' };
    }
  }

  // Search for checkpoints by name
  async searchCheckpoints(query) {
    try {
      const allCheckpointsResponse = await this.getAllCheckpoints();
      if (allCheckpointsResponse.status !== 'success') {
        return allCheckpointsResponse;
      }

      const filteredCheckpoints = allCheckpointsResponse.checkpoints.filter(checkpoint =>
        checkpoint.checkpoint_name.toLowerCase().includes(query.toLowerCase())
      );

      return { status: 'success', checkpoints: filteredCheckpoints };
    } catch (error) {
      console.error('Error searching checkpoints:', error);
      return { status: 'error', message: 'Failed to search checkpoints' };
    }
  }

  // Get checkpoint coordinates
  async getCheckpointCoordinates(checkpointName) {
    try {
      const response = await fetch(`${API_BASE_URL}/checkpoints/coordinates/${encodeURIComponent(checkpointName)}`);
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching checkpoint coordinates:', error);
      return { status: 'error', message: 'Failed to fetch checkpoint coordinates' };
    }
  }

  // Calculate fare between two checkpoint names
  async calculateFareByNames(fromCheckpointName, toCheckpointName) {
    try {
      // First, find the checkpoint IDs
      const allCheckpointsResponse = await this.getAllCheckpoints();
      if (allCheckpointsResponse.status !== 'success') {
        return allCheckpointsResponse;
      }

      console.log('Looking for checkpoints:', fromCheckpointName, 'to', toCheckpointName);
      console.log('Available checkpoints:', allCheckpointsResponse.checkpoints.map(cp => cp.checkpoint_name));

      const fromCheckpoint = allCheckpointsResponse.checkpoints.find(cp => 
        cp.checkpoint_name.toLowerCase() === fromCheckpointName.toLowerCase()
      );
      const toCheckpoint = allCheckpointsResponse.checkpoints.find(cp => 
        cp.checkpoint_name.toLowerCase() === toCheckpointName.toLowerCase()
      );

      console.log('Found from checkpoint:', fromCheckpoint);
      console.log('Found to checkpoint:', toCheckpoint);

      if (!fromCheckpoint || !toCheckpoint) {
        return { 
          status: 'error', 
          message: `Checkpoints not found. Looking for: "${fromCheckpointName}" and "${toCheckpointName}". Available checkpoints: ${allCheckpointsResponse.checkpoints.map(cp => cp.checkpoint_name).join(', ')}` 
        };
      }

      // Calculate fare
      const fareResult = await this.getFareBetweenCheckpoints(
        fromCheckpoint.id, 
        toCheckpoint.id, 
        fromCheckpoint.route_id
      );

      console.log('Fare calculation result:', fareResult);
      return fareResult;
    } catch (error) {
      console.error('Error calculating fare by names:', error);
      return { status: 'error', message: 'Failed to calculate fare' };
    }
  }

  // Get system statistics
  async getSystemStats() {
    try {
      const [routesResponse, jeepneysResponse, fareMatrixResponse] = await Promise.all([
        this.getRoutes(),
        this.getJeepneys(),
        fetch(`${API_BASE_URL}/fare-matrix/stats`).then(res => res.json())
      ]);

      return {
        status: 'success',
        stats: {
          totalRoutes: routesResponse.routes?.length || 0,
          totalJeepneys: jeepneysResponse.jeepneys?.length || 0,
          fareMatrixStats: fareMatrixResponse.stats || {}
        }
      };
    } catch (error) {
      console.error('Error fetching system stats:', error);
      return { status: 'error', message: 'Failed to fetch system statistics' };
    }
  }
}

// Create and export the enhanced service instance
const biyaBotServiceInstance = new BiyaBotService();
export default biyaBotServiceInstance;
