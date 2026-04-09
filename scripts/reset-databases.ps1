# Clean Reset Databases + Rebuild via Migrations
Write-Host 'DATABASE RESET + MIGRATION REBUILD' -ForegroundColor Cyan
Write-Host '===================================' -ForegroundColor Cyan
Write-Host ''
Write-Host 'This will remove Docker volumes for project database services.' -ForegroundColor Yellow
Write-Host 'All local DB data will be deleted.' -ForegroundColor Red
Write-Host ''

Set-Location (Split-Path $PSScriptRoot -Parent)

$env:COMPOSE_PROGRESS = 'plain'
$env:COMPOSE_ANSI = 'never'

Write-Host 'Stopping stack and removing volumes...' -ForegroundColor Yellow
docker compose down -v
if ($LASTEXITCODE -ne 0) {
	Write-Host '[ERROR] Failed to stop/remove volumes.' -ForegroundColor Red
	exit $LASTEXITCODE
}

Write-Host ''
Write-Host 'Rebuilding from migration-first flow...' -ForegroundColor Yellow
& (Join-Path $PSScriptRoot 'start-databases.ps1')
if ($LASTEXITCODE -ne 0) {
	Write-Host '[ERROR] Rebuild failed.' -ForegroundColor Red
	exit $LASTEXITCODE
}

Write-Host ''
Write-Host 'Reset and migration rebuild completed successfully.' -ForegroundColor Green
