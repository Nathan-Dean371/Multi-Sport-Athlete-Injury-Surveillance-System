# Backend API Terminal
Write-Host 'BACKEND API TERMINAL' -ForegroundColor Green
Write-Host '====================' -ForegroundColor Green
Write-Host ''
Write-Host 'Waiting 10 seconds for databases to initialize...' -ForegroundColor Yellow
Start-Sleep -Seconds 10
Write-Host ''
Write-Host 'Starting NestJS backend in development mode...' -ForegroundColor Yellow
Write-Host ''

Set-Location (Join-Path (Split-Path $PSScriptRoot -Parent) 'backend')
npm run start:dev
