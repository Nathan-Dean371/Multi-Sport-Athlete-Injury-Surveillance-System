# Multi-Sport-Athlete-Injury-Surveillance-System
This Repo contains all work for my FYP of my Bachelor of Science (Honours) in Computing in Software Development Y:4. 

## Quick Demo Start

Perfect for in-person demonstrations! Start all services with one command:

```powershell
.\start-demo.ps1
```

This opens three terminals running:
- **Terminal 1**: Docker databases (Neo4j + PostgreSQL)
- **Terminal 2**: Backend API (NestJS on port 3000)
- **Terminal 3**: Frontend web app (React on port 3001)

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
├── web/                 # React admin dashboard  
├── backend/             # NestJS API
├── frontend/            # React web dashboard
├── database/            # Database schemas and sample data
├── shared/              # Shared TypeScript types/utils
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

Project documentation has been split into a dedicated repository: [FYP Documentation Repo](https://github.com/Nathan-Dean371/FYP-Documentation-Repo). Use this source repo for code and the documentation repo for all design, decisions, and guides.
