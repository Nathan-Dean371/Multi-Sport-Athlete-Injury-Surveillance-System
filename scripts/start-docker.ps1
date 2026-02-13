# Docker Databases Terminal
Write-Host 'DATABASE TERMINAL' -ForegroundColor Cyan
Write-Host '==================' -ForegroundColor Cyan
Write-Host ''
Write-Host 'Starting Docker containers...' -ForegroundColor Yellow
Write-Host ''

Set-Location (Split-Path $PSScriptRoot -Parent)
docker-compose up
