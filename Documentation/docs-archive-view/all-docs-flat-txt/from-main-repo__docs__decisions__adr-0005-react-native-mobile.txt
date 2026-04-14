# ADR-0005: React Native for Mobile Application

**Status:** Accepted

**Date:** November 2024

**Deciders:** Nathan Dean

---

## Context

The injury surveillance system requires a mobile application for:
- Players to report injuries
- Players to update injury status
- Coaches to view team injury reports
- Quick access to injury data on the field/court
- Push notifications for status updates

### Requirements
- **Cross-platform**: iOS and Android support
- **Native feel**: Good UX on both platforms
- **Push notifications**: FCM integration
- **Offline capability**: Report injuries without internet (nice-to-have)
- **TypeScript**: Consistent with backend
- **Fast development**: Limited timeline (6 months)
- **Body map interaction**: Touch-based injury location selection

### Options Considered

#### 1. Native Development (Swift/Kotlin)
**Pros:**
- Best performance
- Native UI components
- Full access to device APIs
- Best debugging tools

**Cons:**
- Need to build two separate apps (iOS and Android)
- Two codebases to maintain
- Double development time
- Different languages (Swift + Kotlin)
- Can't share code with backend
- Significantly exceeds FYP scope

#### 2. Flutter
**Pros:**
- Good performance (compiled to native)
- Single codebase
- Growing popularity
- Good documentation

**Cons:**
- Dart language (can't share types with TypeScript backend)
- Different ecosystem from web/backend
- Smaller community than React Native
- Learning curve for new language

#### 3. React Native (Selected)
**Pros:**
- Single codebase for iOS and Android
- JavaScript/TypeScript (consistent with backend)
- Can share types and utilities from monorepo
- Large community and ecosystem
- Expo for rapid development
- Good performance for most use cases
- React skills transferable to web dashboard
- Excellent debugging tools (React DevTools)

**Cons:**
- Not truly native performance
- Occasional platform-specific issues
- Updates can break things
- Bridge overhead

#### 4. Progressive Web App (PWA)
**Pros:**
- Web technologies
- No app store approval
- Easy updates

**Cons:**
- Limited native features
- Poor offline support
- No push notifications on iOS
- Less native feel
- Not suitable for on-field use

---

## Decision

We will use **React Native with Expo** for the mobile application.

### Key Decision Points

#### 1. TypeScript Monorepo Integration
```typescript
// shared/types/injury.types.ts
export interface InjuryDTO {
  bodyPart: string;
  injuryType: string;
  severity: 'mild' | 'moderate' | 'severe';
  painLevel: number;
}

// mobile/src/screens/ReportInjury.tsx
import { InjuryDTO } from '@shared/types';

const injury: InjuryDTO = {
  bodyPart: 'knee',
  // ... type-safe across mobile and backend
};
```

#### 2. Expo vs Bare React Native
We'll start with **Expo** for faster development:
- Built-in navigation
- Push notifications setup
- Easy testing on devices
- Simpler build process
- Can eject to bare if needed

#### 3. Navigation
Use React Navigation v6:
- Industry standard
- Good TypeScript support
- Stack, Tab, and Drawer navigators
- Deep linking support

#### 4. State Management
Start with React Context/Hooks:
- Sufficient for FYP scope
- Less boilerplate than Redux
- Can add Redux Toolkit later if needed

---

## Consequences

### Positive

1. **Code Sharing**
   - Share TypeScript types with backend
   - Share validation logic
   - Share API client code
   - Share utilities (date formatting, etc.)

2. **Development Speed**
   - Single codebase for both platforms
   - Hot reload during development
   - Expo simplifies setup and deployment
   - React DevTools for debugging

3. **Team Efficiency**
   - Same technology as web dashboard
   - JavaScript/TypeScript throughout stack
   - Consistent patterns across projects
   - Easy context switching

4. **Community & Ecosystem**
   - Large library of components
   - Many solved problems
   - Good documentation
   - Active community support

5. **Academic Value**
   - Demonstrates cross-platform development
   - Shows modern mobile development practices
   - TypeScript proficiency across stack

### Negative

1. **Performance**
   - JavaScript bridge overhead
   - Not as fast as native
   - Large app bundle size

2. **Platform Differences**
   - Occasional iOS vs Android quirks
   - Need to test on both platforms
   - Some features require native modules

3. **Dependencies**
   - Large node_modules
   - Dependency conflicts possible
   - Updates can break things

4. **Learning Curve**
   - React Native specifics (vs web React)
   - Navigation patterns
   - Platform-specific styling

### Mitigation

1. **Performance**: FYP scope doesn't require intensive operations; React Native is sufficient
2. **Testing**: Test on both iOS simulator and Android emulator regularly
3. **Dependencies**: Lock versions, thorough testing before updates
4. **Learning**: Extensive documentation available, Expo simplifies common tasks

---

## Technology Stack

### Core
- **React Native**: 0.72+
- **Expo**: Latest SDK
- **TypeScript**: 5.x
- **React**: 18.x

### Navigation
- **React Navigation v6**: Stack, Tab, Drawer navigators

### State Management
- **React Context**: For global state
- **React Query**: For server state (API calls)

### UI Components
- **React Native Paper**: Material Design components
- **React Native Elements**: Additional UI components
- **Custom components**: For injury body map

### Forms & Validation
- **React Hook Form**: Form management
- **Yup**: Validation schemas (shared with backend)

### Networking
- **Axios**: HTTP client
- **React Query**: Caching, refetching

### Notifications
- **Expo Notifications**: Push notifications via FCM

### Development Tools
- **ESLint**: Code linting
- **Prettier**: Code formatting
- **Jest**: Unit testing
- **React Native Testing Library**: Component testing

---

## Application Architecture

### Screens (MVP)
```
mobile/
├── src/
│   ├── screens/
│   │   ├── auth/
│   │   │   ├── LoginScreen.tsx
│   │   │   ├── RegisterScreen.tsx
│   │   │   └── OnboardingScreen.tsx
│   │   ├── player/
│   │   │   ├── PlayerDashboardScreen.tsx
│   │   │   ├── ReportInjuryScreen.tsx
│   │   │   ├── InjuryBodyMapScreen.tsx
│   │   │   ├── InjuryHistoryScreen.tsx
│   │   │   └── ProfileScreen.tsx
│   │   └── coach/
│   │       ├── CoachDashboardScreen.tsx
│   │       ├── TeamDetailScreen.tsx
│   │       └── PlayerDetailScreen.tsx
│   │
│   ├── components/
│   │   ├── BodyMap.tsx
│   │   ├── InjuryCard.tsx
│   │   └── StatusBadge.tsx
│   │
│   ├── navigation/
│   │   ├── AppNavigator.tsx
│   │   ├── AuthNavigator.tsx
│   │   └── PlayerNavigator.tsx
│   │
│   ├── services/
│   │   ├── api.service.ts
│   │   ├── auth.service.ts
│   │   └── notification.service.ts
│   │
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   ├── useInjuries.ts
│   │   └── useNotifications.ts
│   │
│   ├── context/
│   │   ├── AuthContext.tsx
│   │   └── ThemeContext.tsx
│   │
│   └── utils/
│       ├── constants.ts
│       └── helpers.ts
```

---

## Development Workflow

### Setup
```bash
cd mobile
npx create-expo-app . --template blank-typescript
npm install
```

### Development
```bash
# Start Expo dev server
npm start

# Run on iOS simulator
npm run ios

# Run on Android emulator
npm run android

# Run tests
npm test
```

### Build & Deploy
```bash
# Build APK/IPA
eas build --platform android
eas build --platform ios

# Submit to app stores (future)
eas submit
```

---

## Integration Examples

### API Client
```typescript
// mobile/src/services/api.service.ts
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const api = axios.create({
  baseURL: process.env.API_URL || 'http://localhost:3000/api',
});

api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
```

### Shared Types Usage
```typescript
// mobile/src/screens/ReportInjury.tsx
import { CreateInjuryDto } from '@shared/dtos';
import api from '../services/api.service';

const submitInjury = async (data: CreateInjuryDto) => {
  const response = await api.post('/injuries', data);
  return response.data;
};
```

### Push Notifications
```typescript
// mobile/src/services/notification.service.ts
import * as Notifications from 'expo-notifications';
import api from './api.service';

export async function registerForPushNotifications() {
  const { status } = await Notifications.requestPermissionsAsync();
  
  if (status === 'granted') {
    const token = (await Notifications.getExpoPushTokenAsync()).data;
    await api.post('/users/device-token', { token });
  }
}
```

---

## Platform-Specific Considerations

### iOS
- Test on iOS Simulator (Xcode required)
- Push notifications require Apple Developer account (production)
- App Store review process

### Android
- Test on Android Emulator (Android Studio)
- Push notifications via FCM (free)
- Google Play Store deployment easier

### Development Focus
- Primary development on one platform
- Regular testing on both
- Platform-specific code isolated

---

## Related Decisions

- ADR-0001: Monorepo (enables code sharing)
- ADR-0004: NestJS backend (consistent TypeScript)
- ADR-0007: React web dashboard (shared React knowledge)

---

## Future Enhancements

- Offline support with local storage
- Camera integration for injury photos
- Biometric authentication
- Wearable device integration
- Dark mode support

---

## References

- [React Native Documentation](https://reactnative.dev/)
- [Expo Documentation](https://docs.expo.dev/)
- [React Navigation](https://reactnavigation.org/)
- [React Native Paper](https://callstack.github.io/react-native-paper/)

---

