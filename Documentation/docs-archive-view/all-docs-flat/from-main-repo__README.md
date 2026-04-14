# Multi-Sport-Athlete-Injury-Surveillance-System

This Repo contains all work for my FYP of my Bachelor of Science (Honours) in Computing in Software Development Y:4.

## Quick Demo Start

Perfect for in-person demonstrations! Start all services with one command:

```powershell
.\start-demo.ps1
```

Use AWS backend for mobile during demo startup:

```powershell
.\start-demo.ps1 -MobileMode prod
```

This opens three terminals running:

- **Terminal 1**: Docker stack (databases + backend API)
- **Terminal 2**: Mobile app (Expo, dev mode by default)
- **Terminal 3**: Admin dashboard web app (Next.js on port 3001)

**Demo Resources:**

- **[DEMO-CHEAT-SHEET.md](DEMO-CHEAT-SHEET.md)** - All credentials, queries, and commands for demos
- **stop-demo.ps1** - Gracefully stop all services

### Test Login

- **Email**: `liam.murphy@email.com`
- **Password**: `password123`

See [DEMO-CHEAT-SHEET.md](DEMO-CHEAT-SHEET.md) for Neo4j queries, API endpoints, and more!

---

## Repo Structure

```
injury-surveillance-system/
├── mobile/              # React Native app
├── web/                 # Admin dashboard web app
├── backend/             # NestJS API
├── database/            # Database schemas and sample data
├── shared/              # Shared TypeScript types/utils
├── scripts/             # Operational PowerShell scripts
├── ops/                 # Nginx and deployment-time configuration
├── docs/
│   ├── sprints/        # Sprint planning & reviews
│   ├── decisions/      # Architecture Decision Records (ADRs)
│   ├── setup/          # Setup guides
│   └── architecture/   # System diagrams
├── start-demo.ps1       # Quick demo startup script
├── stop-demo.ps1        # Demo shutdown script
├── DEMO-CHEAT-SHEET.md  # Demo reference guide
├── docker-compose.yml   # Database containers
└── README.md
```

## Documentation

Core project documentation lives in the dedicated [FYP Documentation Repo](https://github.com/Nathan-Dean371/FYP-Documentation-Repo), while this repository now keeps the operational and implementation docs that need to sit next to the code, such as scripts, deployment notes, database guidance, and testing strategy.
