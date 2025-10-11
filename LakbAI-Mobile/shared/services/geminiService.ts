/**
 * Gemini AI Service - Direct API Integration
 * Uses Gemini 2.5 Flash for enhanced chatbot responses
 */

interface GeminiResponse {
  message: string;
  type: 'text' | 'data' | 'error';
  suggestions?: string[];
  data?: any;
}

interface SystemContext {
  availableLocations: string[];
  routes: any[];
  activeJeepneys: any[];
  jeepneyLocations: any[];
  fareMatrix: any[];
  currentTime: string;
  systemInfo: string;
}

interface GeminiContent {
  parts: Array<{
    text: string;
  }>;
}

interface GeminiRequest {
  contents: GeminiContent[];
}

class GeminiService {
  private apiKey: string;
  private baseUrl: string;

  constructor(apiKey: string) {
    // Clean and validate the API key
    this.apiKey = apiKey ? apiKey.trim() : '';
    this.baseUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';
    
    console.log('🤖 Gemini Service Constructor');
    console.log('🔑 API Key received:', apiKey ? `YES` : 'NO');
    console.log('🔑 API Key length:', this.apiKey.length);
    console.log('🔑 API Key starts with:', this.apiKey ? this.apiKey.substring(0, 15) + '...' : 'EMPTY');
    console.log('🔑 API Key (full):', this.apiKey);  // Temporary for debugging
    console.log('🌐 Using model: gemini-2.5-flash');
  }

  async generateResponse(userMessage: string, context: SystemContext): Promise<GeminiResponse> {
    try {
      const prompt = this.buildPrompt(userMessage, context);
      
      const contents: GeminiContent = {
        parts: [{ text: prompt }]
      };

      const requestBody: GeminiRequest = {
        contents: [contents]
      };

      console.log('🤖 Calling Gemini API...');
      console.log('🔑 API Key (first 10 chars):', this.apiKey.substring(0, 10) + '...');
      console.log('🌐 API URL:', this.baseUrl);
      console.log('📝 Request body:', JSON.stringify(requestBody).substring(0, 100) + '...');
      
      const response = await fetch(
        `${this.baseUrl}?key=${this.apiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody),
        }
      );

      console.log('📡 Response status:', response.status, response.statusText);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Gemini API Error Response:', errorText);
        throw new Error(`Gemini API error: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const data = await response.json();
      console.log('✅ Gemini API Response received:', data ? 'SUCCESS' : 'EMPTY');
      
      if (data.candidates && data.candidates[0] && data.candidates[0].content) {
        const text = data.candidates[0].content.parts[0].text;
        console.log('Gemini response received');
        return this.parseResponse(text);
      } else {
        throw new Error('Invalid response format from Gemini API');
      }
      
    } catch (error) {
      console.error('Gemini API Error:', error);
      return {
        message: 'Sorry, I encountered an error. Please try again!',
        type: 'error'
      };
    }
  }

  private buildPrompt(userMessage: string, context: SystemContext): string {
    // Safe array access with fallbacks
    const availableLocations = Array.isArray(context.availableLocations) ? context.availableLocations : [];
    const routes = Array.isArray(context.routes) ? context.routes : [];
    const activeJeepneys = Array.isArray(context.activeJeepneys) ? context.activeJeepneys : [];
    const jeepneyLocations = Array.isArray(context.jeepneyLocations) ? context.jeepneyLocations : [];
    
    return `You are Biya, a helpful and friendly jeepney assistant for LakbAI transportation system in the Philippines.

DATABASE CONTEXT:
- Available locations: ${availableLocations.length > 0 ? availableLocations.join(', ') : 'Loading...'}
- Active routes: ${routes.length > 0 ? routes.map((r: any) => r.name || r.route_name || 'Unknown Route').join(', ') : 'Loading routes...'}
- Active jeepneys: ${activeJeepneys.length} vehicles ${activeJeepneys.length > 0 ? `(${activeJeepneys.map((j: any) => j.number || j.jeepney_number || 'Unknown').join(', ')})` : '(Loading...)'}
- Real-time locations: ${jeepneyLocations.length} tracked locations
- Current time: ${context.currentTime || new Date().toLocaleString()}
- System: ${context.systemInfo || 'LakbAI Transportation System'}

CAPABILITIES:
- Fare calculation between locations (use database fare matrix)
- Route information and directions (use database routes)
- Real-time jeepney locations and availability (use database locations)
- Schedule and timing information
- Emergency contacts and help
- General transportation advice

RESPONSE GUIDELINES:
1. Respond in the same language as the user (English or Tagalog/Taglish)
2. Be friendly, helpful, and conversational
3. Use REAL database information when available
4. If user asks about fares, mention you can calculate exact amounts from database
5. If user asks about jeepney locations, mention real-time tracking from database
6. For specific data requests, provide actual database values
7. Keep responses concise but informative
8. Use emojis appropriately (🚌, 💰, 📍, ⏰, etc.)
9. If you don't have specific data, suggest the user ask for "exact fare" or "current locations"

USER MESSAGE: "${userMessage}"

Respond as Biya, using the database information provided:`;
  }

  private parseResponse(text: string): GeminiResponse {
    // Clean up the response
    const cleanText = text.trim();
    
    // Extract suggestions if any (look for patterns like "• suggestion" or "- suggestion")
    const suggestions = this.extractSuggestions(cleanText);
    const messageWithoutSuggestions = this.removeSuggestions(cleanText);
    
    return {
      message: messageWithoutSuggestions,
      type: 'text',
      suggestions: suggestions.length > 0 ? suggestions : undefined
    };
  }

  private extractSuggestions(text: string): string[] {
    const suggestionPatterns = [
      /•\s*([^\n]+)/g,
      /-\s*([^\n]+)/g,
      /\d+\.\s*([^\n]+)/g
    ];
    
    const suggestions: string[] = [];
    
    suggestionPatterns.forEach(pattern => {
      const matches = text.match(pattern);
      if (matches) {
        matches.forEach(match => {
          const suggestion = match.replace(/^[•\-]\s*|\d+\.\s*/, '').trim();
          if (suggestion && suggestion.length > 0) {
            suggestions.push(suggestion);
          }
        });
      }
    });
    
    return suggestions.slice(0, 3); // Limit to 3 suggestions
  }

  private removeSuggestions(text: string): string {
    // Remove suggestion patterns from the main message
    return text
      .replace(/•\s*[^\n]+/g, '')
      .replace(/-\s*[^\n]+/g, '')
      .replace(/\d+\.\s*[^\n]+/g, '')
      .trim();
  }
}

export { GeminiService };
export default GeminiService;
