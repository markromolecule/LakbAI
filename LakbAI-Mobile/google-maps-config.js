// Google Maps Configuration
export const GOOGLE_MAPS_API_KEY = 'AIzaSyAtiOFTQdVT6lj7emrLLBWKAbxFWx6Vo_g';

// For iOS, you need to add this to Info.plist
export const IOS_GOOGLE_MAPS_CONFIG = {
  GMSApiKey: GOOGLE_MAPS_API_KEY
};

// For Android, you need to add this to android/app/src/main/AndroidManifest.xml
export const ANDROID_GOOGLE_MAPS_CONFIG = {
  apiKey: GOOGLE_MAPS_API_KEY
};
