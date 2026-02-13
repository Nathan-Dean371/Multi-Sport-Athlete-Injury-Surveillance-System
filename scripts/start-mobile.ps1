# Mobile App Terminal
Write-Host 'MOBILE APP TERMINAL' -ForegroundColor Magenta
Write-Host '===================' -ForegroundColor Magenta
Write-Host ''
Write-Host 'Waiting 15 seconds for backend to initialize...' -ForegroundColor Yellow
Start-Sleep -Seconds 15
Write-Host ''
Write-Host 'Starting Expo development server...' -ForegroundColor Yellow
Write-Host ''

Set-Location (Join-Path (Split-Path $PSScriptRoot -Parent) 'mobile')
npx expo start
