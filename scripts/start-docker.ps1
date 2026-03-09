# Docker Terminal (Databases + Backend)
Write-Host 'DOCKER TERMINAL' -ForegroundColor Cyan
Write-Host '===============' -ForegroundColor Cyan
Write-Host ''
Write-Host 'Starting Docker containers (PostgreSQL, Neo4j, Backend API)...' -ForegroundColor Yellow
Write-Host ''

Set-Location (Split-Path $PSScriptRoot -Parent)
docker-compose up
