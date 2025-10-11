/**
 * BiyaBot Service - AI-Enhanced Multilingual Assistant
 * Enhanced with Gemini AI integration for intelligent responses
 */

import { getBaseUrl } from '../../config/apiConfig';
import { GeminiService } from './geminiService';
import { getGeminiApiKey } from '../config/geminiConfig';

// Environment variable for Gemini API key - Multiple approaches
let GEMINI_API_KEY: string = '';

// Method 1: Try @env module
try {
  const env = require('@env');
  GEMINI_API_KEY = env?.GEMINI_API_KEY || '';
  console.log('🔑 Method 1 (@env):', GEMINI_API_KEY ? `SET (${GEMINI_API_KEY.length} chars)` : 'NOT SET');
} catch (error: any) {
  console.warn('⚠️ @env module not available:', error.message);
}

// Method 2: Try process.env fallback
if (!GEMINI_API_KEY && typeof process !== 'undefined' && process.env) {
  GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
  console.log('🔑 Method 2 (process.env):', GEMINI_API_KEY ? `SET (${GEMINI_API_KEY.length} chars)` : 'NOT SET');
}

// Method 3: Use config file fallback
if (!GEMINI_API_KEY) {
  GEMINI_API_KEY = getGeminiApiKey();
  console.log('🔑 Method 3 (config file):', GEMINI_API_KEY ? `SET (${GEMINI_API_KEY.length} chars)` : 'NOT SET');
}

console.log('🔑 Final API Key status:', GEMINI_API_KEY ? `LOADED (${GEMINI_API_KEY.length} chars)` : 'NOT LOADED');

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

// Enhanced language patterns for better Taglish detection
const TAGALOG_PATTERNS = [
  // Question words
  'magkano', 'saan', 'paano', 'ilan', 'nasaan', 'kelan', 'kailan', 'ano', 'sino',
  // Fare/money related
  'bayad', 'pamasahe', 'presyo', 'gastos', 'piso', 'pesos', 'singkwenta', 'tatlumpu',
  // Transportation
  'jeep', 'sasakyan', 'sakay', 'sumakay', 'baba', 'bumaba', 'tawid', 'terminal',
  'biyahe', 'ruta', 'daan', 'direksyon', 'papunta', 'galing', 'mula',
  // Common words
  'malapit', 'malayo', 'oras', 'tapos', 'hanggang', 'kaya', 'pwede', 'gusto',
  // Taglish patterns
  'mga', 'yung', 'yong', 'nung', 'nang', 'lang', 'din', 'rin', 'ba', 'po', 'opo',
  'kasi', 'pero', 'tapos', 'eh', 'ay', 'ng', 'sa', 'na', 'ni', 'nang'
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
  private geminiService: GeminiService | null = null;
  private useAI: boolean = false;

  constructor() {
    this.baseUrl = getBaseUrl();
    this.initializeGeminiService();
    console.log('🤖 BiyaBot initialized with base URL:', this.baseUrl);
  }

  /**
   * Initialize Gemini AI service if API key is available
   */
  private initializeGeminiService(): void {
    console.log('🔧 Initializing Gemini service...');
    console.log('🔑 API Key status:', GEMINI_API_KEY ? `SET (${GEMINI_API_KEY.length} chars)` : 'NOT SET');
    console.log('🔑 API Key value preview:', GEMINI_API_KEY ? GEMINI_API_KEY.substring(0, 20) + '...' : 'undefined');
    
    if (GEMINI_API_KEY && GEMINI_API_KEY.trim().length > 0) {
      try {
        this.geminiService = new GeminiService(GEMINI_API_KEY);
        this.useAI = true;
        console.log('🤖✨ Gemini AI service initialized successfully');
      } catch (error) {
        console.error('❌ Failed to initialize Gemini service:', error);
        this.useAI = false;
      }
    } else {
      console.log('ℹ️ Gemini API key not provided, using rule-based responses only');
      console.log('ℹ️ GEMINI_API_KEY variable:', GEMINI_API_KEY);
      this.useAI = false;
    }
  }

  /**
   * Main message processing function - Hybrid AI + Database
   */
  async processMessage(message: string): Promise<BotResponse> {
    try {
      console.log('🤖 Processing message:', message);
      
      const cleanMessage = message.trim().toLowerCase();
      const isTagalog = this.detectLanguage(cleanMessage);
      
      console.log('🌐 Detected language:', isTagalog ? 'Tagalog' : 'English');

      // Check if this is a specific data query that needs database access
      const needsDatabase = this.isFareQuery(cleanMessage) || 
                           this.isRouteQuery(cleanMessage) || 
                           this.isJeepneyQuery(cleanMessage);

      if (needsDatabase) {
        console.log('📊 Query needs database access, using direct database response (no AI)');
        // Use direct database logic for fast, accurate responses
        return await this.processWithRules(cleanMessage, isTagalog);
      }

      // For general conversation, use AI
      if (this.useAI && this.geminiService) {
        try {
          console.log('🤖✨ Using AI for general conversation...');
          const context = await this.gatherSystemContext();
          const aiResponse = await this.geminiService.generateResponse(message, context);
          
          if (aiResponse && aiResponse.message && aiResponse.type !== 'error') {
            console.log('✅ AI response generated successfully');
            return aiResponse;
          } else {
            console.log('⚠️ AI response was empty or error, falling back to rule-based');
          }
        } catch (error) {
          console.warn('⚠️ AI service failed, falling back to rule-based logic:', error);
        }
      }

      // Fallback to existing rule-based logic
      console.log('🔄 Using rule-based response logic');
      return await this.processWithRules(cleanMessage, isTagalog);
      
    } catch (error) {
      console.error('❌ Error processing message:', error);
      return {
        message: 'Sorry, I encountered an error. Please try again!',
        type: 'error'
      };
    }
  }

  /**
   * Rule-based message processing (original logic)
   */
  private async processWithRules(cleanMessage: string, isTagalog: boolean): Promise<BotResponse> {
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
  }

  /**
   * Gather system context for AI responses
   */
  private async gatherSystemContext(): Promise<any> {
    try {
      const context = {
        availableLocations: CHECKPOINTS,
        routes: [] as any[],
        activeJeepneys: [] as any[],
        jeepneyLocations: [] as any[],
        fareMatrix: [] as any[],
        currentTime: new Date().toLocaleString('en-PH', { timeZone: 'Asia/Manila' }),
        systemInfo: 'LakbAI Jeepney Transportation System - Cavite, Philippines'
      };

      // Try to fetch real-time data
      try {
        // Fetch routes
        const routesData = await this.fetchRoutes();
        if (Array.isArray(routesData)) {
          context.routes = routesData;
        } else {
          console.warn('⚠️ Routes data is not an array:', routesData);
        }

        // Fetch active jeepneys
        const jeepneysData = await this.fetchJeepneys();
        if (Array.isArray(jeepneysData)) {
          context.activeJeepneys = jeepneysData;
        } else {
          console.warn('⚠️ Jeepneys data is not an array:', jeepneysData);
        }

        // Fetch jeepney locations
        const locationsData = await this.fetchJeepneyLocations();
        if (Array.isArray(locationsData)) {
          context.jeepneyLocations = locationsData;
        } else {
          console.warn('⚠️ Locations data is not an array:', locationsData);
        }

        // Fetch fare matrix sample
        const fareData = await this.fetchFareMatrix();
        if (Array.isArray(fareData)) {
          context.fareMatrix = fareData;
        } else {
          console.warn('⚠️ Fare data is not an array:', fareData);
        }

      } catch (error) {
        console.warn('⚠️ Some context data could not be fetched:', error);
      }

      return context;
    } catch (error) {
      console.error('❌ Failed to gather system context:', error);
      return {
        availableLocations: CHECKPOINTS,
        routes: [] as any[],
        activeJeepneys: [] as any[],
        jeepneyLocations: [] as any[],
        fareMatrix: [] as any[],
        currentTime: new Date().toLocaleString('en-PH', { timeZone: 'Asia/Manila' }),
        systemInfo: 'LakbAI Jeepney Transportation System - Cavite, Philippines'
      };
    }
  }

  /**
   * Enhanced language detection for Taglish and constructed Tagalog
   */
  public detectLanguage(message: string): boolean {
    const lowerMessage = message.toLowerCase();
    let tagalogScore = 0;
    let totalWords = message.split(' ').length;
    
    // Check for exact Tagalog words
    TAGALOG_PATTERNS.forEach(pattern => {
      if (lowerMessage.includes(pattern.toLowerCase())) {
        tagalogScore += 2; // Higher weight for exact matches
      }
    });
    
    // Check for common Taglish patterns
    const taglishPatterns = [
      /\b(yung|yong|mga|lang|din|rin|ba|po|opo|kasi|pero|eh|ay)\b/g,
      /\b(sa|ng|na|ni|nang|mula|galing|papunta)\b/g,
      /\b(magkano|paano|saan|nasaan|kelan)\b/g
    ];
    
    taglishPatterns.forEach(pattern => {
      const matches = lowerMessage.match(pattern);
      if (matches) {
        tagalogScore += matches.length;
      }
    });
    
    // Check for Filipino sentence structures
    if (lowerMessage.includes('mula') && lowerMessage.includes('sa')) tagalogScore += 1;
    if (lowerMessage.includes('galing') && lowerMessage.includes('papunta')) tagalogScore += 1;
    if (lowerMessage.includes('magkano') && (lowerMessage.includes('to') || lowerMessage.includes('sa'))) tagalogScore += 2;
    
    // Return true if we found significant Tagalog content
    return tagalogScore >= 1 || (tagalogScore > 0 && totalWords <= 6);
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
        
        if (fare && fare > 0) {
          // Simple, direct response with fare
          const responseMessage = isTagalog 
            ? `₱${fare.toFixed(2)} ang pamasahe from ${locations.from} to ${locations.to}! 🚌`
            : `₱${fare.toFixed(2)} fare from ${locations.from} to ${locations.to}! 🚌`;

          return {
            message: responseMessage,
            type: 'data',
            suggestions: isTagalog 
              ? ['Route details', 'Available jeepneys', 'Jeep schedule']
              : ['Route details', 'Available jeepneys', 'Jeep schedule']
          };
        } else {
          // Fare calculation failed
          const responseMessage = isTagalog
            ? `Pasensya, hindi ko mahanap ang fare mula ${locations.from} hanggang ${locations.to}. Available ba ang ruta?`
            : `Sorry, I couldn't find the fare from ${locations.from} to ${locations.to}. Is this route available?`;
          
          return {
            message: responseMessage,
            type: 'error',
            suggestions: isTagalog
              ? ['Show routes', 'Available jeepneys', 'Help']
              : ['Show routes', 'Available jeepneys', 'Help']
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
   * Extract location names from message with enhanced Tagalog support
   */
  private extractLocations(message: string): { from?: string; to?: string } {
    const result: { from?: string; to?: string } = {};
    const cleanMessage = message.toLowerCase().trim();
    console.log(`🔍 Extracting locations from: "${cleanMessage}"`);
    
    // Enhanced patterns for better extraction (English and Tagalog)
    const patterns = [
      // "Magkano mula X hanggang Y" - Enhanced Tagalog pattern
      /(?:magkano|pamasahe|how much|fare).*?(?:mula|from)\s+([^\s]+(?:\s+[^\s]+)*?)\s+(?:hanggang|papunta\s+sa|to)\s+(.+?)(?:\?|$)/i,
      
      // "From X hanggang Y" or "From X to Y"  
      /(?:from|mula)\s+([^\s]+(?:\s+[^\s]+)*?)\s+(?:hanggang|papunta\s+sa|to)\s+(.+?)(?:\?|$)/i,
      
      // "X hanggang Y" or "X to Y" - Direct location pattern
      /([a-zA-Z]+(?:\s+[a-zA-Z]+)*?)\s+(?:hanggang|papunta\s+sa|to)\s+(.+?)(?:\?|$)/i,
      
      // "Magkano X papuntang Y" - common Tagalog pattern
      /(?:magkano|pamasahe|fare)\s+([^\s]+(?:\s+[^\s]+)*?)\s+(?:papunta(?:\s+sa)?|papuntang)\s+(.+?)(?:\?|$)/i,
      
      // "Hanggang Y mula X" - Reverse order pattern
      /(?:hanggang|to)\s+(.+?)\s+(?:mula|from)\s+([^\s]+(?:\s+[^\s]+)*?)(?:\?|$)/i
    ];
    
    for (const pattern of patterns) {
      const match = cleanMessage.match(pattern);
      if (match) {
        let fromLoc: string, toLoc: string;
        
        // Handle reverse order pattern
        if (pattern.source.includes('hanggang.*mula')) {
          [, toLoc, fromLoc] = match;
        } else {
          [, fromLoc, toLoc] = match;
        }
        
        // Clean up the extracted locations
        fromLoc = fromLoc.replace(/^(magkano|how much|fare|pamasahe)\s*/i, '').trim();
        toLoc = toLoc.replace(/\?$/, '').trim();
        
        console.log(`🎯 Pattern match: "${fromLoc}" → "${toLoc}"`);
        
        result.from = this.findBestLocationMatch(fromLoc);
        result.to = this.findBestLocationMatch(toLoc);
        
        if (result.from && result.to) {
          console.log(`✅ Final locations: "${result.from}" → "${result.to}"`);
          break;
        }
      }
    }
    
    return result;
  }

  /**
   * Find the best matching location from available checkpoints with enhanced fuzzy matching
   */
  private findBestLocationMatch(location: string): string | undefined {
    const cleanLoc = location.toLowerCase().trim();
    console.log(`🔍 Finding location match for: "${cleanLoc}"`);
    
    // Enhanced aliases for common abbreviations and variations
    const locationAliases: { [key: string]: string } = {
      // SM variations
      'sm': 'SM Epza', 'sm epza': 'SM Epza', 'epza': 'SM Epza', 'epz': 'SM Epza',
      'sm dasma': 'SM Dasmariñas', 'sm dasmariñas': 'SM Dasmariñas', 
      'dasma': 'SM Dasmariñas', 'dasmariñas': 'SM Dasmariñas', 'dasmarinas': 'SM Dasmariñas',
      
      // Robinson variations
      'robinson': 'Robinson Tejero', 'rob': 'Robinson Tejero', 'tejero': 'Robinson Tejero',
      'robinson tejero': 'Robinson Tejero', 'rob tejero': 'Robinson Tejero',
      'robinson dasmariñas': 'Robinson Dasmariñas', 'robinson dasma': 'Robinson Dasmariñas',
      'rob dasma': 'Robinson Dasmariñas', 'rob dasmariñas': 'Robinson Dasmariñas',
      'rob dasmarinas': 'Robinson Dasmariñas',
      
      // Lancaster variations
      'lancaster': 'Lancaster New City', 'lanc': 'Lancaster New City', 'lnc': 'Lancaster New City',
      'lancaster new city': 'Lancaster New City', 'lancaster city': 'Lancaster New City',
      'new city': 'Lancaster New City',
      
      // Pasong Camachile variations (very common shorthand)
      'pascam': 'Pasong Camachile I', 'pasong camachile': 'Pasong Camachile I',
      'camachile': 'Pasong Camachile I', 'pas cam': 'Pasong Camachile I',
      'pasong': 'Pasong Camachile I', 'pascam 1': 'Pasong Camachile I',
      'pasong camachile 1': 'Pasong Camachile I', 'pasong cam': 'Pasong Camachile I',
      
      // Other locations with common shortcuts
      'monterey': 'Monterey', 'mont': 'Monterey', 'monte': 'Monterey',
      'pabahay': 'Pabahay', 'bgy pabahay': 'Pabahay',
      'langkaan': 'Langkaan', 'lang': 'Langkaan', 'langka': 'Langkaan',
      'tierra vista': 'Tierra Vista', 'tierra': 'Tierra Vista', 'tv': 'Tierra Vista',
      'country meadow': 'Country Meadow', 'country': 'Country Meadow', 'cm': 'Country Meadow',
      'san francisco': 'San Francisco', 'san fran': 'San Francisco', 'sf': 'San Francisco',
      'bella vista': 'Bella Vista', 'bella': 'Bella Vista', 'bv': 'Bella Vista',
      'santiago': 'Santiago', 'santi': 'Santiago', 'sant': 'Santiago',
      'open canal': 'Open Canal', 'canal': 'Open Canal', 'oc': 'Open Canal',
      'malabon': 'Malabon', 'mal': 'Malabon', 'malaban': 'Malabon',
      'riverside': 'Riverside', 'river': 'Riverside', 'rs': 'Riverside', 'riverside park': 'Riverside',
    };
    
    // Check aliases first
    if (locationAliases[cleanLoc]) {
      console.log(`✅ Alias match found: "${cleanLoc}" → "${locationAliases[cleanLoc]}"`);
      return locationAliases[cleanLoc];
    }
    
    // Exact match
    let match = CHECKPOINTS.find(cp => cp.toLowerCase() === cleanLoc);
    if (match) {
      console.log(`✅ Exact checkpoint match: "${cleanLoc}" → "${match}"`);
      return match;
    }
    
    // Fuzzy matching - starts with
    match = CHECKPOINTS.find(cp => cp.toLowerCase().startsWith(cleanLoc));
    if (match) {
      console.log(`✅ Starts-with match: "${cleanLoc}" → "${match}"`);
      return match;
    }
    
    // Fuzzy matching - contains (for partial words)
    match = CHECKPOINTS.find(cp => cp.toLowerCase().includes(cleanLoc));
    if (match) {
      console.log(`✅ Contains match: "${cleanLoc}" → "${match}"`);
      return match;
    }
    
    // Reverse fuzzy matching - search term contains checkpoint name
    match = CHECKPOINTS.find(cp => cleanLoc.includes(cp.toLowerCase()));
    if (match) {
      console.log(`✅ Reverse contains match: "${cleanLoc}" → "${match}"`);
      return match;
    }
    
    // Advanced fuzzy matching - remove common Filipino stop words and try again
    const cleanedInput = cleanLoc.replace(/\b(sa|ang|ng|mga|na|pa|at|ay|si|ni|kay)\b/g, '').trim();
    if (cleanedInput !== cleanLoc && cleanedInput.length > 2) {
      console.log(`🔄 Trying cleaned input: "${cleanedInput}"`);
      return this.findBestLocationMatch(cleanedInput);
    }
    
    console.log(`❌ No match found for: "${cleanLoc}"`);
    console.log(`📋 Available: ${CHECKPOINTS.slice(0, 5).join(', ')}...`);
    return undefined;
  }

  /**
   * Calculate fare using the EXACT same logic as fareCalculator.ts
   */
  private async calculateFare(from: string, to: string): Promise<number | null> {
    try {
      console.log(`🔍 Calculating fare from "${from}" to "${to}"`);
      
      // Use the actual fare calculator to ensure consistency
      const { calculateFare } = await import('../utils/fareCalculator');
      const fare = await calculateFare(from, to, 1); // Route 1 by default
      
      console.log(`🎯 FareCalculator returned: ₱${fare} for ${from} → ${to}`);
      
      if (fare && fare > 0) {
        return fare;
      }
      
      return null;
      
    } catch (error) {
      console.error('❌ Error using fare calculator:', error);
      return null;
    }
  }

  /**
   * Get checkpoint ID by name - matches database mapping
   */
  private getCheckpointIdByName(checkpointName: string, routeId: number = 1): number | null {
    // Route 1: SM Epza → SM Dasmariñas (sequence 1-17)
    const route1Map: { [key: string]: number } = {
      'SM Epza': 1,
      'Robinson Tejero': 2,
      'Malabon': 3,
      'Riverside': 4,
      'Lancaster New City': 5,
      'Pasong Camachile I': 6,
      'Open Canal': 7,
      'Santiago': 8,
      'Bella Vista': 9,
      'San Francisco': 10,
      'Country Meadow': 11,
      'Pabahay': 12,
      'Monterey': 13,
      'Langkaan': 14,
      'Tierra Vista': 15,
      'Robinson Dasmariñas': 16,
      'SM Dasmariñas': 17,
    };
    
    const id = route1Map[checkpointName] || null;
    console.log(`📍 Checkpoint sequence: "${checkpointName}" → ${id}`);
    return id;
  }

  /**
   * Calculate fare using exact database formula: 13.00 + (ABS(sequence_diff) * 2.5)
   */
  private calculateDatabaseFare(from: string, to: string): number | null {
    const fromSeq = this.getCheckpointIdByName(from, 1);
    const toSeq = this.getCheckpointIdByName(to, 1);
    
    if (!fromSeq || !toSeq) {
      console.log(`❌ Cannot calculate fare: ${from} (${fromSeq}) → ${to} (${toSeq})`);
      return null;
    }
    
    if (fromSeq === toSeq) {
      // Same checkpoint - base fare
      console.log(`✅ Same checkpoint fare: ₱13.00`);
      return 13.00;
    }
    
    // Database formula: 13.00 + (ABS(sequence_order_diff) * 2.5)
    const distance = Math.abs(toSeq - fromSeq);
    const fare = 13.00 + (distance * 2.5);
    
    console.log(`✅ Database fare calculation: |${toSeq} - ${fromSeq}| = ${distance} stops → ₱${fare}`);
    return fare;
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
   * Fetch routes data from API
   */
  private async fetchRoutes(): Promise<any[]> {
    try {
      const cached = this.getFromCache('routes');
      if (cached) return Array.isArray(cached) ? cached : [];

      const response = await fetch(`${this.baseUrl}/routes`);
      if (response.ok) {
        const data = await response.json();
        // Handle different API response formats
        let routes = [];
        if (Array.isArray(data)) {
          routes = data;
        } else if (data && Array.isArray(data.routes)) {
          routes = data.routes;
        } else if (data && Array.isArray(data.data)) {
          routes = data.data;
        }
        this.setCache('routes', routes);
        return routes;
      }
    } catch (error) {
      console.warn('⚠️ Failed to fetch routes:', error);
    }
    return [];
  }

  /**
   * Fetch active jeepneys data from API
   */
  private async fetchJeepneys(): Promise<any[]> {
    try {
      const cached = this.getFromCache('jeepneys');
      if (cached) return Array.isArray(cached) ? cached : [];

      const response = await fetch(`${this.baseUrl}/jeepney/all`);
      if (response.ok) {
        const data = await response.json();
        // Handle different API response formats
        let jeepneys = [];
        if (Array.isArray(data)) {
          jeepneys = data;
        } else if (data && Array.isArray(data.jeepneys)) {
          jeepneys = data.jeepneys;
        } else if (data && Array.isArray(data.data)) {
          jeepneys = data.data;
        }
        this.setCache('jeepneys', jeepneys);
        return jeepneys;
      }
    } catch (error) {
      console.warn('⚠️ Failed to fetch jeepneys:', error);
    }
    return [];
  }

  /**
   * Fetch jeepney locations data from API
   */
  private async fetchJeepneyLocations(): Promise<any[]> {
    try {
      const cached = this.getFromCache('jeepney_locations');
      if (cached) return Array.isArray(cached) ? cached : [];

      const response = await fetch(`${this.baseUrl}/jeepney/locations`);
      if (response.ok) {
        const data = await response.json();
        // Handle different API response formats
        let locations = [];
        if (Array.isArray(data)) {
          locations = data;
        } else if (data && Array.isArray(data.locations)) {
          locations = data.locations;
        } else if (data && Array.isArray(data.data)) {
          locations = data.data;
        }
        this.setCache('jeepney_locations', locations);
        return locations;
      }
    } catch (error) {
      console.warn('⚠️ Failed to fetch jeepney locations:', error);
    }
    return [];
  }

  /**
   * Fetch fare matrix data from API
   */
  private async fetchFareMatrix(): Promise<any[]> {
    try {
      const cached = this.getFromCache('fare_matrix');
      if (cached) return Array.isArray(cached) ? cached : [];

      const response = await fetch(`${this.baseUrl}/fare-matrix`);
      if (response.ok) {
        const data = await response.json();
        // Handle different API response formats
        let fareMatrix = [];
        if (Array.isArray(data)) {
          fareMatrix = data;
        } else if (data && Array.isArray(data.fare_matrix)) {
          fareMatrix = data.fare_matrix;
        } else if (data && Array.isArray(data.data)) {
          fareMatrix = data.data;
        }
        this.setCache('fare_matrix', fareMatrix);
        return fareMatrix;
      }
    } catch (error) {
      console.warn('⚠️ Failed to fetch fare matrix:', error);
    }
    return [];
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

  /**
   * Get quick questions based on language
   */
  public getQuickQuestions(language: 'en' | 'tl' | boolean): QuickQuestion[] {
    // Handle legacy boolean parameter
    const lang = typeof language === 'boolean' ? (language ? 'tl' : 'en') : language;
    
    if (lang === 'tl') {
      return [
        { id: 'fare-tl', text: 'Magkano pamasahe mula SM Epza to Robinson Dasmariñas?', category: 'fare' },
        { id: 'route-tl', text: 'Paano pumunta sa Lancaster?', category: 'route' },
        { id: 'time-tl', text: 'Anong oras ang huling jeep?', category: 'time' },
        { id: 'location-tl', text: 'Nasaan ang jeep ngayon?', category: 'fare' },
        { id: 'help-tl', text: 'Tulong - Emergency', category: 'emergency' }
      ];
    } else {
      return [
        { id: 'fare-en', text: 'How much fare from SM Epza to Robinson Dasmariñas?', category: 'fare' },
        { id: 'route-en', text: 'How to get to Lancaster?', category: 'route' },
        { id: 'time-en', text: 'What time is the last jeep?', category: 'time' },
        { id: 'location-en', text: 'Where are the jeepneys now?', category: 'fare' },
        { id: 'help-en', text: 'Help - Emergency', category: 'emergency' }
      ];
    }
  }
}

// Create and export the service instance
const biyaBotService = new BiyaBotService();

export { biyaBotService };
export default biyaBotService;

console.log('✅ BiyaBot service initialized successfully');
