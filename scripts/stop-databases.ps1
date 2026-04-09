# Stop Database-Only Stack (Keep Volumes)
Write-Host 'STOP DATABASES' -ForegroundColor Cyan
Write-Host '==============' -ForegroundColor Cyan
Write-Host ''

Set-Location (Split-Path $PSScriptRoot -Parent)

$env:COMPOSE_PROGRESS = 'plain'
$env:COMPOSE_ANSI = 'never'

docker compose stop postgres neo4j neo4j-test flyway
if ($LASTEXITCODE -ne 0) {
	Write-Host '[ERROR] Failed to stop one or more services.' -ForegroundColor Red
	exit $LASTEXITCODE
}

Write-Host 'Database services stopped (volumes preserved).' -ForegroundColor Green
