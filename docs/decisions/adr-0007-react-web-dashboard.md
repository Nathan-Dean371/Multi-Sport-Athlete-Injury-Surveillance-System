# ADR-0007: React Web Dashboard Technology

**Status:** Proposed

**Date:** January 2025

**Deciders:** Nathan Dean

---

## Context

The Multi-Sport Athlete Injury Surveillance System requires a web-based admin dashboard for:
- Administrators managing organizations and teams
- Generating analytics and reports
- Managing user permissions and access control

Key requirements:
- **Responsive Design**: Works on desktop, tablet, and mobile browsers
- **Real-time Updates**: Display current injury status without manual refresh
- **Data Visualization**: Charts, graphs, and statistics
- **Role-Based Views**: Different interfaces for coaches, admins, medical staff
- **Fast Performance**: Quick page loads and smooth interactions
- **TypeScript Integration**: Share types with backend (monorepo benefit)
- **Authentication**: Integrate with JWT auth system (ADR-0006)
- **API Integration**: Consume NestJS REST API (ADR-0004)

Academic considerations:
- Development timeline: ~6 weeks for web dashboard
- Learning curve vs productivity
- Demonstration value for FYP presentation
- Code quality and maintainability

### Framework Options Considered

#### 1. Create React App (CRA)
**Pros:**
- Simple setup: `npx create-react-app web --template typescript`
- Zero configuration needed
- Well-documented
- No server-side complexity

**Cons:**
- Deprecated/unmaintained (React team recommends alternatives)
- Slow build times
- No built-in routing or data fetching patterns
- Heavy bundle sizes
- Requires manual configuration for optimizations

**Verdict:** Not recommended due to maintenance status

#### 2. Vite + React
**Pros:**
- Extremely fast development server (HMR in milliseconds)
- Modern build tool (esbuild + Rollup)
- Minimal configuration
- Excellent TypeScript support
- Growing ecosystem
- Client-side only (simpler deployment)
- Smaller bundle sizes than CRA

**Cons:**
- Need to choose routing library (React Router)
- Need to choose state management approach
- No built-in API route handlers
- Less opinionated (more decisions needed)

**Verdict:** Strong candidate for FYP scope

#### 3. Next.js
**Pros:**
- Production-ready framework
- Built-in routing (file-based)
- Server-side rendering (SSR) capabilities
- API routes (could host backend endpoints)
- Image optimization
- Code splitting automatic
- Excellent documentation
- Industry standard (good for CV)

**Cons:**
- More complex than needed for this project
- Server-side rendering not required (we have NestJS backend)
- Steeper learning curve
- More moving parts to debug
- Deployment more complex (needs Node.js server)

**Verdict:** Overkill for FYP, but professional choice

#### 4. Remix
**Pros:**
- Modern React framework
- Excellent data loading patterns
- Built-in form handling
- Progressive enhancement

**Cons:**
- Newer framework (smaller community)
- Server-side focus (we have NestJS)
- Less familiar to most developers
- Overkill for client-heavy dashboard

**Verdict:** Not ideal for this use case

---

## Decision

We will use **Vite + React + TypeScript** for the web dashboard with the following stack:

### Core Framework
- **Vite**: Build tool and dev server
- **React 18**: UI library
- **TypeScript**: Type safety (shared with backend)

### Essential Libraries
- **React Router v6**: Client-side routing
- **TanStack Query (React Query)**: API data fetching and caching
- **Axios**: HTTP client (consistent with mobile app)
- **Material-UI (MUI)**: Component library for professional UI

### Optional/Phase 2
- **Recharts** or **Chart.js**: Data visualization
- **React Hook Form**: Form management
- **Zod**: Runtime validation (can share schemas with backend)

### Project Structure
```
web/
├── src/
│   ├── components/        # Reusable UI components
│   │   ├── common/        # Buttons, inputs, cards
│   │   ├── layout/        # Header, sidebar, footer
│   │   └── features/      # Feature-specific components
│   ├── pages/             # Route components
│   │   ├── LoginPage.tsx
│   │   ├── DashboardPage.tsx
│   │   ├── TeamsPage.tsx
│   │   └── PlayersPage.tsx
│   ├── services/          # API client
│   │   ├── api.ts         # Axios instance
│   │   └── auth.service.ts
│   ├── hooks/             # Custom React hooks
│   ├── contexts/          # React Context (auth, theme)
│   ├── types/             # TypeScript types (import from @shared)
│   ├── utils/             # Helper functions
│   ├── App.tsx            # Root component
│   ├── main.tsx           # Entry point
│   └── routes.tsx         # Route configuration
├── public/                # Static assets
├── index.html
├── vite.config.ts
├── tsconfig.json
└── package.json
```

---

## Consequences

### Positive

1. **Development Speed**
   - Vite's HMR is near-instant (changes reflect in <100ms)
   - Quick project setup and scaffolding
   - Hot reload during development significantly speeds up UI iteration

2. **Performance**
   - Fast build times (3-5x faster than CRA)
   - Optimized production bundles
   - Code splitting out of the box
   - Better Lighthouse scores

3. **Developer Experience**
   - TypeScript integration is seamless
   - Excellent error messages
   - Modern JavaScript features supported
   - Growing community and ecosystem

4. **Monorepo Integration**
   - Easy to share types: `import { InjuryDTO } from '@shared/types'`
   - Consistent TypeScript configuration
   - Shared utilities and constants

5. **Learning Value**
   - Modern tooling (Vite is becoming industry standard)
   - Demonstrates understanding of build tools
   - Transferable React skills

6. **Simplicity**
   - Client-side only (no SSR complexity)
   - Deploy as static files (Netlify, Vercel, S3)
   - Clear separation: NestJS handles backend, Vite handles frontend

7. **Cost**
   - Static hosting is free (Netlify, Vercel, GitHub Pages)
   - No server costs for frontend

### Negative

1. **Decision Overhead**
   - Need to choose routing library (but React Router is standard)
   - Need to choose state management (but React Query covers most needs)
   - Less "batteries included" than Next.js

2. **Relative Newness**
   - Vite is newer than Webpack (but well-adopted now)
   - Smaller ecosystem than Next.js (but growing rapidly)

3. **No SSR**
   - Client-side only means initial load shows blank page briefly
   - Not ideal for SEO (but admin dashboard doesn't need SEO)

4. **Manual Optimization**
   - Need to manually configure some optimizations that Next.js provides automatically
   - Code splitting requires explicit React.lazy usage

### Mitigation Strategies

1. **Decision Overhead**
   - Use React Router (industry standard, well-documented)
   - Use React Query for server state (recommended pattern)
   - Use React Context for auth state (simple, sufficient)

2. **Learning Curve**
   - Vite documentation is excellent
   - React Router v6 has clear migration guides
   - Material-UI has comprehensive examples

3. **Performance**
   - Implement route-based code splitting: `React.lazy(() => import('./pages/Dashboard'))`
   - Use React Query for caching and background refetching
   - Optimize bundle with Vite's built-in tools

---

## Implementation Plan

### Phase 1: Setup (Week 1)
```bash
# Create Vite project
cd web
npm create vite@latest . -- --template react-ts

# Install core dependencies
npm install react-router-dom @tanstack/react-query axios @mui/material @mui/icons-material @emotion/react @emotion/styled

# Install dev dependencies
npm install -D @types/node
```

---

## Technology Comparison

| Feature | Vite + React | Next.js | CRA |
|---------|-------------|---------|-----|
| **Setup Time** | 2 min | 2 min | 5 min |
| **Dev Server Speed** | Instant | Fast | Slow |
| **Build Speed** | Very Fast | Fast | Slow |
| **Bundle Size** | Small | Medium | Large |
| **Learning Curve** | Easy | Moderate | Easiest |
| **Deployment** | Static | Server needed | Static |
| **Maintenance** | Active | Active | Deprecated |
| **FYP Suitability** | Excellent | Good | Avoid |

---

## Example Code

### Vite Configuration
```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@shared': path.resolve(__dirname, '../shared'),
    },
  },
  server: {
    port: 3001,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
});
```

### API Client
```typescript
// src/services/api.ts
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
});

// Request interceptor for JWT
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('auth_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
```

### React Query Setup
```typescript
// src/main.tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import App from './App';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>
);
```

### Protected Route Example
```typescript
// src/components/ProtectedRoute.tsx
import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};
```

### Using Shared Types
```typescript
// src/pages/TeamsPage.tsx
import { useQuery } from '@tanstack/react-query';
import { Team } from '@shared/types'; // From monorepo shared folder
import api from '../services/api';

export const TeamsPage = () => {
  const { data: teams, isLoading } = useQuery({
    queryKey: ['teams'],
    queryFn: async () => {
      const response = await api.get<Team[]>('/teams');
      return response.data;
    },
  });

  if (isLoading) return <div>Loading teams...</div>;

  return (
    <div>
      {teams?.map(team => (
        <div key={team.id}>{team.name}</div>
      ))}
    </div>
  );
};
```

---

## Related Decisions

- **ADR-0001**: Monorepo architecture (enables @shared imports)
- **ADR-0004**: NestJS backend (provides REST API)
- **ADR-0005**: React Native mobile (shared React knowledge)
- **ADR-0006**: JWT authentication (dashboard uses same auth)

---

## Future Considerations

- Could migrate to Next.js later if SSR becomes needed
- Could add Remix for better form handling if needed
- Could use Nx or Turborepo for monorepo optimization
- Consider Progressive Web App (PWA) features

---

## References

- [Vite Documentation](https://vitejs.dev/)
- [React Router v6](https://reactrouter.com/)
- [TanStack Query](https://tanstack.com/query/latest)
- [Material-UI](https://mui.com/)
- [Vite vs Next.js Comparison](https://vitejs.dev/guide/comparisons.html)
- [React 18 Documentation](https://react.dev/)


---
