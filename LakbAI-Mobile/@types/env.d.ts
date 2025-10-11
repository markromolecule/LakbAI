declare module '@env' {
  export const API_URL: string;
  export const APP_ENV: string;
  export const GEMINI_API_KEY: string;
}

// Alternative module declaration for better compatibility
declare module 'react-native-dotenv' {
  export const API_URL: string;
  export const APP_ENV: string;
  export const GEMINI_API_KEY: string;
}
