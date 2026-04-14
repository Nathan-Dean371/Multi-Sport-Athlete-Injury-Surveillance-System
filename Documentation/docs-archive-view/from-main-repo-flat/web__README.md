# Web

This folder contains the browser-based admin surface for the system. The active application lives in `web/admin-dashboard/` and is implemented with Next.js.

## Purpose

The admin dashboard is the operator-facing web app used for authentication and management tasks. It talks to the NestJS backend on port `3000` and runs locally on port `3001`.

## Local Setup

Prerequisites:

- Node.js and npm
- The backend running locally
- Docker only if you are starting the full stack through the helper scripts

Recommended startup from the repository root:

```powershell
.\scripts\start-web.ps1
```

Manual startup from the app directory:

```powershell
cd web\admin-dashboard
npm install
npm run dev
```

The app expects `NEXT_PUBLIC_API_URL=http://localhost:3000` in `.env.local` during local development.

## Project Structure

- `admin-dashboard/app/` - App Router pages and layouts
- `admin-dashboard/lib/` - API helpers and runtime configuration
- `admin-dashboard/store/` - Zustand stores for auth and UI state
- `admin-dashboard/styles/` - Tailwind/global styling
- `admin-dashboard/docs/` - app-specific design and implementation notes

## Deployment

The web app is built and deployed separately from the backend.

- GitHub Actions builds the image from `web/admin-dashboard/Dockerfile`.
- The image name used in CI/CD is `injury-surveillance-admin`.
- The deployment job starts the container on EC2 and exposes it on port `3001`.
- The Nginx reverse proxy in `ops/nginx/injury-surveillance-reverse-proxy.conf` routes `admin.yourdomain.com` to that port.

## Related Files

- [Admin dashboard README](admin-dashboard/README.md)
- [Admin dashboard package](admin-dashboard/package.json)
- [CI/CD workflow](../.github/workflows/ci.yml)
- [Operations docs](../ops/README.md)