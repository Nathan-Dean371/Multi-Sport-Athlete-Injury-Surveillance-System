# Mobile App - Injury Surveillance

React Native app for athlete-facing data collection and surveys.

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the backend server (from the root directory):
   ```bash
   npm run dev
   ```

3. Start the Expo development server:
   ```bash
   npm start
   ```

## Network Configuration

The app **automatically detects** the correct API URL based on your development environment:

- **Physical Device (via Expo Go)**: Uses your computer's network IP automatically
- **Android Emulator**: Uses `10.0.2.2:3000` (special Android emulator address)
- **iOS Simulator**: Uses `localhost:3000`

### Manual Override (Optional)

If automatic detection doesn't work, you can manually set the API URL:

1. Copy `.env.example` to `.env`
2. Uncomment and set `EXPO_PUBLIC_API_URL` to your backend URL
3. Update `src/constants/config.ts` to use the environment variable

### Testing the Connection

The app will log the API URL on startup. Check the console output to verify it's using the correct address.

### Common Issues

- **Network Error on Physical Device**: 
  - Ensure your phone and computer are on the same WiFi network
  - Check that your firewall allows connections on port 3000
  - Verify the backend is running on `http://YOUR_IP:3000`

- **Cannot reach backend**: 
  - Make sure the backend server is running (`npm run dev` in the root directory)
  - Check the backend is accessible at the logged URL

## Available Scripts

- `npm start` - Start Expo development server
- `npm run android` - Run on Android device/emulator
- `npm run ios` - Run on iOS simulator (macOS only)
- `npm run web` - Run in web browser
```