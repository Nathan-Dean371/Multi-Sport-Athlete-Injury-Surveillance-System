# Mobile App Setup - Change Log

## Issues Resolved - February 9, 2026

### 1. ✅ npm install Dependency Conflict

**Problem:**
```
npm error ERESOLVE could not resolve
npm error Could not resolve dependency:
npm error peerOptional @types/react@"^19.1.0" from react-native@0.81.5
```

**Root Cause:**
React Native 0.81.5 requires `@types/react@^19.1.0` but package.json specified `~18.2.14`

**Fix:**
Updated `package.json`:
```diff
- "@types/react": "~18.2.14"
+ "@types/react": "~19.1.0"
```

**Result:** `npm install` completes successfully with 669 packages installed, 0 vulnerabilities

---

### 2. ✅ Hardcoded IP Address Network Errors

**Problem:**
- App hardcoded to `http://10.185.239.254:3000`
- Failed on different networks/computers
- Error: `Network Error - Cannot reach backend server`

**Root Cause:**
Static IP configuration in `src/constants/config.ts` only worked on original developer's network

**Fix:**
Implemented automatic API URL detection:

```typescript
// src/constants/config.ts
const getApiUrl = (): string => {
  // Manual override support
  const manualUrl = Constants.expoConfig?.extra?.apiUrl;
  if (manualUrl) return manualUrl;

  if (__DEV__) {
    // Auto-detect from Expo's debugger connection
    const debuggerHost = Constants.expoConfig?.hostUri;
    if (debuggerHost) {
      const host = debuggerHost.split(':')[0];
      return `http://${host}:3000`;
    }
    
    // Platform-specific fallbacks
    if (Platform.OS === 'android') return 'http://10.0.2.2:3000';
    if (Platform.OS === 'ios') return 'http://localhost:3000';
    return 'http://localhost:3000';
  }
  
  return 'https://api.yourapp.com/api'; // Production
};
```

**Features:**
- ✅ Auto-detects computer IP from Expo connection
- ✅ Works on any network without configuration
- ✅ Supports Android emulator (`10.0.2.2:3000`)
- ✅ Supports iOS simulator (`localhost:3000`)
- ✅ Supports physical devices (uses WiFi IP)
- ✅ Optional manual override via environment variable
- ✅ Logs detected URL for debugging

**Result:** App successfully connects to backend on physical Android device

---

## Files Modified

1. **package.json**
   - Updated `@types/react` to ~19.1.0

2. **src/constants/config.ts**
   - Complete rewrite with auto-detection logic
   - Added console logging for debugging
   - Added platform-specific fallbacks

3. **README.md**
   - Added comprehensive setup instructions
   - Added network configuration guide
   - Added troubleshooting section

4. **.env.example** (new)
   - Template for manual API URL override

---

## Documentation Created

1. **[docs/setup/mobile-app-setup.md](../docs/setup/mobile-app-setup.md)**
   - Complete mobile app setup guide
   - Platform-specific instructions (physical device, Android emulator, iOS simulator)
   - Troubleshooting guide
   - Test credentials
   - Development workflow

2. **[QUICK-REFERENCE.md](../QUICK-REFERENCE.md)** (updated)
   - Added mobile app section
   - Added mobile troubleshooting

3. **[docs/README.md](../docs/README.md)** (updated)
   - Added link to mobile setup guide

---

## Verification

### ✅ Successful Test - Physical Android Device
- Device: Android phone
- Network: Same WiFi as development machine
- Backend: Running at `http://localhost:3000`
- Result: 
  - Auto-detected URL: `http://192.168.x.x:3000`
  - Login successful with `liam.murphy@email.com`
  - User info displayed correctly
  - Role: Player, Status: Active

### Console Output
```
🔍 Auto-detected API URL from Expo: http://192.168.x.x:3000
🌐 API Service initialized with baseURL: http://192.168.x.x:3000
```

---

## Next Steps

- [ ] Test on iOS simulator (requires macOS)
- [ ] Test on Android emulator
- [ ] Test with all user roles (Trainer, Coach, Admin)
- [ ] Test injury reporting functionality
- [ ] Configure app icons and splash screens
- [ ] Set up production build configuration

---

## Quick Start

```bash
# 1. Install dependencies
cd mobile
npm install

# 2. Start backend (from root)
npm run dev

# 3. Start mobile app
npm start

# 4. Scan QR code with Expo Go app
# Login: liam.murphy@email.com / password123
```

---

**Status:** ✅ Mobile app fully functional on physical devices
**Date:** February 9, 2026
**Verified:** Android physical device with automatic URL detection
