# Multi-Sport-Athlete-Injury-Surveillance-System

This Repo contains all work for my FYP of my Bachelor of Science (Honours) in Computing in Software Development Y:4.

This project is a full-stack injury surveillance system:

- **Backend API**: NestJS (Docker)
- **Databases**: Neo4j + PostgreSQL (Docker)
- **Admin Dashboard**: Next.js (local dev server)
- **Mobile App**: React Native (Expo)

---

## Prerequisites

- **Node.js (LTS)** + **npm**
- **Docker Desktop** (includes Docker Engine + Docker Compose) — **must be running** before starting the demo/dev scripts
- **PowerShell** (Windows is the primary dev/demo path for the provided `.ps1` scripts)

Optional (for mobile testing):

- **Expo Go** on a phone, or Android Studio / iOS simulator

---

## Clone & Setup

```powershell
git clone https://github.com/Nathan-Dean371/Multi-Sport-Athlete-Injury-Surveillance-System.git
cd Multi-Sport-Athlete-Injury-Surveillance-System
```

Create a local environment file for Docker/dev defaults:

```powershell
Copy-Item .env.example .env
```

First-time install for the mobile app (recommended before starting the demo):

```powershell
cd .\mobile
npm install
cd ..
```

## Quick Demo Start

Perfect for in-person demonstrations! Start all services with one command:

Make sure **Docker Desktop is running** first.

```powershell
.\start-demo.ps1
```

Use AWS backend for mobile during demo startup:

```powershell
.\start-demo.ps1 -MobileMode prod
```

This opens three terminals running:

- **Terminal 1**: Docker stack (databases + migrations + backend API + pgAdmin)
- **Terminal 2**: Mobile app (Expo)
- **Terminal 3**: Admin dashboard (Next.js)

Once everything is up, you should have:

- **Backend (Swagger)**: http://localhost:3000/api
- **Admin dashboard**: http://localhost:3001
- **pgAdmin**: http://localhost:5050
- **Neo4j browser**: http://localhost:7474
- **PostgreSQL (host port)**: localhost:5433

**Demo Resources:**

- **[DEMO-CHEAT-SHEET.md](DEMO-CHEAT-SHEET.md)** - All credentials, queries, and commands for demos
- **stop-demo.ps1** - Gracefully stop all services

### Mobile Mode

By default, the mobile app runs against the local Docker backend.

To run the mobile app against the AWS-hosted backend during a demo:

```powershell
.\start-demo.ps1 -MobileMode prod
```

### Test Login

All test accounts use the same password: **`password123`**

Sample player logins:

- `liam.murphy@email.com`
- `emma.oconnor@email.com`
- `sean.kelly@email.com`

Admin dashboard login:

- `james.osullivan@admin.ie`

More sample identities are defined in `database/postgres/003-sample-identities.sql`.

### Stopping The Demo

```powershell
.\stop-demo.ps1
```

See [DEMO-CHEAT-SHEET.md](DEMO-CHEAT-SHEET.md) for Neo4j queries, API endpoints, and more!

---

## Repo Structure

```
injury-surveillance-system/
├── mobile/              # React Native app
├── web/                 # Next.js admin dashboard
├── backend/             # NestJS API
├── database/            # Database schemas and sample data
├── shared/              # Shared TypeScript types/utils
├── docs/
│   ├── sprints/        # Sprint planning & reviews
│   ├── decisions/      # Architecture Decision Records (ADRs)
│   ├── setup/          # Setup guides
│   └── architecture/   # System diagrams
├── scripts/             # Helper scripts (start-web, start-docker, seeding, etc.)
├── start-demo.ps1       # Quick demo startup script
├── stop-demo.ps1        # Demo shutdown script
├── DEMO-CHEAT-SHEET.md  # Demo reference guide
├── docker-compose.yml   # Database containers
└── README.md
```

---

## Local Startup (Manual)

If you don’t want the all-in-one demo script, you can run the per-component scripts (in **separate terminals**):

```powershell
# Databases + backend (Docker)
.\scripts\start-docker.ps1

# Admin dashboard (Next.js)
.\scripts\start-web.ps1

# Mobile app (Expo)
.\scripts\start-mobile-dev.ps1
```

---

## Documentation

Project documentation has been split into a dedicated repository: [FYP Documentation Repo](https://github.com/Nathan-Dean371/FYP-Documentation-Repo). Use this source repo for code and the documentation repo for all design, decisions, and guides.
