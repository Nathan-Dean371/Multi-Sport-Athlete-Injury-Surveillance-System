# ADR-0001: Monorepo Architecture

**Status:** Accepted

**Date:** November 2024

**Deciders:** Nathan Dean, Project Supervisor

---

## Context

For the Final Year Project, we need to decide on the repository structure for managing multiple codebases:
- Mobile application (React Native)
- Web admin dashboard (React)
- Backend API (NestJS)
- Shared TypeScript types and utilities
- Comprehensive documentation

Key considerations:
- Academic submission requirements (single deliverable package)
- Code sharing between frontend and backend
- Development workflow efficiency
- Supervisor review process
- Version control and commit history visibility
- CI/CD pipeline complexity

Alternative approaches considered:
1. **Multi-repo**: Separate repositories for mobile, web, backend, and shared code
2. **Monorepo**: Single repository containing all project components
3. **Hybrid**: Code in separate repos with documentation centralized

---

## Decision

We will use a **monorepo architecture** with the following structure:

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

Additionally, we maintain a separate **documentation repository** (`FYP-Documentation-Repo`) for:
- Comprehensive technical documentation
- Interactive visualizations (HTML-based schema diagrams)
- Static visual assets (SVG diagrams)
- GitHub Pages hosting for interactive docs

---

## Consequences

### Positive

- **Single Submission**: Everything packaged together for academic submission
- **Code Sharing**: Easy to share TypeScript types, utilities, and constants between mobile, web, and backend
- **Simplified Dependency Management**: Shared `package.json` for common dependencies
- **Unified Version Control**: Single commit history shows complete project evolution
- **Easier Supervisor Review**: Supervisor can clone one repo and see entire project
- **Simplified CI/CD**: Single pipeline can build and test all components
- **GitHub Projects Integration**: Easier to track issues and tasks across all components
- **Atomic Changes**: Changes that span multiple components can be committed together

### Negative

- **Larger Repository Size**: More code in a single repo
- **Build Time**: May need to build multiple projects (mitigated by proper tooling)
- **Learning Curve**: Team members need to understand monorepo tooling

### Neutral

- **Tooling**: May require workspace management tools (npm workspaces, Lerna, or Nx)
- **CI/CD Complexity**: Need to detect which apps changed to optimize builds (can be added later)

### Mitigation Strategies

- Use npm workspaces for dependency management
- Implement proper `.gitignore` to exclude build artifacts
- Use separate `node_modules` for each package
- Consider Nx or Turborepo if build performance becomes an issue (likely not needed for FYP scope)

---

## Related Decisions

- ADR-0002: Separate documentation repository for GitHub Pages hosting
- Future: May need ADR for specific monorepo tooling if project scales

---

## Notes

The separate documentation repository allows for rich interactive documentation without bloating the main codebase.
