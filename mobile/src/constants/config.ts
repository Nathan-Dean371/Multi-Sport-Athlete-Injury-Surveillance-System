import Constants from 'expo-constants';
import { Platform } from 'react-native';

const ENV = {
  dev: {
    // Using local IP for Expo Go - works for both emulator and physical devices
    // Make sure your computer and device are on the same WiFi network
    apiUrl: 'http://10.185.239.254:3000',
  },
  staging: {
    apiUrl: 'https://staging-api.yourapp.com/api',
  },
  prod: {
    apiUrl: 'https://api.yourapp.com/api',
  },
};

const getEnvVars = () => {
  if (__DEV__) {
    return ENV.dev;
  }
  return ENV.prod;
};

export default getEnvVars();
