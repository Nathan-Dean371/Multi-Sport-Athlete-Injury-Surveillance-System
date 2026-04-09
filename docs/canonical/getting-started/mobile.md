---
title: Mobile Setup
doc_type: guide
status: active-staging
last_updated: 2026-04-09
owner: docs
canonical: true
---

# Mobile Setup (Canonical)

## Run Mobile App

```powershell
cd mobile
npm install
npm start
```

## Recommended Demo Path

For demos, start from root so services open in coordinated terminals:

```powershell
.\start-demo.ps1
```

Use AWS-backed mobile mode:

```powershell
.\start-demo.ps1 -MobileMode prod
```

## Connectivity

- Backend should be reachable at `http://localhost:3000`.
- Mobile app environment handling and API URL behavior are defined in mobile app code/config.

## Test Account

- Email: `liam.murphy@email.com`
- Password: `password123`
