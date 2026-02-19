import Constants from 'expo-constants';
import { Platform } from 'react-native';

/**
 * Get the API URL based on the current environment
 * In development, it automatically uses the Expo debugger's host IP
 * This ensures it works regardless of your network/computer IP
 */
const getApiUrl = (): string => {
  // Auto-detection logic disabled for now.
  // Only use production URL.
  return 'http://54.194.7.2:3000'; // Production URL
};

const ENV = {
  apiUrl: getApiUrl(),
  // Add other environment variables here as needed
};

export default ENV;
