[CmdletBinding()]
param(
	[ValidateSet('dev', 'prod')]
	[string]$Mode = 'dev'
)

# Mobile App Terminal
Write-Host 'MOBILE APP TERMINAL' -ForegroundColor Magenta
Write-Host '===================' -ForegroundColor Magenta
Write-Host ''
Write-Host "Launch mode: $Mode" -ForegroundColor Cyan

if ($Mode -eq 'dev') {
	Write-Host 'Waiting 15 seconds for local backend to initialize...' -ForegroundColor Yellow
	Start-Sleep -Seconds 15

	$env:EXPO_PUBLIC_APP_MODE = 'dev'
	Remove-Item Env:EXPO_PUBLIC_API_URL -ErrorAction SilentlyContinue

	Write-Host 'Configured for DEV mode (local Docker backend)' -ForegroundColor Green
} else {
	$env:EXPO_PUBLIC_APP_MODE = 'prod'
	$env:EXPO_PUBLIC_API_URL = 'http://54.194.7.2:3000'

	Write-Host 'Configured for PROD mode (AWS backend)' -ForegroundColor Green
}

Write-Host ''
Write-Host 'Starting Expo development server...' -ForegroundColor Yellow
Write-Host ''

Set-Location (Join-Path (Split-Path $PSScriptRoot -Parent) 'mobile')
npx expo start
