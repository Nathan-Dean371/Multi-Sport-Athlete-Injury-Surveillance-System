

## 11/11
Lit review title for now on anonymisation and pseudonymisation of medical data.

- User Stories for players, coaches, administrators
- What data is useful for stats and reports - usage, login dates (give frequency and last)
- What notifications/reminders for each?
- Set up training regime, reminder based on this, plus get report on how the player feels after training/game.
- Build a history of "feeling about training" using graphics

19/11
# Monorepo Setup & GitHub Projects - Quick Summary

## **Repository Structure**

```
injury-surveillance-system/
├── mobile/              # React Native app
├── web/                 # React admin dashboard  
├── backend/             # NestJS API
├── shared/              # Shared TypeScript types/utils
├── docs/
│   ├── sprints/        # Sprint planning & reviews
│   ├── decisions/      # Architecture Decision Records (ADRs)
│   └── architecture/   # System diagrams
├── .github/workflows/   # CI/CD
└── README.md
```

**Why Monorepo?**

- Everything in one place (easy to submit)
- Share code between mobile/web/backend
- Simpler for GitHub Projects
- Single commit history shows all your work
- Easier for supervisor to review

[[4th Year/Planning Sprint 1|Planning Sprint 1]]

[[Planning Sprint 2]]

