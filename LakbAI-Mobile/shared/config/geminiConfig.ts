/**
 * Gemini Configuration - Fallback Approach
 * Use this if environment variables don't work
 */

export const GEMINI_CONFIG = {
  // Your verified working API key (tested with curl - works perfectly!)
  API_KEY: 'AIzaSyD20q0ucYolbJ6E3hhZQgKbnWy38-DVGec',
  
  // API endpoint
  BASE_URL: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent'
};

// Export for easy access
export const getGeminiApiKey = (): string => {
  console.log('📦 Getting API key from config file...');
  console.log('📦 Config API Key:', GEMINI_CONFIG.API_KEY);
  return GEMINI_CONFIG.API_KEY;
};
