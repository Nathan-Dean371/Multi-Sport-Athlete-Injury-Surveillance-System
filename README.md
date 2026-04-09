# Multi-Sport-Athlete-Injury-Surveillance-System

This Repo contains all work for my FYP of my Bachelor of Science (Honours) in Computing in Software Development Y:4.

Canonical docs now live in this repository under `docs/`.

## Quick Demo Start

Perfect for in-person demonstrations! Start all services with one command:

```powershell
.\start-demo.ps1
```

Use AWS backend for mobile during demo startup:

```powershell
.\start-demo.ps1 -MobileMode prod
```

This opens two launcher terminals that start all demo services:

- **Terminal 1**: Docker services (databases + backend startup workflow)
- **Terminal 2**: Mobile app launcher (Expo)

**Demo Resources:**

- [Canonical Demo Guide](docs/canonical/getting-started/demo.md) - Primary demo startup instructions
- [Legacy Demo Cheat Sheet](DEMO-CHEAT-SHEET.md) - Deprecated reference page
- [Demo Stop Script](stop-demo.ps1) - Gracefully stop all services

### Test Login

- **Email**: `liam.murphy@email.com`
- **Password**: `password123`

See [Canonical Demo Guide](docs/canonical/getting-started/demo.md) for the current demo path.

---

## Repo Structure

```
injury-surveillance-system/
├── mobile/              # React Native app
├── web/                 # React admin dashboard
├── backend/             # NestJS API
├── frontend/            # React web dashboard
├── database/            # Database schemas and sample data
├── shared/              # Shared TypeScript types/utils
├── docs/
│   ├── canonical/      # Canonical docs tree (staging)
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

- **Primary index:** [docs/README.md](docs/README.md)
- **Canonical staging tree:** [docs/canonical/README.md](docs/canonical/README.md)

The external `FYP-Documentation-Repo-main/` folder is retained only as migration source material during consolidation.
