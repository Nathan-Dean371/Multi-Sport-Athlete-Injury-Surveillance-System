# Mobile App Setup Guide

**Multi-Sport Athlete Injury Surveillance System - React Native Mobile App**

This guide covers setting up and running the mobile app on physical devices, emulators, and simulators.

---

## Prerequisites

- [ ] **Node.js 18+** installed
- [ ] **npm** package manager
- [ ] **Expo Go app** installed on your physical device (optional, for testing)
  - [iOS App Store](https://apps.apple.com/app/expo-go/id982107779)
  - [Google Play Store](https://play.google.com/store/apps/details?id=host.exp.exponent)
- [ ] **Backend server running** (see [QUICK_START.md](QUICK_START.md))

---

## Initial Setup

### 1. Install Dependencies

Navigate to the mobile folder and install packages:

```bash
cd mobile
npm install
```

**Common Issue - Peer Dependency Conflicts:**

If you encounter errors about `@types/react` version conflicts:

```bash
# The package.json should have:
# "@types/react": "~19.1.0"
# (not ~18.2.14)
```

This was fixed to match React 19.1.0 and React Native 0.81.5 requirements.

---

## Network Configuration

### Automatic URL Detection ✨

The app **automatically detects** the correct backend API URL based on your environment:

- **Physical Device (Expo Go):** Uses your computer's network IP
- **Android Emulator:** Uses `10.0.2.2:3000`
- **iOS Simulator:** Uses `localhost:3000`

The detection logic is in `src/constants/config.ts`:

```typescript
// Extracts IP from Expo's debugger connection
const debuggerHost = Constants.expoConfig?.hostUri;
const host = debuggerHost.split(':')[0];
const apiUrl = `http://${host}:3000`;
```

### Verification

When the app starts, check the console output:

```
🔍 Auto-detected API URL from Expo: http://192.168.1.100:3000
🌐 API Service initialized with baseURL: http://192.168.1.100:3000
```

### Manual Override (If Needed)

If automatic detection doesn't work:

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Edit `.env` and set your backend URL:
   ```
   EXPO_PUBLIC_API_URL=http://192.168.1.100:3000
   ```

3. Update `src/constants/config.ts` to use the environment variable

---

## Running the Mobile App

### Option 1: Physical Device (Recommended)

**Prerequisites:**
- Backend server running
- Phone and computer on the **same WiFi network**
- Expo Go app installed

**Steps:**

1. Start the backend server (in root directory):
   ```bash
   npm run dev
   # OR
   cd backend
   npm run start:dev
   ```

2. Start the Expo development server (in mobile directory):
   ```bash
   cd mobile
   npm start
   ```

3. Scan the QR code:
   - **iOS:** Open Camera app, scan QR code
   - **Android:** Open Expo Go app, tap "Scan QR code"

4. Verify connection:
   - Check console for auto-detected URL
   - Try logging in:
     ```
     Email: liam.murphy@email.com
     Password: password123
     ```

**Troubleshooting:**

```
❌ Network Error
```

**Solutions:**
- Verify both devices are on the same WiFi
- Check Windows Firewall allows port 3000
- Ensure backend is running: `curl http://localhost:3000`
- Check the logged API URL matches your computer's IP

---

### Option 2: Android Emulator

**Prerequisites:**
- Android Studio installed
- Android emulator configured

**Steps:**

1. Start the Android emulator

2. Start backend and mobile app:
   ```bash
   # Terminal 1 - Backend
   cd backend
   npm run start:dev

   # Terminal 2 - Mobile
   cd mobile
   npm run android
   ```

3. The app will automatically use `http://10.0.2.2:3000` (Android emulator's special address for host machine's localhost)

---

### Option 3: iOS Simulator (macOS Only)

**Prerequisites:**
- Xcode installed
- iOS Simulator configured

**Steps:**

1. Start backend:
   ```bash
   cd backend
   npm run start:dev
   ```

2. Start mobile app in iOS simulator:
   ```bash
   cd mobile
   npm run ios
   ```

3. The app will automatically use `http://localhost:3000`

---

## Available Test Credentials

### Player Account
```
Email: liam.murphy@email.com
Password: password123
Role: Player
```

### Athletic Trainer Account
```
Email: dr.sarah.mitchell@email.com
Password: password123
Role: Trainer
```

### Coach Account
```
Email: coach.mike.robinson@email.com
Password: password123
Role: Coach
```

---

## Development Workflow

### Making Changes

1. Edit files in `mobile/src/`
2. Save - Expo will auto-reload
3. For hard refresh: Shake device → "Reload"

### Clearing Cache

```bash
# Clear Expo cache
cd mobile
npx expo start -c
```

### Viewing Logs

- **In Terminal:** All console.log output appears here
- **In App:** Shake device → "Show Dev Menu" → "Debug Remote JS"

---

## Project Structure

```
mobile/
├── App.tsx                 # Root component
├── app.json               # Expo configuration
├── package.json           # Dependencies
├── .env.example           # Environment variable template
└── src/
    ├── constants/
    │   └── config.ts      # API URL detection logic
    ├── contexts/
    │   └── AuthContext.tsx
    ├── navigation/
    │   └── AppNavigator.tsx
    ├── screens/
    │   ├── LoginScreen.tsx
    │   └── HomeScreen.tsx
    ├── services/
    │   ├── api.service.ts
    │   └── auth.service.ts
    └── types/
        └── index.ts
```

---

## Common Issues & Solutions

### Issue: "Network Error" on Login

**Cause:** App can't reach backend server

**Solutions:**
1. Verify backend is running:
   ```bash
   curl http://localhost:3000
   # Should return: Multi-Sport Athlete Injury Surveillance System API - v1.0.0
   ```

2. Check firewall settings (Windows):
   ```powershell
   # Allow Node.js through firewall
   New-NetFirewallRule -DisplayName "Node.js Server" -Direction Inbound -Program "C:\Program Files\nodejs\node.exe" -Action Allow
   ```

3. Verify the logged API URL is correct

4. Ensure same WiFi network (for physical devices)

### Issue: "Unable to resolve module"

**Cause:** Missing dependencies or cache issue

**Solution:**
```bash
cd mobile
rm -rf node_modules
npm install
npx expo start -c
```

### Issue: QR Code Won't Scan

**Cause:** Network configuration or firewall

**Solution:**
1. Try tunnel mode:
   ```bash
   npx expo start --tunnel
   ```

2. Or connect via URL manually in Expo Go app

### Issue: App Crashes on Startup

**Cause:** Incompatible package versions

**Solution:**
```bash
# Verify @types/react version
cat package.json | grep "@types/react"
# Should show: "@types/react": "~19.1.0"

# Reinstall if wrong version
npm install @types/react@~19.1.0 --save-dev
```

---

## Building for Production

### Android APK

```bash
cd mobile
eas build --platform android --profile preview
```

### iOS Build (macOS only)

```bash
cd mobile
eas build --platform ios --profile preview
```

### App Stores

See [Expo's deployment guide](https://docs.expo.dev/distribution/introduction/) for full production deployment.

---

## Key Changes Made

### 1. Fixed npm Install Error
**Problem:** Peer dependency conflict between React 19.1.0 and @types/react 18.2.14

**Solution:** Updated `package.json`:
```json
"@types/react": "~19.1.0"  // Was: "~18.2.14"
```

### 2. Dynamic API URL Detection
**Problem:** Hardcoded IP address `http://10.185.239.254:3000` didn't work across different networks

**Solution:** Implemented automatic detection in `src/constants/config.ts`:
- Extracts IP from Expo's debugger connection
- Falls back to platform-specific defaults
- Supports manual override via environment variable
- Logs detected URL for verification

### 3. Enhanced Documentation
- Created `.env.example` for manual configuration
- Updated `mobile/README.md` with network setup guide
- Added troubleshooting section

---

## Next Steps

- [ ] Test login with all user roles
- [ ] Test injury reporting functionality
- [ ] Verify data sync with backend
- [ ] Set up push notifications (future)
- [ ] Configure app icons and splash screens

---

## Additional Resources

- [Expo Documentation](https://docs.expo.dev/)
- [React Native Documentation](https://reactnative.dev/)
- [Backend API Documentation](http://localhost:3000/api)
- [Main Quick Start Guide](QUICK_START.md)

---

**Last Updated:** February 9, 2026
**Status:** ✅ Verified working on physical Android device
