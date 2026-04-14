# Admin Dashboard

A Next.js admin dashboard for the Multi-Sport Athlete Injury Surveillance System.

## Getting Started

Install dependencies:

```bash
npm install
```

Make sure the backend is running:

```bash
cd ../..
cd backend
npm run start:dev
```

Run the development server from the admin-dashboard directory:

```bash
npm run dev
```

Open [http://localhost:3001](http://localhost:3001) in your browser to see the result.

## Authentication

The dashboard integrates with the backend authentication system:

- **API Endpoint:** `POST /auth/login`
- **Default Test Password:** `password123`
- **Response:** JWT access token + user info
- **Storage:** Token stored in localStorage for persistence

### Getting Test Credentials

1. Check your PostgreSQL database for admin user accounts:

```sql
SELECT email FROM user_accounts WHERE identity_type = 'admin' LIMIT 5;
```

2. Use any admin email with password: `password123`

## Configuration

The `.env.local` file contains:

```
NEXT_PUBLIC_API_URL=http://localhost:3000
```

Update this if your backend runs on a different port/URL.

## CI/CD and Docker

The admin dashboard is included in the GitHub Actions workflow at `.github/workflows/ci.yml`:

- **PRs**: runs `npm ci`, `npm run lint`, and `npm run build` for `web/admin-dashboard`
- **main / manual**: builds and pushes a Docker image to ECR (`injury-surveillance-admin`)
- **deploy**: pulls and runs the container on EC2 as `injury-surveillance-admin` and exposes it on port **3001**

The Dockerfile is in `web/admin-dashboard/Dockerfile`.

### API Base URL in production

This dashboard uses `NEXT_PUBLIC_API_URL` (default: `http://localhost:3000`).

In production, `lib/runtime-config.ts` rewrites a `localhost` API host to the current browser hostname (e.g. `http://<EC2_HOST>:3000`), which avoids hard-coding an environment-specific API domain.

## Project Structure

- `app/` - Next.js App Router pages
  - `page.tsx` - Login page (/)
  - `dashboard/page.tsx` - Dashboard home page (/dashboard)
- `lib/` - Utilities
  - `api.ts` - API client for backend requests
  - `useAuthInit.ts` - Auth initialization hook
- `store/` - Zustand stores for state management
  - `authStore.ts` - Authentication state with real backend integration
- `styles/` - Global CSS with Tailwind

## Features

✅ Dark theme with lime green accents  
✅ Real backend authentication integration  
✅ JWT token management & localStorage persistence  
✅ Protected routes with auth guards  
✅ Error handling & validation  
✅ Responsive design  
✅ Built with Next.js 14 + React 18 + Tailwind CSS + Zustand

## API Client

The `apiClient` in `lib/api.ts` provides:

- `login(email, password)` - Authenticate user and get JWT token
- Automatic JWT token handling in requests
- Token persistence in localStorage
- Error handling with typed responses

Usage example:

```typescript
import { useAuthStore } from "@/store/authStore";

const { login } = useAuthStore();
try {
  await login("admin@example.com", "password123");
} catch (error) {
  console.error("Login failed:", error);
}
```

## Troubleshooting

**"Module not found" errors:**

- Make sure `tsconfig.json` has the path alias configured
- Run `npm install` to ensure dependencies are installed

**Backend connection issues:**

- Check that backend is running on `http://localhost:3000`
- Verify `NEXT_PUBLIC_API_URL` in `.env.local`
- Check browser console for CORS or network errors

**Login not working:**

- Verify admin user exists in database
- Password must be `password123` for test accounts
- Check backend logs for authentication errors
