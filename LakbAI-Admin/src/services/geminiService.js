/**
 * Gemini AI Service for Admin Panel - Direct API Integration
 * Uses Gemini 2.5 Flash for enhanced chatbot responses
 */

class GeminiService {
  constructor(apiKey) {
    this.apiKey = apiKey ? apiKey.trim() : '';
    this.baseUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';
    console.log('🤖 Admin Gemini Service initialized');
    console.log('🔑 API Key length:', this.apiKey.length);
    console.log('🔑 API Key starts with:', this.apiKey ? this.apiKey.substring(0, 15) + '...' : 'EMPTY');
  }

  async generateResponse(userMessage, context) {
    try {
      const prompt = this.buildPrompt(userMessage, context);
      
      const requestBody = {
        contents: [{
          parts: [{ 
            text: prompt 
          }]
        }]
      };

      console.log('🤖✨ Calling Gemini 2.5 Flash API...');
      
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

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Gemini API error: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const data = await response.json();
      
      if (data.candidates && data.candidates[0] && data.candidates[0].content) {
        const text = data.candidates[0].content.parts[0].text;
        console.log('✅ Gemini response received');
        return this.parseResponse(text);
      } else {
        throw new Error('Invalid response format from Gemini API');
      }
      
    } catch (error) {
      console.error('❌ Gemini API Error:', error);
      return {
        message: 'Sorry, I encountered an error. Please try again!',
        type: 'error'
      };
    }
  }

  buildPrompt(userMessage, context) {
    // Safe array access with fallbacks
    const availableLocations = Array.isArray(context.availableLocations) ? context.availableLocations : [];
    const routes = Array.isArray(context.routes) ? context.routes : [];
    const activeJeepneys = Array.isArray(context.activeJeepneys) ? context.activeJeepneys : [];
    const jeepneyLocations = Array.isArray(context.jeepneyLocations) ? context.jeepneyLocations : [];
    
    return `You are Biya, a helpful and friendly jeepney assistant for LakbAI transportation system in the Philippines.

DATABASE CONTEXT:
- Available locations: ${availableLocations.length > 0 ? availableLocations.join(', ') : 'Loading...'}
- Active routes: ${routes.length > 0 ? routes.map(r => r.route_name || r.name || 'Unknown Route').join(', ') : 'Loading routes...'}
- Active jeepneys: ${activeJeepneys.length} vehicles
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
- Administrative system insights (for admin users)

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
10. For admin users, provide system insights and operational data when relevant

USER MESSAGE: "${userMessage}"

Respond as Biya, using the database information provided:`;
  }

  parseResponse(text) {
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

  extractSuggestions(text) {
    const suggestionPatterns = [
      /•\s*([^\n]+)/g,
      /-\s*([^\n]+)/g,
      /\d+\.\s*([^\n]+)/g
    ];
    
    const suggestions = [];
    
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

  removeSuggestions(text) {
    // Remove suggestion patterns from the main message
    return text
      .replace(/•\s*[^\n]+/g, '')
      .replace(/-\s*[^\n]+/g, '')
      .replace(/\d+\.\s*[^\n]+/g, '')
      .trim();
  }
}

export default GeminiService;
