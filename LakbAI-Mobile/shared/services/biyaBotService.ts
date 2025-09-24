import { fareMatrixService } from './fareMatrixService';
import { getBaseUrl } from '../../config/apiConfig';

export interface BotResponse {
  message: string;
  type: 'text' | 'fare_info' | 'route_info' | 'emergency' | 'error';
  data?: any;
  suggestions?: string[];
}

export interface FareCalculationRequest {
  from: string;
  to: string;
  routeId?: number;
}

class BiyaBotService {
  private baseUrl: string;

  // Checkpoint names in both English and Tagalog
  private checkpointTranslations: { [key: string]: string[] } = {
    'SM Epza': ['SM Epza', 'SM Epza'],
    'Robinson Tejero': ['Robinson Tejero', 'Robinson Tejero'],
    'Malabon': ['Malabon', 'Malabon'],
    'Riverside': ['Riverside', 'Riverside'],
    'Lancaster New City': ['Lancaster New City', 'Lancaster New City'],
    'Pasong Camachile I': ['Pasong Camachile I', 'Pasong Camachile I'],
    'Open Canal': ['Open Canal', 'Open Canal'],
    'Santiago': ['Santiago', 'Santiago'],
    'Bella Vista': ['Bella Vista', 'Bella Vista'],
    'San Francisco': ['San Francisco', 'San Francisco'],
    'Country Meadow': ['Country Meadow', 'Country Meadow'],
    'Pabahay': ['Pabahay', 'Pabahay'],
    'Monterey': ['Monterey', 'Monterey'],
    'Langkaan': ['Langkaan', 'Langkaan'],
    'Tierra Vista': ['Tierra Vista', 'Tierra Vista'],
    'Robinson Dasmariñas': ['Robinson Dasmariñas', 'Robinson Dasmariñas'],
    'SM Dasmariñas': ['SM Dasmariñas', 'SM Dasmariñas']
  };

  // Common phrases and their translations
  private translations: { [key: string]: { en: string; tl: string } } = {
    'fare': { en: 'fare', tl: 'pamasahe' },
    'price': { en: 'price', tl: 'presyo' },
    'cost': { en: 'cost', tl: 'halaga' },
    'how much': { en: 'how much', tl: 'magkano' },
    'from': { en: 'from', tl: 'mula sa' },
    'to': { en: 'to', tl: 'papunta sa' },
    'route': { en: 'route', tl: 'ruta' },
    'time': { en: 'time', tl: 'oras' },
    'arrive': { en: 'arrive', tl: 'dumating' },
    'when': { en: 'when', tl: 'kailan' },
    'where': { en: 'where', tl: 'saan' },
    'help': { en: 'help', tl: 'tulong' },
    'emergency': { en: 'emergency', tl: 'emergency' },
    'contact': { en: 'contact', tl: 'kontak' },
    'jeepney': { en: 'jeepney', tl: 'dyip' },
    'bus': { en: 'bus', tl: 'bus' },
    'transport': { en: 'transport', tl: 'sasakyan' }
  };

  constructor() {
    this.baseUrl = `${getBaseUrl()}/fare-matrix`;
  }

  /**
   * Process user message and generate appropriate response
   */
  async processMessage(userMessage: string): Promise<BotResponse> {
    try {
      console.log('🤖 BiyaBot processing message:', userMessage);
      
      const normalizedMessage = this.normalizeMessage(userMessage);
      const detectedLanguage = this.detectLanguage(userMessage);
      
      console.log('🔍 Normalized message:', normalizedMessage);
      console.log('🌐 Detected language:', detectedLanguage);
      
      // Handle greetings first
      if (this.isGreeting(normalizedMessage)) {
        console.log('👋 Detected greeting');
        return this.handleGreeting(detectedLanguage);
      }

      // Handle thanks/gratitude
      if (this.isThanks(normalizedMessage)) {
        console.log('🙏 Detected thanks');
        return this.handleThanks(detectedLanguage);
      }

      // Extract fare calculation request
      const fareRequest = this.extractFareRequest(normalizedMessage);
      if (fareRequest) {
        console.log('💰 Detected fare request:', fareRequest);
        return await this.handleFareCalculation(fareRequest, detectedLanguage);
      }

      // Handle route information requests
      if (this.isRouteRequest(normalizedMessage)) {
        console.log('🗺️ Detected route request');
        return await this.handleRouteRequest(detectedLanguage);
      }

      // Handle time/arrival requests
      if (this.isTimeRequest(normalizedMessage)) {
        console.log('⏰ Detected time request');
        return this.handleTimeRequest(detectedLanguage);
      }

      // Handle emergency requests
      if (this.isEmergencyRequest(normalizedMessage)) {
        console.log('🚨 Detected emergency request');
        return this.handleEmergencyRequest(detectedLanguage);
      }

      // Handle general help
      if (this.isHelpRequest(normalizedMessage)) {
        console.log('❓ Detected help request');
        return this.handleHelpRequest(detectedLanguage);
      }

      // Default response
      console.log('❓ No specific intent detected, using default response');
      return this.handleDefaultResponse(detectedLanguage);

    } catch (error) {
      console.error('❌ BiyaBot error:', error);
      return {
        message: 'Sorry, I encountered an error. Please try again.',
        type: 'error',
        suggestions: ['Calculate fare', 'Show routes', 'Emergency contacts']
      };
    }
  }

  /**
   * Normalize message for processing
   */
  private normalizeMessage(message: string): string {
    return message.toLowerCase()
      .replace(/[^\w\s]/g, '') // Remove punctuation
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();
  }

  /**
   * Detect language (Tagalog or English)
   */
  private detectLanguage(message: string): 'en' | 'tl' {
    const tagalogWords = ['magkano', 'pamasahe', 'presyo', 'halaga', 'mula sa', 'papunta sa', 'ruta', 'oras', 'dumating', 'kailan', 'saan', 'tulong', 'dyip', 'sasakyan'];
    const lowerMessage = message.toLowerCase();
    
    return tagalogWords.some(word => lowerMessage.includes(word)) ? 'tl' : 'en';
  }

  /**
   * Extract fare calculation request from message
   */
  private extractFareRequest(message: string): FareCalculationRequest | null {
    // Enhanced patterns for fare requests - more flexible and comprehensive
    const farePatterns = [
      // English patterns
      /(?:fare|price|cost|how much).*(?:from|mula sa)\s+([^,]+?)(?:\s+to|\s+papunta sa)\s+([^,]+)/i,
      /(?:from|mula sa)\s+([^,]+?)(?:\s+to|\s+papunta sa)\s+([^,]+?)(?:\s+fare|price|cost)/i,
      /(?:how much|magkano).*(?:from|mula sa)\s+([^,]+?)(?:\s+to|\s+papunta sa)\s+([^,]+)/i,
      
      // Tagalog patterns - more specific
      /(?:magkano|pamasahe|presyo|halaga).*(?:mula sa|from)\s+([^,]+?)(?:\s+papunta sa|\s+to)\s+([^,]+)/i,
      /(?:mula sa|from)\s+([^,]+?)(?:\s+papunta sa|\s+to)\s+([^,]+?)(?:\s+magkano|pamasahe|presyo)/i,
      
      // More flexible patterns
      /(?:fare|pamasahe|price|presyo|cost|halaga|magkano).*(?:from|mula sa)\s+([^,]+?)(?:\s+to|\s+papunta sa)\s+([^,]+)/i,
      /(?:from|mula sa)\s+([^,]+?)(?:\s+to|\s+papunta sa)\s+([^,]+?)(?:\s+fare|pamasahe|price|presyo|cost|halaga)/i,
      
      // Direct location-to-location patterns
      /([^,]+?)(?:\s+to|\s+papunta sa)\s+([^,]+?)(?:\s+fare|pamasahe|price|presyo|cost|halaga|magkano)/i,
      /(?:fare|pamasahe|price|presyo|cost|halaga|magkano).*([^,]+?)(?:\s+to|\s+papunta sa)\s+([^,]+)/i,
      
      // Special case: "magkano mula [location] papuntang [location]"
      /magkano\s+mula\s+([^,]+?)\s+papuntang\s+([^,]+)/i,
      /magkano\s+mula\s+([^,]+?)\s+papunta\s+sa\s+([^,]+)/i
    ];

    for (const pattern of farePatterns) {
      const match = message.match(pattern);
      if (match) {
        const from = this.normalizeCheckpointName(match[1].trim());
        const to = this.normalizeCheckpointName(match[2].trim());
        
        if (from && to) {
          console.log('🎯 Extracted fare request:', { from, to });
          return { from, to };
        }
      }
    }

    // Fallback: try to extract locations even without explicit fare keywords
    const locationPatterns = [
      /([^,]+?)(?:\s+to|\s+papunta sa)\s+([^,]+)/i,
      /(?:from|mula sa)\s+([^,]+?)(?:\s+to|\s+papunta sa)\s+([^,]+)/i,
      // Special case for "mula [location] papuntang [location]"
      /mula\s+([^,]+?)\s+papuntang\s+([^,]+)/i
    ];

    for (const pattern of locationPatterns) {
      const match = message.match(pattern);
      if (match) {
        const from = this.normalizeCheckpointName(match[1].trim());
        const to = this.normalizeCheckpointName(match[2].trim());
        
        if (from && to) {
          console.log('🎯 Extracted location pair:', { from, to });
          return { from, to };
        }
      }
    }

    return null;
  }

  /**
   * Normalize checkpoint name
   */
  private normalizeCheckpointName(name: string): string | null {
    const normalizedName = name.trim();
    
    // Direct match
    if (this.checkpointTranslations[normalizedName]) {
      console.log('✅ Direct match found:', normalizedName);
      return normalizedName;
    }

    // Enhanced partial matching with better logic
    for (const [checkpoint, translations] of Object.entries(this.checkpointTranslations)) {
      // Check if any translation contains the input or vice versa
      const found = translations.some(translation => {
        const lowerTranslation = translation.toLowerCase();
        const lowerInput = normalizedName.toLowerCase();
        
        // Exact match
        if (lowerTranslation === lowerInput) return true;
        
        // Contains match (more flexible)
        if (lowerTranslation.includes(lowerInput) || lowerInput.includes(lowerTranslation)) return true;
        
        // Word boundary match for better accuracy
        const words = lowerInput.split(/\s+/);
        return words.some(word => 
          word.length > 2 && lowerTranslation.includes(word)
        );
      });
      
      if (found) {
        console.log('✅ Partial match found:', normalizedName, '->', checkpoint);
        return checkpoint;
      }
    }

    // Additional fuzzy matching for common variations
    const fuzzyMatches: { [key: string]: string } = {
      'sm epza': 'SM Epza',
      'epza': 'SM Epza',
      'sm dasma': 'SM Dasmariñas',
      'sm dasmariñas': 'SM Dasmariñas',
      'sm dasmarias': 'SM Dasmariñas', // Handle normalized version without ñ
      'dasmariñas': 'SM Dasmariñas',
      'dasmarias': 'SM Dasmariñas', // Handle normalized version without ñ
      'robinson tejero': 'Robinson Tejero',
      'tejero': 'Robinson Tejero',
      'malabon': 'Malabon',
      'riverside': 'Riverside',
      'lancaster': 'Lancaster New City',
      'lancaster new city': 'Lancaster New City',
      'pasong camachile': 'Pasong Camachile I',
      'open canal': 'Open Canal',
      'santiago': 'Santiago',
      'bella vista': 'Bella Vista',
      'san francisco': 'San Francisco',
      'country meadow': 'Country Meadow',
      'pabahay': 'Pabahay',
      'monterey': 'Monterey',
      'langkaan': 'Langkaan',
      'tierra vista': 'Tierra Vista',
      'robinson dasmariñas': 'Robinson Dasmariñas',
      'robinson dasmarias': 'Robinson Dasmariñas' // Handle normalized version without ñ
    };

    const fuzzyMatch = fuzzyMatches[normalizedName.toLowerCase()];
    if (fuzzyMatch) {
      console.log('✅ Fuzzy match found:', normalizedName, '->', fuzzyMatch);
      return fuzzyMatch;
    }

    console.log('❌ No match found for:', normalizedName);
    return null;
  }

  /**
   * Handle fare calculation request
   */
  private async handleFareCalculation(request: FareCalculationRequest, language: 'en' | 'tl'): Promise<BotResponse> {
    try {
      console.log('💰 Calculating fare:', request);
      
      // Get checkpoint IDs for fare calculation
      const fromCheckpointId = this.getCheckpointIdByName(request.from);
      const toCheckpointId = this.getCheckpointIdByName(request.to);
      
      if (!fromCheckpointId || !toCheckpointId) {
        return {
          message: language === 'tl'
            ? `Hindi ko mahanap ang lugar na "${request.from}" o "${request.to}". Paki-check ang pangalan ng lugar.`
            : `I couldn't find the location "${request.from}" or "${request.to}". Please check the location names.`,
          type: 'error',
          suggestions: [
            language === 'tl' ? 'Ipakita ang mga lugar na available' : 'Show available locations',
            language === 'tl' ? 'Tulong' : 'Help'
          ]
        };
      }

      const fareResult = await fareMatrixService.getFareBetweenCheckpoints(
        fromCheckpointId, 
        toCheckpointId, 
        request.routeId
      );
      
      const fare = fareResult.status === 'success' && fareResult.fare_info 
        ? parseFloat(fareResult.fare_info.fare_amount.toString()) 
        : null;
      
      if (fare !== null) {
        const responses = language === 'tl' 
          ? [
              `Ang pamasahe mula sa ${request.from} papunta sa ${request.to} ay ₱${fare.toFixed(2)}! 😊`,
              `Para sa ${request.from} to ${request.to}, ang pamasahe ay ₱${fare.toFixed(2)}! 🚗`,
              `₱${fare.toFixed(2)} ang pamasahe mula sa ${request.from} papunta sa ${request.to}! 💰`,
              `Got it! From ${request.from} to ${request.to}, it's ₱${fare.toFixed(2)}! ✨`
            ]
          : [
              `The fare from ${request.from} to ${request.to} is ₱${fare.toFixed(2)}! 😊`,
              `For ${request.from} to ${request.to}, the fare is ₱${fare.toFixed(2)}! 🚗`,
              `₱${fare.toFixed(2)} is the fare from ${request.from} to ${request.to}! 💰`,
              `Got it! From ${request.from} to ${request.to}, it's ₱${fare.toFixed(2)}! ✨`
            ];

        const message = responses[Math.floor(Math.random() * responses.length)];

        return {
          message,
          type: 'fare_info',
          data: { from: request.from, to: request.to, fare },
          suggestions: [
            language === 'tl' ? 'Magkano ang pamasahe sa ibang ruta?' : 'Calculate fare for another route',
            language === 'tl' ? 'Ipakita ang mga ruta' : 'Show available routes',
            language === 'tl' ? 'Kailan darating ang dyip?' : 'When will the jeepney arrive?'
          ]
        };
      } else {
        const responses = language === 'tl'
          ? [
              `Hmm, hindi ko mahanap ang pamasahe mula sa ${request.from} papunta sa ${request.to}. Paki-check ang pangalan ng lugar! 🤔`,
              `Sorry, walang fare info para sa ${request.from} to ${request.to}. Check mo yung location names! 😅`,
              `Hindi ko makita yung fare for ${request.from} to ${request.to}. Baka mali yung spelling? 🤷‍♀️`
            ]
          : [
              `Hmm, I couldn't find the fare from ${request.from} to ${request.to}. Please check the location names! 🤔`,
              `Sorry, no fare info for ${request.from} to ${request.to}. Check the location names! 😅`,
              `I can't find the fare for ${request.from} to ${request.to}. Maybe check the spelling? 🤷‍♀️`
            ];

        const message = responses[Math.floor(Math.random() * responses.length)];

        return {
          message,
          type: 'error',
          suggestions: [
            language === 'tl' ? 'Ipakita ang mga lugar na available' : 'Show available locations',
            language === 'tl' ? 'Tulong' : 'Help'
          ]
        };
      }
    } catch (error) {
      console.error('❌ Fare calculation error:', error);
      const message = language === 'tl'
        ? 'May error sa pagkalkula ng pamasahe. Paki-try ulit.'
        : 'There was an error calculating the fare. Please try again.';

      return {
        message,
        type: 'error',
        suggestions: [
          language === 'tl' ? 'Tulong' : 'Help',
          language === 'tl' ? 'Ipakita ang mga ruta' : 'Show routes'
        ]
      };
    }
  }

  /**
   * Handle route information request
   */
  private async handleRouteRequest(language: 'en' | 'tl'): Promise<BotResponse> {
    try {
      const routes = await this.getAvailableRoutes();
      
      const responses = language === 'tl'
        ? [
            `Eto ang mga available na ruta namin! 🚗\n\n${routes.map(route => `• ${route}`).join('\n')}\n\nPwede mo ring i-try ang fare calculator para sa specific na ruta! 😊`,
            `Here are our routes! 🗺️\n\n${routes.map(route => `• ${route}`).join('\n')}\n\nTry mo din yung fare calculator! 💰`,
            `Mga ruta na available! ✨\n\n${routes.map(route => `• ${route}`).join('\n')}\n\nPwede mo akong tanungin tungkol sa fare! 🤗`
          ]
        : [
            `Here are our available routes! 🚗\n\n${routes.map(route => `• ${route}`).join('\n')}\n\nYou can also use the fare calculator for specific routes! 😊`,
            `Check out our routes! 🗺️\n\n${routes.map(route => `• ${route}`).join('\n')}\n\nTry the fare calculator too! 💰`,
            `Available routes for you! ✨\n\n${routes.map(route => `• ${route}`).join('\n')}\n\nAsk me about fares anytime! 🤗`
          ];

      const message = responses[Math.floor(Math.random() * responses.length)];

      return {
        message,
        type: 'route_info',
        data: { routes },
        suggestions: [
          language === 'tl' ? 'Kalkulahin ang pamasahe' : 'Calculate fare',
          language === 'tl' ? 'Kailan darating ang dyip?' : 'When will the jeepney arrive?'
        ]
      };
    } catch (error) {
      console.error('❌ Route request error:', error);
      const message = language === 'tl'
        ? 'Hindi ko makuha ang mga ruta ngayon. Paki-try ulit mamaya.'
        : 'I can\'t get the routes right now. Please try again later.';

      return {
        message,
        type: 'error',
        suggestions: [
          language === 'tl' ? 'Tulong' : 'Help',
          language === 'tl' ? 'Kalkulahin ang pamasahe' : 'Calculate fare'
        ]
      };
    }
  }

  /**
   * Handle time/arrival request
   */
  private handleTimeRequest(language: 'en' | 'tl'): BotResponse {
    const responses = language === 'tl'
      ? [
          'Ang estimated arrival time ay 5-7 minutes base sa current traffic! 🕐 Paki-monitor ang real-time updates sa app! 😊',
          'Darating yung dyip in 5-7 minutes! ⏰ Check mo yung app for updates! 🚗',
          'Around 5-7 minutes pa! 🕒 Monitor mo lang yung app for real-time updates! ✨',
          'Estimated 5-7 minutes! ⏱️ Keep checking the app for live updates! 🤗'
        ]
      : [
          'The estimated arrival time is 5-7 minutes based on current traffic! 🕐 Please monitor real-time updates in the app! 😊',
          'Jeepney will arrive in 5-7 minutes! ⏰ Check the app for updates! 🚗',
          'Around 5-7 minutes more! 🕒 Just monitor the app for real-time updates! ✨',
          'Estimated 5-7 minutes! ⏱️ Keep checking the app for live updates! 🤗'
        ];

    const message = responses[Math.floor(Math.random() * responses.length)];

    return {
      message,
      type: 'text',
      suggestions: [
        language === 'tl' ? 'Kalkulahin ang pamasahe' : 'Calculate fare',
        language === 'tl' ? 'Ipakita ang mga ruta' : 'Show routes',
        language === 'tl' ? 'Emergency contacts' : 'Emergency contacts'
      ]
    };
  }

  /**
   * Handle emergency request
   */
  private handleEmergencyRequest(language: 'en' | 'tl'): BotResponse {
    const message = language === 'tl'
      ? 'Emergency contacts:\n• Police: 117\n• Fire: 116\n• Medical: 911\n• Jeepney Dispatch: (046) 123-4567\n\nPara sa immediate assistance, tawagan ang mga numerong ito.'
      : 'Emergency contacts:\n• Police: 117\n• Fire: 116\n• Medical: 911\n• Jeepney Dispatch: (046) 123-4567\n\nFor immediate assistance, call these numbers.';

    return {
      message,
      type: 'emergency',
      suggestions: [
        language === 'tl' ? 'Kalkulahin ang pamasahe' : 'Calculate fare',
        language === 'tl' ? 'Ipakita ang mga ruta' : 'Show routes',
        language === 'tl' ? 'Tulong' : 'Help'
      ]
    };
  }

  /**
   * Handle help request
   */
  private handleHelpRequest(language: 'en' | 'tl'): BotResponse {
    const responses = language === 'tl'
      ? [
          'Ako si Biya, ang LakbAI assistant mo! 😊 Pwede akong tumulong sa:\n\n• Pagkalkula ng pamasahe 💰\n• Pagpapakita ng mga ruta 🗺️\n• Pagbibigay ng arrival time ⏰\n• Emergency contacts 🚨\n\nTanong mo lang ako sa English o Tagalog! 🤗',
          'Hi! I\'m Biya! 👋 Pwede akong tumulong sa:\n\n• Fare calculations 💰\n• Route info 🚗\n• Arrival times ⏱️\n• Emergency contacts 🆘\n\nAsk me anything in English or Tagalog! ✨',
          'Hello! Ako si Biya! 😄 I can help with:\n\n• Pamasahe calculations 💵\n• Mga ruta 🛣️\n• Oras ng dating 🕐\n• Emergency contacts 📞\n\nJust ask me in any language! 🌟'
        ]
      : [
          'I\'m Biya, your LakbAI assistant! 😊 I can help you with:\n\n• Fare calculations 💰\n• Route information 🗺️\n• Arrival times ⏰\n• Emergency contacts 🚨\n\nAsk me in English or Tagalog! 🤗',
          'Hi! I\'m Biya! 👋 I can help with:\n\n• Fare calculations 💰\n• Route info 🚗\n• Arrival times ⏱️\n• Emergency contacts 🆘\n\nAsk me anything in English or Tagalog! ✨',
          'Hello! I\'m Biya! 😄 I can help with:\n\n• Fare calculations 💵\n• Route information 🛣️\n• Arrival times 🕐\n• Emergency contacts 📞\n\nJust ask me in any language! 🌟'
        ];

    const message = responses[Math.floor(Math.random() * responses.length)];

    return {
      message,
      type: 'text',
      suggestions: [
        language === 'tl' ? 'Kalkulahin ang pamasahe' : 'Calculate fare',
        language === 'tl' ? 'Ipakita ang mga ruta' : 'Show routes',
        language === 'tl' ? 'Kailan darating ang dyip?' : 'When will the jeepney arrive?'
      ]
    };
  }

  /**
   * Handle greeting messages
   */
  private handleGreeting(language: 'en' | 'tl'): BotResponse {
    const greetings = language === 'tl' 
      ? [
          'Kumusta! Ako si Biya, ang LakbAI assistant mo! 😊',
          'Hello! Kamusta ka? Ako si Biya! 👋',
          'Hi! Nice to meet you! Ako si Biya, ready akong tumulong! 😄',
          'Kumusta! Welcome sa LakbAI! Ako si Biya! 🚗'
        ]
      : [
          'Hello! I\'m Biya, your LakbAI assistant! 😊',
          'Hi there! Nice to meet you! I\'m Biya! 👋',
          'Hello! Welcome to LakbAI! I\'m here to help! 😄',
          'Hi! I\'m Biya, ready to assist you! 🚗'
        ];

    const message = greetings[Math.floor(Math.random() * greetings.length)];

    return {
      message,
      type: 'text',
      suggestions: [
        language === 'tl' ? 'Kalkulahin ang pamasahe' : 'Calculate fare',
        language === 'tl' ? 'Ipakita ang mga ruta' : 'Show routes',
        language === 'tl' ? 'Ano ang kaya mo?' : 'What can you do?'
      ]
    };
  }

  /**
   * Handle thanks/gratitude messages
   */
  private handleThanks(language: 'en' | 'tl'): BotResponse {
    const thanksResponses = language === 'tl'
      ? [
          'Walang anuman! Happy to help! 😊',
          'You\'re welcome! Anytime! 😄',
          'No problem! Always here to help! 🤗',
          'Walang problema! Enjoy your ride! 🚗'
        ]
      : [
          'You\'re welcome! Happy to help! 😊',
          'No problem! Anytime! 😄',
          'My pleasure! Always here to help! 🤗',
          'You\'re welcome! Enjoy your ride! 🚗'
        ];

    const message = thanksResponses[Math.floor(Math.random() * thanksResponses.length)];

    return {
      message,
      type: 'text',
      suggestions: [
        language === 'tl' ? 'Kalkulahin ang pamasahe' : 'Calculate fare',
        language === 'tl' ? 'Ipakita ang mga ruta' : 'Show routes',
        language === 'tl' ? 'Kailan darating ang dyip?' : 'When will the jeepney arrive?'
      ]
    };
  }

  /**
   * Handle default response
   */
  private handleDefaultResponse(language: 'en' | 'tl'): BotResponse {
    // Try to provide more intelligent responses based on context
    const responses = language === 'tl'
      ? [
          'Hmm, hindi ko naintindihan yan. Pero pwede mo akong tanungin tungkol sa:\n\n• Pamasahe (halimbawa: "Magkano ang pamasahe mula sa SM Epza papunta sa SM Dasmariñas?")\n• Mga ruta ("Ipakita ang mga ruta")\n• Oras ng dating ("Kailan darating ang dyip?")\n• Emergency contacts ("Emergency")\n\nTry mo ulit! 😊',
          'Sorry, hindi ko gets yan. Pero alam ko ang mga lugar na ito:\n\n📍 SM Epza, Robinson Tejero, Malabon, Riverside, Lancaster New City, Pasong Camachile I, Open Canal, Santiago, Bella Vista, San Francisco, Country Meadow, Pabahay, Monterey, Langkaan, Tierra Vista, Robinson Dasmariñas, SM Dasmariñas\n\nTanong mo ako tungkol sa pamasahe! 💰',
          'Hindi ko alam yan eh. Pero pwede akong tumulong sa:\n\n• Pagkalkula ng pamasahe 💰\n• Pagpapakita ng mga ruta 🗺️\n• Pagbibigay ng arrival time ⏰\n• Emergency contacts 🚨\n\nTry mo lang ako sa English o Tagalog! 🤗'
        ]
      : [
          'Hmm, I didn\'t quite understand that. But I can help you with:\n\n• Fare calculations (e.g., "How much is the fare from SM Epza to SM Dasmariñas?")\n• Route information ("Show routes")\n• Arrival times ("When will the jeepney arrive?")\n• Emergency contacts ("Emergency")\n\nTry asking me again! 😊',
          'Sorry, I didn\'t get that. But I know these locations:\n\n📍 SM Epza, Robinson Tejero, Malabon, Riverside, Lancaster New City, Pasong Camachile I, Open Canal, Santiago, Bella Vista, San Francisco, Country Meadow, Pabahay, Monterey, Langkaan, Tierra Vista, Robinson Dasmariñas, SM Dasmariñas\n\nAsk me about fares! 💰',
          'I\'m not sure about that. But I can help with:\n\n• Fare calculations 💰\n• Route information 🗺️\n• Arrival times ⏰\n• Emergency contacts 🚨\n\nJust ask me in English or Tagalog! 🤗'
        ];

    const message = responses[Math.floor(Math.random() * responses.length)];

    return {
      message,
      type: 'text',
      suggestions: [
        language === 'tl' ? 'Magkano ang pamasahe mula sa SM Epza papunta sa SM Dasmariñas?' : 'How much is the fare from SM Epza to SM Dasmariñas?',
        language === 'tl' ? 'Ipakita ang mga ruta' : 'Show routes',
        language === 'tl' ? 'Tulong' : 'Help'
      ]
    };
  }

  /**
   * Check if message is a fare request
   */
  private isFareRequest(message: string): boolean {
    const fareKeywords = ['fare', 'pamasahe', 'price', 'presyo', 'cost', 'halaga', 'magkano', 'how much'];
    return fareKeywords.some(keyword => message.includes(keyword));
  }

  /**
   * Check if message is a route request
   */
  private isRouteRequest(message: string): boolean {
    const routeKeywords = ['route', 'ruta', 'show routes', 'ipapakita ang mga ruta', 'available routes'];
    return routeKeywords.some(keyword => message.includes(keyword));
  }

  /**
   * Check if message is a time request
   */
  private isTimeRequest(message: string): boolean {
    const timeKeywords = ['time', 'oras', 'arrive', 'dumating', 'when', 'kailan', 'arrival'];
    return timeKeywords.some(keyword => message.includes(keyword));
  }

  /**
   * Check if message is an emergency request
   */
  private isEmergencyRequest(message: string): boolean {
    const emergencyKeywords = ['emergency', 'emergency', 'contact', 'kontak', 'help', 'tulong', 'police', 'pulis'];
    return emergencyKeywords.some(keyword => message.includes(keyword));
  }

  /**
   * Check if message is a help request
   */
  private isHelpRequest(message: string): boolean {
    const helpKeywords = ['help', 'tulong', 'what can you do', 'ano ang kaya mo', 'commands', 'mga utos'];
    return helpKeywords.some(keyword => message.includes(keyword));
  }

  /**
   * Check if message is a greeting
   */
  private isGreeting(message: string): boolean {
    const greetingKeywords = [
      'hi', 'hello', 'hey', 'good morning', 'good afternoon', 'good evening',
      'kumusta', 'kamusta', 'mabuhay', 'magandang umaga', 'magandang hapon', 'magandang gabi'
    ];
    return greetingKeywords.some(keyword => message.includes(keyword));
  }

  /**
   * Check if message is expressing thanks/gratitude
   */
  private isThanks(message: string): boolean {
    // More specific thanks patterns to avoid false positives
    const thanksPatterns = [
      /\bthank you\b/i,
      /\bthanks\b/i,
      /\bsalamat\b/i,
      /\bmaraming salamat\b/i,
      /\bthank\b/i,
      /\bty\b/i, // Only match 'ty' as a standalone word
      /\bappreciate\b/i,
      /\bgrateful\b/i,
      /\bnakakatulong\b/i,
      /\btulong mo\b/i
    ];
    
    // Check if any thanks pattern matches
    const hasThanksPattern = thanksPatterns.some(pattern => pattern.test(message));
    
    // Additional check: if it's a fare request, don't treat as thanks
    const fareRequest = this.extractFareRequest(message);
    if (fareRequest) {
      return false; // It's a fare request, not thanks
    }
    
    return hasThanksPattern;
  }

  /**
   * Get checkpoint ID by name
   */
  private getCheckpointIdByName(checkpointName: string): number | null {
    // Route 1: SM Epza → SM Dasmariñas (IDs 46-62)
    const route1Map: { [key: string]: number } = {
      'SM Epza': 46,
      'Robinson Tejero': 47,
      'Malabon': 48,
      'Riverside': 49,
      'Lancaster New City': 50,
      'Pasong Camachile I': 51,
      'Open Canal': 52,
      'Santiago': 53,
      'Bella Vista': 54,
      'San Francisco': 55,
      'Country Meadow': 56,
      'Pabahay': 57,
      'Monterey': 58,
      'Langkaan': 59,
      'Tierra Vista': 60,
      'Robinson Dasmariñas': 61,
      'SM Dasmariñas': 62,
    };

    // Route 2: SM Dasmariñas → SM Epza (IDs 63-79)
    const route2Map: { [key: string]: number } = {
      'SM Dasmariñas': 63,
      'Robinson Dasmariñas': 64,
      'Tierra Vista': 65,
      'Langkaan': 66,
      'Monterey': 67,
      'Pabahay': 68,
      'Country Meadow': 69,
      'San Francisco': 70,
      'Bella Vista': 71,
      'Santiago': 72,
      'Open Canal': 73,
      'Pasong Camachile I': 74,
      'Lancaster New City': 75,
      'Riverside': 76,
      'Malabon': 77,
      'Robinson Tejero': 78,
      'SM Epza': 79,
    };

    // Try both routes
    return route1Map[checkpointName] || route2Map[checkpointName] || null;
  }

  /**
   * Get available routes from database
   */
  private async getAvailableRoutes(): Promise<string[]> {
    try {
      const response = await fetch(`${this.baseUrl}/route/1`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.status === 'success' && data.checkpoints) {
          return data.checkpoints.map((cp: any) => cp.checkpoint_name);
        }
      }
    } catch (error) {
      console.error('❌ Error fetching routes:', error);
    }

    // Fallback to static routes
    return Object.keys(this.checkpointTranslations);
  }
}

export const biyaBotService = new BiyaBotService();
