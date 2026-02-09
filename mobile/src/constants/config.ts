import Constants from 'expo-constants';
import { Platform } from 'react-native';

/**
 * Get the API URL based on the current environment
 * In development, it automatically uses the Expo debugger's host IP
 * This ensures it works regardless of your network/computer IP
 */
const getApiUrl = (): string => {
  // Allow manual override via environment variable
  const manualUrl = Constants.expoConfig?.extra?.apiUrl;
  if (manualUrl) {
    console.log('📍 Using manually configured API URL:', manualUrl);
    return manualUrl;
  }

  if (__DEV__) {
    // Get the local IP from Expo's debugger connection
    const debuggerHost = Constants.expoConfig?.hostUri;
    
    if (debuggerHost) {
      // Extract IP address (format is usually "192.168.1.x:8081" or "192.168.1.x:19000")
      const host = debuggerHost.split(':')[0];
      const autoDetectedUrl = `http://${host}:3000`;
      console.log('🔍 Auto-detected API URL from Expo:', autoDetectedUrl);
      return autoDetectedUrl;
    }
    
    // Fallback options for different scenarios
    if (Platform.OS === 'android') {
      // Android emulator uses 10.0.2.2 to access host machine's localhost
      console.log('📱 Using Android emulator URL');
      return 'http://10.0.2.2:3000';
    } else if (Platform.OS === 'ios') {
      // iOS simulator can use localhost
      console.log('📱 Using iOS simulator URL');
      return 'http://localhost:3000';
    }
    
    // Last resort fallback - you can manually override this
    console.warn('⚠️ Using fallback localhost URL - connection may fail on physical devices');
    return 'http://localhost:3000';
  }
  
  // Production - replace with your actual production URL
  return 'https://api.yourapp.com/api';
};

const ENV = {
  apiUrl: getApiUrl(),
  // Add other environment variables here as needed
};

export default ENV;
