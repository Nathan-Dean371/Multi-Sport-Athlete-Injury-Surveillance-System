# Docker Terminal (Databases + Backend)
Write-Host 'DOCKER TERMINAL' -ForegroundColor Cyan
Write-Host '===============' -ForegroundColor Cyan
Write-Host ''
Write-Host 'Starting Docker containers (DBs + migrations, then backend + pgAdmin)...' -ForegroundColor Yellow
Write-Host ''

Set-Location (Split-Path $PSScriptRoot -Parent)

# Ensure databases are up and migrations are applied first.
& (Join-Path $PSScriptRoot 'start-databases.ps1')
if ($LASTEXITCODE -ne 0) {
	Write-Host '[ERROR] Database startup / migrations failed.' -ForegroundColor Red
	exit $LASTEXITCODE
}

Write-Host ''
Write-Host 'Starting backend + pgAdmin...' -ForegroundColor Yellow

# Attach to logs for backend/pgAdmin only (DBs already running).
docker compose up backend pgadmin
