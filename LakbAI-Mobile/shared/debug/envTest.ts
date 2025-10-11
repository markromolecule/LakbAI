// Environment Test - Debug Script (Fallback version)

export const testEnvironmentVariables = () => {
  console.log('=== ENVIRONMENT TEST ===');
  
  // Try multiple methods to get environment variables
  let apiUrl = '';
  let appEnv = '';
  let geminiKey = '';
  
  try {
    const env = require('@env');
    apiUrl = env?.API_URL || '';
    appEnv = env?.APP_ENV || '';
    geminiKey = env?.GEMINI_API_KEY || '';
    console.log('✅ @env module loaded successfully');
  } catch (error) {
    console.log('❌ @env module failed:', error.message);
    
    // Fallback to process.env
    if (typeof process !== 'undefined' && process.env) {
      apiUrl = process.env.API_URL || '';
      appEnv = process.env.APP_ENV || '';
      geminiKey = process.env.GEMINI_API_KEY || '';
      console.log('✅ Using process.env fallback');
    }
  }
  
  console.log('API_URL:', apiUrl || 'NOT SET');
  console.log('APP_ENV:', appEnv || 'NOT SET');
  console.log('GEMINI_API_KEY:', geminiKey ? `SET (${geminiKey.length} chars)` : 'NOT SET');
  console.log('GEMINI_API_KEY preview:', geminiKey ? geminiKey.substring(0, 20) + '...' : 'undefined');
  console.log('========================');
  
  return {
    apiUrl,
    appEnv,
    geminiKey,
    geminiKeySet: !!geminiKey,
    geminiKeyLength: geminiKey ? geminiKey.length : 0
  };
};
