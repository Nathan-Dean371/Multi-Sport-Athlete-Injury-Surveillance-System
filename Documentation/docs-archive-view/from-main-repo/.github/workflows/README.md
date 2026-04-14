# GitHub Actions Workflows

This folder currently contains the repository's single CI/CD workflow: `ci.yml`.

## What The Workflow Does

The pipeline validates backend and web changes, runs database migrations against isolated services, builds release images, and deploys to EC2 when the run is allowed to reach the deployment stage.

## Triggers

`ci.yml` runs on:

- pushes to `main` and `develop`
- pull requests targeting `main` and `develop`
- manual runs through `workflow_dispatch`

## Job Breakdown

### `test-backend`

- Runs on every trigger.
- Starts PostgreSQL 16 and Neo4j 5.25 as GitHub Actions services.
- Runs Flyway `validate` and `migrate` against the test PostgreSQL database.
- Builds and runs `neo4j-migrations` against the test Neo4j service.
- Runs backend linting, unit tests, and E2E tests.
- Uploads backend coverage to Codecov.

### `test-admin-dashboard`

- Runs on every trigger.
- Installs dependencies in `web/admin-dashboard`.
- Runs lint and build checks for the Next.js admin dashboard.

### `build-and-push`

- Runs only on `main` pushes or manual dispatches.
- Builds and pushes the backend image to Amazon ECR.
- Uses `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY` for the ECR login and push.

### `build-and-push-admin`

- Runs only on `main` pushes or manual dispatches.
- Builds and pushes the admin dashboard image to Amazon ECR.
- Uses the `web/admin-dashboard` Dockerfile and its own ECR repository name.

### `deploy-to-ec2`

- Runs only after both build jobs succeed.
- Copies PostgreSQL and Neo4j migrations plus the Nginx config to the EC2 host.
- Runs production database migrations on the remote host.
- Pulls and restarts the backend and admin dashboard containers.

### `smoke-test`

- Runs after deployment on `main` or manual dispatch.
- Waits briefly and then checks the backend health endpoint.

## Required Environment Values

### Workflow Environment Variables

- `AWS_REGION` - used by the AWS credential and ECR steps.
- `ECR_REPOSITORY` - backend image repository name.

### Secrets Used By Build And Deploy

- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- `EC2_HOST`
- `EC2_USER`
- `EC2_SSH_KEY`
- `POSTGRES_HOST`
- `POSTGRES_PORT`
- `POSTGRES_DB`
- `POSTGRES_USER`
- `POSTGRES_PASSWORD`
- `NEO4J_URI`
- `NEO4J_USERNAME`
- `NEO4J_PASSWORD`
- `CORS_ORIGIN`
- `JWT_SECRET`
- `POSTGRES_SSL`

### GitHub Actions Variables

- `PUBLIC_WEB_URL` - passed to the backend container so invitation links and related web URLs resolve correctly in production.

## Notes

- The workflow treats the database migrations as a hard gate before lint, test, build, and deploy steps.
- The admin dashboard is the current web target; stale `frontend/` references should not be reintroduced.
- See [docs/TESTING-STRATEGY.md](../../docs/TESTING-STRATEGY.md) for the higher-level testing philosophy behind the workflow.