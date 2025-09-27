/**
 * BiyaBot Service - Intelligent Multilingual Assistant
 */

import { getBaseUrl } from '../../config/apiConfig';

interface BotResponse {
  message: string;
  type: 'text' | 'data' | 'error';
  suggestions?: string[];
  data?: any;
}

interface QuickQuestion {
  id: string;
  text: string;
  category?: 'fare' | 'route' | 'time' | 'emergency';
}

// Common locations and checkpoints
const CHECKPOINTS = [
  'SM Epza', 'Robinson Tejero', 'Malabon', 'Riverside', 'Lancaster New City',
  'Pasong Camachile I', 'Open Canal', 'Santiago', 'Bella Vista', 'San Francisco',
  'Country Meadow', 'Pabahay', 'Monterey', 'Langkaan', 'Tierra Vista',
  'Robinson Dasmariñas', 'SM Dasmariñas'
];

// Language patterns for detection
const TAGALOG_PATTERNS = [
  'magkano', 'saan', 'paano', 'ilan', 'nasaan', 'kelan', 'kailan', 'ano', 'sino',
  'bayad', 'pamasahe', 'presyo', 'ruta', 'daan', 'direksyon',
  'jeep', 'sasakyan', 'sakay', 'sumakay', 'baba', 'tawid',
  'terminal', 'biyahe', 'oras', 'galing', 'papunta', 'malapit'
];

const FARE_KEYWORDS_EN = [
  'fare', 'cost', 'price', 'how much', 'pay', 'payment', 'ticket', 'fee'
];
const FARE_KEYWORDS_TL = [
  'magkano', 'bayad', 'pamasahe', 'presyo', 'gastos'
];

const ROUTE_KEYWORDS_EN = [
  'route', 'way', 'path', 'how to get', 'direction', 'navigate', 'travel to', 'going to'
];
const ROUTE_KEYWORDS_TL = [
  'ruta', 'daan', 'paano', 'papunta', 'direksyon', 'galing', 'biyahe'
];

const JEEPNEY_KEYWORDS_EN = [
  'jeepney', 'jeep', 'vehicle', 'driver', 'available', 'nearby jeep', 'location', 'where is'
];
const JEEPNEY_KEYWORDS_TL = [
  'jeep', 'sasakyan', 'driver', 'may jeep', 'nasaan ang jeep', 'terminal', 'pwesto'
];

class BiyaBotService {
  private baseUrl: string;
  private cache: Map<string, { data: any; timestamp: number }> = new Map();
  private readonly CACHE_DURATION = 30 * 1000; // 30 seconds for real-time updates

  constructor() {
    this.baseUrl = getBaseUrl();
    console.log('🤖 BiyaBot initialized with base URL:', this.baseUrl);
  }

  /**
   * Main message processing function
   */
  async processMessage(message: string): Promise<BotResponse> {
    try {
      console.log('🤖 Processing message:', message);
      
      const cleanMessage = message.trim().toLowerCase();
      const isTagalog = this.detectLanguage(cleanMessage);
      
      console.log('🌐 Detected language:', isTagalog ? 'Tagalog' : 'English');

      // Determine intent and respond accordingly
      if (this.isFareQuery(cleanMessage)) {
        return await this.handleFareQuery(cleanMessage, isTagalog);
      } else if (this.isRouteQuery(cleanMessage)) {
        return await this.handleRouteQuery(cleanMessage, isTagalog);
      } else if (this.isJeepneyQuery(cleanMessage)) {
        return await this.handleJeepneyQuery(cleanMessage, isTagalog);
      } else if (this.isTimeQuery(cleanMessage)) {
        return await this.handleTimeQuery(cleanMessage, isTagalog);
      } else if (this.isEmergencyQuery(cleanMessage)) {
        return this.handleEmergencyQuery(cleanMessage, isTagalog);
      } else if (this.isGreeting(cleanMessage)) {
        return this.handleGreeting(cleanMessage, isTagalog);
      } else {
        return this.handleGeneralQuery(cleanMessage, isTagalog);
      }
    } catch (error) {
      console.error('❌ Error processing message:', error);
      return {
        message: 'Sorry, I encountered an error. Please try again!',
        type: 'error'
      };
    }
  }

  /**
   * Detect if the message is in Tagalog
   */
  private detectLanguage(message: string): boolean {
    const words = message.split(' ');
    let tagalogWords = 0;
    
    words.forEach(word => {
      if (TAGALOG_PATTERNS.some(pattern => word.includes(pattern))) {
        tagalogWords++;
      }
    });
    
    return tagalogWords > 0;
  }

  /**
   * Check if query is about fares
   */
  private isFareQuery(message: string): boolean {
    const fareKeywords = [...FARE_KEYWORDS_EN, ...FARE_KEYWORDS_TL];
    return fareKeywords.some(keyword => message.includes(keyword));
  }

  /**
   * Handle fare-related queries
   */
  private async handleFareQuery(message: string, isTagalog: boolean): Promise<BotResponse> {
    try {
      console.log('💰 Handling fare query:', message);
      
      // Try to extract locations from the message
      const locations = this.extractLocations(message);
      console.log('🔍 Extracted locations:', locations);
      
      if (locations.from && locations.to) {
        // Get specific fare between two points
        const fare = await this.calculateFare(locations.from, locations.to);
        console.log('💵 Calculated fare:', fare);
        
        if (fare) {
          // Natural bilingual response (Taglish style)
          const responseMessage = isTagalog 
            ? `Pamasahe from ${locations.from} to ${locations.to} is ₱${fare.toFixed(2)}. Gusto mo bang makita ang route details?`
            : `Fare from ${locations.from} to ${locations.to} is ₱${fare.toFixed(2)}. Want to see the route details?`;

          return {
            message: responseMessage,
            type: 'data',
            suggestions: isTagalog 
              ? ['Route details', 'Available jeepneys', 'Mga oras ng jeep']
              : ['Route details', 'Available jeepneys', 'Jeepney schedules']
          };
        }
      }

      // If locations not found, be more helpful
      const baseFare = await this.getBaseFare();
      
      // Extract any location mentioned for partial help
      const mentionedLocations = CHECKPOINTS.filter(cp => 
        message.toLowerCase().includes(cp.toLowerCase().split(' ')[0])
      );
      
      if (mentionedLocations.length > 0) {
        return {
          message: isTagalog
            ? `Minimum fare is ₱${baseFare.toFixed(2)}. Nakita ko "${mentionedLocations[0]}" - saan ka pupunta? Example: "Magkano ${mentionedLocations[0]} to Robinson?"`
            : `Minimum fare is ₱${baseFare.toFixed(2)}. I see "${mentionedLocations[0]}" - where are you going? Example: "How much ${mentionedLocations[0]} to Robinson?"`,
          type: 'text',
          suggestions: isTagalog
            ? [`${mentionedLocations[0]} to Robinson?`, `${mentionedLocations[0]} to SM Dasmariñas?`, 'Show all routes']
            : [`${mentionedLocations[0]} to Robinson?`, `${mentionedLocations[0]} to SM Dasmariñas?`, 'Show all routes']
        };
      }

      return {
        message: isTagalog
          ? `Minimum fare ay ₱${baseFare.toFixed(2)}. Sabihin mo lang "Magkano [from] to [destination]" para sa exact fare. 😊`
          : `Minimum fare is ₱${baseFare.toFixed(2)}. Just say "How much [from] to [destination]" for exact fare. 😊`,
        type: 'text',
        suggestions: isTagalog
          ? ['Magkano SM Epza to Robinson?', 'Magkano Lancaster to Dasma?', 'Show all routes']
          : ['How much SM Epza to Robinson?', 'How much Lancaster to Dasma?', 'Show all routes']
      };
    } catch (error) {
      console.error('❌ Error in fare query:', error);
      return {
        message: isTagalog
          ? 'Sorry, hindi ko ma-calculate ang fare ngayon. Try ulit in a few seconds? 🤔'
          : 'Sorry, cannot calculate fare right now. Try again in a few seconds? 🤔',
        type: 'error'
      };
    }
  }

  /**
   * Extract location names from message
   */
  private extractLocations(message: string): { from?: string; to?: string } {
    const result: { from?: string; to?: string } = {};
    
    // Enhanced patterns for better extraction (English and Tagalog)
    const patterns = [
      // "Magkano from X to Y" or "How much from X to Y"
      /(?:magkano|how much|fare).*?(?:from|mula)\s+([^\s]+(?:\s+[^\s]+)*?)\s+(?:to|hanggang|papunta(?:\s+sa)?)\s+(.+?)(?:\?|$)/i,
      
      // "Magkano mula X hanggang Y" or "From X to Y"
      /(?:from|mula)\s+([^\s]+(?:\s+[^\s]+)*?)\s+(?:to|hanggang|papunta(?:\s+sa)?)\s+(.+?)(?:\?|$)/i,
      
      // "Magkano X papuntang Y" - common Tagalog pattern
      /(?:magkano|pamasahe)\s+([^\s]+(?:\s+[^\s]+)*?)\s+(?:papunta(?:\s+sa)?|papuntang)\s+(.+?)(?:\?|$)/i,
      
      // "X to Y" or "X hanggang Y"
      /([^\s]+(?:\s+[^\s]+)*?)\s+(?:to|hanggang|papunta(?:\s+sa)?|papuntang)\s+(.+?)(?:\?|$)/i
    ];
    
    for (const pattern of patterns) {
      const match = message.match(pattern);
      if (match) {
        let [, fromLoc, toLoc] = match;
        
        // Clean up the extracted locations
        fromLoc = fromLoc.replace(/^(magkano|how much|fare|pamasahe)\s*/i, '').trim();
        toLoc = toLoc.replace(/\?$/, '').trim();
        
        result.from = this.findBestLocationMatch(fromLoc);
        result.to = this.findBestLocationMatch(toLoc);
        
        if (result.from && result.to) {
          break;
        }
      }
    }
    
    return result;
  }

  /**
   * Find the best matching location from available checkpoints
   */
  private findBestLocationMatch(location: string): string | undefined {
    const cleanLoc = location.toLowerCase().trim();
    
    // Enhanced aliases for common abbreviations and variations
    const locationAliases: { [key: string]: string } = {
      'sm': 'SM Epza',
      'sm epza': 'SM Epza',
      'epza': 'SM Epza',
      'robinson': 'Robinson Tejero',  
      'rob': 'Robinson Tejero',
      'tejero': 'Robinson Tejero',
      'lancaster': 'Lancaster New City',
      'dasmariñas': 'SM Dasmariñas',
      'dasma': 'SM Dasmariñas',
      'sm dasma': 'SM Dasmariñas',
      'sm dasmariñas': 'SM Dasmariñas',
      'monterey': 'Monterey',
      'pabahay': 'Pabahay',
      'langkaan': 'Langkaan',
      'tierra vista': 'Tierra Vista',
      'country meadow': 'Country Meadow',
      'san francisco': 'San Francisco',
      'bella vista': 'Bella Vista',
      'santiago': 'Santiago',
      'open canal': 'Open Canal',
      'pasong camachile': 'Pasong Camachile I',
      'pascam' : 'Pasong Camachile I',
      'camachile': 'Pasong Camachile I',
      'riverside': 'Riverside',
      'malabon': 'Malabon'
    };
    
    // Check aliases first
    if (locationAliases[cleanLoc]) {
      return locationAliases[cleanLoc];
    }
    
    // Exact match
    let match = CHECKPOINTS.find(cp => cp.toLowerCase() === cleanLoc);
    if (match) return match;
    
    // Partial match - prioritize matches that start with the search term
    match = CHECKPOINTS.find(cp => cp.toLowerCase().startsWith(cleanLoc));
    if (match) return match;
    
    // Check if the search term is contained within any checkpoint name
    match = CHECKPOINTS.find(cp => cp.toLowerCase().includes(cleanLoc));
    if (match) return match;
    
    // Broader partial match (reverse - checkpoint name contained in search term)
    match = CHECKPOINTS.find(cp => cleanLoc.includes(cp.toLowerCase()));
    if (match) return match;
    
    return undefined;
  }

  /**
   * Calculate fare between two locations using backend data
   */
  private async calculateFare(from: string, to: string): Promise<number | null> {
    try {
      // Get routes with checkpoint data
      const routes = await this.getAvailableRoutes();
      
      for (const route of routes) {
        if (route.checkpoints) {
          const fromCheckpoint = route.checkpoints.find((cp: any) => 
            cp.checkpoint_name?.toLowerCase() === from.toLowerCase()
          );
          const toCheckpoint = route.checkpoints.find((cp: any) => 
            cp.checkpoint_name?.toLowerCase() === to.toLowerCase()
          );
          
          if (fromCheckpoint && toCheckpoint) {
            // Calculate fare based on sequence order difference
            const fromSequence = fromCheckpoint.sequence_order;
            const toSequence = toCheckpoint.sequence_order;
            const distance = Math.abs(toSequence - fromSequence);
            
            // Use the base fare and calculate additional fare
            const baseFare = parseFloat(route.fare_base || '13');
            const additionalFare = Math.max(0, (distance - 1) * 2);
            
            return baseFare + additionalFare;
          }
        }
      }
      
      // Fallback calculation if not found in routes
      const fromIndex = CHECKPOINTS.indexOf(from);
      const toIndex = CHECKPOINTS.indexOf(to);
      
      if (fromIndex === -1 || toIndex === -1) return null;
      
      const distance = Math.abs(fromIndex - toIndex);
      const baseFare = 13;
      const additionalFare = Math.max(0, (distance - 1) * 2);
      
      return baseFare + additionalFare;
    } catch (error) {
      console.error('Error calculating fare:', error);
      return null;
    }
  }

  /**
   * Get base fare from backend
   */
  private async getBaseFare(): Promise<number> {
    try {
      const cached = this.getFromCache('base_fare');
      if (cached) return cached;

      // Get base fare from routes data
      const routes = await this.getAvailableRoutes();
      if (routes.length > 0 && routes[0].fare_base) {
        const baseFare = parseFloat(routes[0].fare_base);
        this.setCache('base_fare', baseFare);
        return baseFare;
      }

      const defaultFare = 13;
      this.setCache('base_fare', defaultFare);
      return defaultFare;
    } catch (error) {
      console.error('Error getting base fare:', error);
      return 13; // Default base fare
    }
  }

  /**
   * Check if query is about routes
   */
  private isRouteQuery(message: string): boolean {
    const routeKeywords = [...ROUTE_KEYWORDS_EN, ...ROUTE_KEYWORDS_TL];
    return routeKeywords.some(keyword => message.includes(keyword));
  }

  /**
   * Handle route-related queries
   */
  private async handleRouteQuery(message: string, isTagalog: boolean): Promise<BotResponse> {
    try {
      console.log('🗺️ Handling route query');
      
      const routes = await this.getAvailableRoutes();
      const routeList = routes.map((route: any) => `🚌 ${route.name || route.route_name}`).join('\n');
      
      return {
        message: isTagalog
          ? `Available routes:\n\n${routeList}\n\nSaan ka pupunta? Just say "Magkano [from] to [where]" 😊`
          : `Available routes:\n\n${routeList}\n\nWhere are you going? Just say "How much [from] to [where]" 😊`,
        type: 'data',
        data: routes,
        suggestions: isTagalog
          ? ['Magkano SM to Robinson?', 'Magkano Lancaster to Dasma?', 'Show jeepneys']
          : ['How much SM to Robinson?', 'How much Lancaster to Dasma?', 'Show jeepneys']
      };
    } catch (error) {
      console.error('❌ Error in route query:', error);
      return {
        message: isTagalog
          ? 'Hindi ko makuha ang routes ngayon. Try ulit? 😅'
          : 'Cannot get routes right now. Try again? 😅',
        type: 'error'
      };
    }
  }

  /**
   * Get available routes from backend
   */
  private async getAvailableRoutes(): Promise<any[]> {
    try {
      const cached = this.getFromCache('routes');
      if (cached) return cached;

      console.log('🔍 Fetching routes from:', `${this.baseUrl}/routes`);
      const response = await fetch(`${this.baseUrl}/routes`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 5000,
      } as any);
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Routes data received:', data);
        
        if (data.status === 'success' && data.routes) {
          const routes = data.routes.map((route: any) => ({
            ...route,
            name: route.route_name,
            checkpoints: route.checkpoints || []
          }));
          this.setCache('routes', routes);
          return routes;
        }
      } else {
        console.error('❌ Routes API response not ok:', response.status);
      }
    } catch (error) {
      console.error('❌ Error fetching routes:', error);
    }
    
    // Return default routes if API fails
    console.log('🔄 Using fallback routes data');
    const defaultRoutes = [
      { name: 'SM Epza → SM Dasmariñas', id: 1, fare_base: '13.00' },
      { name: 'SM Dasmariñas → SM Epza', id: 2, fare_base: '13.00' }
    ];
    return defaultRoutes;
  }

  /**
   * Check if query is about jeepneys
   */
  private isJeepneyQuery(message: string): boolean {
    const jeepneyKeywords = [...JEEPNEY_KEYWORDS_EN, ...JEEPNEY_KEYWORDS_TL];
    return jeepneyKeywords.some(keyword => message.includes(keyword));
  }

  /**
   * Handle jeepney-related queries
   */
  private async handleJeepneyQuery(message: string, isTagalog: boolean): Promise<BotResponse> {
    try {
      console.log('🚌 Handling jeepney query:', message);
      
      // Check if user wants fresh data (refresh keywords)
      const isRefreshRequest = this.isRefreshRequest(message);
      const isLocationSpecific = this.isLocationQuery(message);
      
      if (isRefreshRequest) {
        console.log('🔄 Refresh requested, clearing cache');
        this.clearCache('jeepneys');
      }
      
      console.log('🔍 Query analysis:', { isRefreshRequest, isLocationSpecific });
      
      const jeepneys = await this.getAvailableJeepneys();
      console.log('📊 All jeepneys data:', jeepneys);
      
      // Check if user is asking about a specific location
      const mentionedLocation = this.findBestLocationMatch(message);
      console.log('📍 Mentioned location:', mentionedLocation);
      
      // Enhanced active jeep detection
      const activeJeeps = jeepneys.filter((jeep: any) => {
        const isActive = jeep.computed_status === 'active' || 
                        jeep.status === 'active' || 
                        jeep.shift_status === 'on_shift';
        
        console.log(`🚌 ${jeep.jeepney_number}: status=${jeep.status}, computed_status=${jeep.computed_status}, shift_status=${jeep.shift_status}, isActive=${isActive}`);
        return isActive;
      });
      
      // If user mentioned a specific location OR asked about locations, get real-time location data
      let relevantJeeps = activeJeeps;
      let locationData: any[] = [];
      
      if (mentionedLocation || isLocationSpecific) {
        console.log('🔍 Getting location data for:', mentionedLocation || 'all locations');
        
        let routesToCheck: number[] = [];
        
        if (mentionedLocation) {
          // Get location data for all routes that pass through the mentioned location
          routesToCheck = activeJeeps
            .filter((jeep: any) => {
              const routePassesThrough = jeep.route_name?.toLowerCase().includes(mentionedLocation.toLowerCase()) ||
                                       CHECKPOINTS.some(checkpoint => 
                                         checkpoint === mentionedLocation && 
                                         jeep.route_name?.toLowerCase().includes(checkpoint.toLowerCase())
                                       );
              return routePassesThrough;
            })
            .map((jeep: any) => jeep.route_id)
            .filter((value: any, index: any, self: any) => self.indexOf(value) === index); // unique route IDs
        } else {
          // If asking about locations generally, check all routes with active jeepneys
          routesToCheck = activeJeeps
            .map((jeep: any) => jeep.route_id)
            .filter((value: any, index: any, self: any) => self.indexOf(value) === index); // unique route IDs
        }
        
        console.log('🛣️ Routes to check for locations:', routesToCheck);
        
        // Fetch location data for relevant routes
        for (const routeId of routesToCheck) {
          const routeLocations = await this.getJeepneyLocations(routeId);
          locationData = [...locationData, ...routeLocations];
        }
        
        // If we have location data, merge it with jeepney data
        if (locationData.length > 0) {
          // For location queries, prioritize jeepneys that have recent location data
          relevantJeeps = activeJeeps.filter((jeep: any) => {
            const hasLocationData = locationData.some((loc: any) => loc.jeepney_number === jeep.jeepney_number);
            return mentionedLocation ? hasLocationData : true; // For general location queries, show all active jeeps
          });
        }
      }
      
      const onShiftJeeps = jeepneys.filter((jeep: any) => jeep.shift_status === 'on_shift');
      console.log('🟢 Active jeeps found:', activeJeeps.length);
      console.log('🔄 On-shift jeeps found:', onShiftJeeps.length);
      console.log('📍 Location-relevant jeeps:', relevantJeeps.length);
      
      // Use location-relevant jeeps if user specified a location, otherwise use all active jeeps
      const jeepsToShow = mentionedLocation && relevantJeeps.length > 0 ? relevantJeeps : activeJeeps;
      
      if (jeepsToShow.length > 0) {
        // Show up to 6 jeepneys with location data if available
        const jeepneyInfo = jeepsToShow.slice(0, 6).map((jeep: any) => {
          // Find location data for this jeepney
          const locationInfo = locationData.find((loc: any) => loc.jeepney_number === jeep.jeepney_number);
          
          let statusText = `🟢 ${jeep.jeepney_number} - ${jeep.route_name}\n   Driver: ${jeep.driver_name || 'N/A'} [${jeep.shift_status}]`;
          
          if (locationInfo) {
            const lastUpdate = locationInfo.minutes_since_update || 0;
            const timeText = lastUpdate < 5 ? 'just now' : `${lastUpdate} mins ago`;
            statusText += `\n   📍 Last seen: ${locationInfo.last_scanned_checkpoint} (${timeText})`;
            
            if (locationInfo.estimated_arrival && locationInfo.estimated_arrival !== 'N/A') {
              statusText += `\n   ⏱️ ETA: ${locationInfo.estimated_arrival}`;
            }
          }
          
          return statusText;
        }).join('\n\n');
        
        const totalCount = jeepsToShow.length;
        const showingCount = Math.min(jeepsToShow.length, 6);
        const moreText = totalCount > 6 ? ` (showing ${showingCount} of ${totalCount})` : '';
        
        const locationText = mentionedLocation ? ` near ${mentionedLocation}` : '';
        const hasLocationData = locationData.length > 0;
        
        return {
          message: isTagalog
            ? `May ${totalCount} active jeeps${locationText}${moreText}:\n\n${jeepneyInfo}\n\n${hasLocationData ? '📍 Real-time locations shown! ' : ''}${mentionedLocation ? `Check mo sa ${mentionedLocation}! 😊` : 'Saan mo gusto sumakay? 😊'}`
            : `There are ${totalCount} active jeeps${locationText}${moreText}:\n\n${jeepneyInfo}\n\n${hasLocationData ? '📍 Real-time locations shown! ' : ''}${mentionedLocation ? `Check them at ${mentionedLocation}! 😊` : 'Where do you want to ride? 😊'}`,
          type: 'data',
          data: { jeepneys: jeepsToShow, locations: locationData },
          suggestions: isTagalog
            ? ['Refresh locations', 'Jeep sa SM Epza', 'Show all jeeps']
            : ['Refresh locations', 'Jeep at SM Epza', 'Show all jeeps']
        };
      } else {
        // Show more inactive jeepneys for reference (up to 5)
        const allJeepsInfo = jeepneys.slice(0, 5).map((jeep: any) => 
          `🔴 ${jeep.jeepney_number} - ${jeep.route_name}\n   Driver: ${jeep.driver_name || 'N/A'} [${jeep.shift_status || jeep.computed_status}]`
        ).join('\n\n');
        
        const totalCount = jeepneys.length;
        const showingCount = Math.min(jeepneys.length, 5);
        const moreText = totalCount > 5 ? ` (showing ${showingCount} of ${totalCount})` : '';
        
        return {
          message: isTagalog
            ? `Walang active jeeps right now 🚫\n\n${totalCount > 0 ? `Available jeeps${moreText}:\n\n${allJeepsInfo}\n\n` : ''}Check mo sa terminals kung may mag-shift pa! 🚏`
            : `No active jeeps right now 🚫\n\n${totalCount > 0 ? `Available jeeps${moreText}:\n\n${allJeepsInfo}\n\n` : ''}Check at terminals if any will go on shift! 🚏`,
          type: 'data',
          data: jeepneys,
          suggestions: isTagalog
            ? ['Refresh status', 'Check terminals', 'Routes available']
            : ['Refresh status', 'Check terminals', 'Routes available']
        };
      }
    } catch (error) {
      console.error('❌ Error in jeepney query:', error);
      return {
        message: isTagalog
          ? 'Hindi ko makuha ang jeepney info ngayon. Try ulit? 😅'
          : 'Cannot get jeepney info right now. Try again? 😅',
        type: 'error'
      };
    }
  }

  /**
   * Get jeepney locations for a specific route
   */
  private async getJeepneyLocations(routeId: number): Promise<any[]> {
    try {
      console.log('📍 Fetching jeepney locations for route:', routeId);
      const response = await fetch(`${this.baseUrl}/mobile/locations/route/${routeId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 5000,
      } as any);
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Location data received:', data);
        
        if (data.status === 'success' && data.driver_locations) {
          return data.driver_locations;
        }
      } else {
        console.error('❌ Location API response not ok:', response.status);
      }
    } catch (error) {
      console.error('❌ Error fetching locations:', error);
    }
    
    return [];
  }

  /**
   * Get available jeepneys from backend
   */
  private async getAvailableJeepneys(): Promise<any[]> {
    try {
      const cached = this.getFromCache('jeepneys');
      if (cached) return cached;

      console.log('🔍 Fetching jeepneys from:', `${this.baseUrl}/jeepneys`);
      const response = await fetch(`${this.baseUrl}/jeepneys`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 5000,
      } as any);
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Jeepneys data received:', data);
        
        if (data.status === 'success' && data.jeepneys) {
          const jeepneys = data.jeepneys.map((jeep: any) => ({
            ...jeep,
            driver_name: `${jeep.first_name || ''} ${jeep.last_name || ''}`.trim(),
            status_display: jeep.computed_status || jeep.status || 'Unknown'
          }));
          
          console.log('✅ Processed jeepneys:', jeepneys.length, 'total');
          console.log('📊 Jeepney statuses:', jeepneys.map((j: any) => ({
            number: j.jeepney_number,
            status: j.status,
            computed_status: j.computed_status,
            shift_status: j.shift_status,
            driver: j.driver_name
          })));
          
          this.setCache('jeepneys', jeepneys);
          return jeepneys;
        }
      } else {
        console.error('❌ Jeepneys API response not ok:', response.status);
      }
} catch (error) {
      console.error('❌ Error fetching jeepneys:', error);
    }
    
    // Return mock data if API fails
    console.log('🔄 Using fallback jeepney data');
    return [
      { jeepney_number: 'LKB-001', route_name: 'SM Epza → SM Dasmariñas', driver_name: 'Sample Driver', status_display: 'active' },
      { jeepney_number: 'LKB-002', route_name: 'SM Dasmariñas → SM Epza', driver_name: 'Sample Driver 2', status_display: 'inactive' }
    ];
  }

  /**
   * Check if query is about time/schedule
   */
  private isTimeQuery(message: string): boolean {
    const timeKeywords = ['time', 'schedule', 'when', 'oras', 'kelan', 'anong oras'];
    return timeKeywords.some(keyword => message.includes(keyword));
  }

  /**
   * Handle time-related queries
   */
  private async handleTimeQuery(message: string, isTagalog: boolean): Promise<BotResponse> {
    return {
      message: isTagalog
        ? 'Ang mga jeepney ay gumagana mula 5:00 AM hanggang 9:00 PM. Peak hours ay 6:00-9:00 AM at 4:00-7:00 PM. Sa mga oras na ito, mas maraming available na jeep.'
        : 'Jeepneys operate from 5:00 AM to 9:00 PM. Peak hours are 6:00-9:00 AM and 4:00-7:00 PM. More jeepneys are available during these times.',
      type: 'text',
      suggestions: isTagalog
        ? ['Mga available na jeep ngayon', 'Paano pumunta sa...', 'Emergency contacts']
        : ['Available jeepneys now', 'How to get to...', 'Emergency contacts']
    };
  }

  /**
   * Check if query is about emergency
   */
  private isEmergencyQuery(message: string): boolean {
    const emergencyKeywords = ['emergency', 'help', 'urgent', 'tulong', 'emergency', 'aksidente'];
    return emergencyKeywords.some(keyword => message.includes(keyword));
  }

  /**
   * Handle emergency-related queries
   */
  private handleEmergencyQuery(message: string, isTagalog: boolean): BotResponse {
    return {
      message: isTagalog
        ? '🚨 EMERGENCY CONTACTS:\n\n• Police: 117\n• Fire: 116\n• Medical: 911\n• LakbAI Support: (+63) 915-401-2395\n\nKung may emergency, tumawag agad sa tamang numero!'  
        : '🚨 EMERGENCY CONTACTS:\n\n• Police: 117\n• Fire: 116\n• Medical: 911\n• LakbAI Support: (+63) 915-401-2395\n\nIf there\'s an emergency, call the appropriate number immediately!',
      type: 'text',
      suggestions: isTagalog
        ? ['Report driver issue', 'Report jeepney problem', 'Get help']
        : ['Report driver issue', 'Report jeepney problem', 'Get help']
    };
  }

  /**
   * Check if message is a greeting
   */
  private isGreeting(message: string): boolean {
    const greetings = ['hello', 'hi', 'hey', 'good morning', 'good afternoon', 'good evening', 
                      'kumusta', 'kamusta', 'magandang umaga', 'magandang hapon', 'magandang gabi'];
    return greetings.some(greeting => message.includes(greeting));
  }

  /**
   * Handle greeting messages
   */
  private handleGreeting(message: string, isTagalog: boolean): BotResponse {
    const responses = isTagalog
      ? [
          'Hey! Ako si Biya! 😊 Tanong mo lang - magkano, saan, kelan - alam ko yan! 🚌',
          'Kumusta! Ready na ako mag-help sa jeepney rides mo! Ano tanong mo? 🤗',
          'Hello! Ask lang ng fares, routes, o kung nasaan ang jeep - sagot agad! ✨'
        ]
      : [
          'Hey! I\'m Biya! 😊 Ask me anything - fares, routes, schedules - I got you! 🚌',
          'Hi there! Ready to help with your jeepney trips! What do you need? 🤗',
          'Hello! Just ask about fares, routes, or jeep locations - quick answers! ✨'
        ];
    
    const randomResponse = responses[Math.floor(Math.random() * responses.length)];
    
    return {
      message: randomResponse,
      type: 'text',
      suggestions: isTagalog
        ? ['Magkano SM to Robinson?', 'Nasaan ang jeep?', 'Show routes']
        : ['How much SM to Robinson?', 'Where are jeeps?', 'Show routes']
    };
  }

  /**
   * Handle general queries
   */
  private handleGeneralQuery(message: string, isTagalog: boolean): BotResponse {
    return {
      message: isTagalog
        ? 'Di ko gets yung tanong mo 🤔 Try mo:\n\n• "Magkano SM to Robinson?"\n• "Nasaan jeep papuntang Dasma?"\n• "Anong routes available?"\n\nJust ask! ✨'
        : 'I don\'t get your question 🤔 Try:\n\n• "How much SM to Robinson?"\n• "Where\'s the jeep to Dasma?"\n• "What routes available?"\n\nJust ask! ✨',
      type: 'text',
      suggestions: isTagalog
        ? ['Magkano SM to Robinson?', 'Available routes', 'Emergency contacts']
        : ['How much SM to Robinson?', 'Available routes', 'Emergency contacts']
    };
  }

  /**
   * Get quick questions for the interface
   */
  getQuickQuestions(language: 'en' | 'tl'): QuickQuestion[] {
    if (language === 'tl') {
      return [
        { id: '1', text: 'Magkano SM to Robinson?', category: 'fare' },
        { id: '2', text: 'Magkano SM Epza papuntang Monterey?', category: 'fare' },
        { id: '3', text: 'Magkano Lancaster to Dasma?', category: 'fare' },
        { id: '4', text: 'Anong routes available?', category: 'route' },
        { id: '5', text: 'May jeep ba ngayon? (refresh)', category: 'route' },
        { id: '6', text: 'Anong oras ang jeep?', category: 'time' },
        { id: '7', text: 'Emergency contacts', category: 'emergency' },
        { id: '8', text: 'Nasaan ang jeep sa SM ngayon?', category: 'route' }
      ];
    }
    
    return [
      { id: '1', text: 'How much SM to Robinson?', category: 'fare' },
      { id: '2', text: 'How much SM Epza to Monterey?', category: 'fare' },
      { id: '3', text: 'How much Lancaster to Dasma?', category: 'fare' },
      { id: '4', text: 'What routes available?', category: 'route' },
        { id: '5', text: 'Are there jeeps now? (refresh)', category: 'route' },
      { id: '6', text: 'What time do jeeps run?', category: 'time' },
      { id: '7', text: 'Emergency contacts', category: 'emergency' },
        { id: '8', text: 'Where\'s the jeep at SM now?', category: 'route' }
    ];
  }

  /**
   * Cache management
   */
  private getFromCache(key: string): any {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return cached.data;
    }
    return null;
  }

  private setCache(key: string, data: any): void {
    this.cache.set(key, { data, timestamp: Date.now() });
  }

  /**
   * Clear specific cache entry or all cache
   */
  private clearCache(key?: string): void {
    if (key) {
      this.cache.delete(key);
      console.log(`🧹 Cleared cache for: ${key}`);
    } else {
      this.cache.clear();
      console.log('🧹 Cleared all cache');
    }
  }

  /**
   * Check if user is requesting fresh/updated data
   */
  private isRefreshRequest(message: string): boolean {
    const refreshKeywords = [
      'refresh', 'update', 'latest', 'current', 'now', 'real-time',
      'bagong', 'latest', 'ngayon', 'fresh', 'bago'
    ];
    return refreshKeywords.some(keyword => message.toLowerCase().includes(keyword));
  }

  /**
   * Check if user is asking about jeepney locations specifically
   */
  private isLocationQuery(message: string): boolean {
    const locationKeywords = [
      'where', 'location', 'nasaan', 'saan', 'lugar', 'position',
      'malapit', 'near', 'currently', 'ngayon nasaan', 'nasa saan'
    ];
    
    // Also check for location-specific phrases
    const locationPhrases = [
      'nasaan ang jeep', 'where is the jeep', 'saan ang jeep',
      'jeep sa', 'jeep at', 'location ng jeep'
    ];
    
    const lowerMessage = message.toLowerCase();
    return locationKeywords.some(keyword => lowerMessage.includes(keyword)) ||
           locationPhrases.some(phrase => lowerMessage.includes(phrase));
  }
}

// Create and export the service instance
const biyaBotService = new BiyaBotService();

export { biyaBotService };
export default biyaBotService;

console.log('✅ BiyaBot service initialized successfully');
