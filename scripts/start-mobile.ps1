[CmdletBinding()]
param(
	[ValidateSet('dev', 'prod')]
	[string]$Mode = 'dev',
	[ValidateSet('auto', 'devClient', 'expoGo')]
	[string]$Runtime = 'auto'
)

# Mobile App Terminal
Write-Host 'MOBILE APP TERMINAL' -ForegroundColor Magenta
Write-Host '===================' -ForegroundColor Magenta
Write-Host ''
Write-Host "Launch mode: $Mode" -ForegroundColor Cyan

$resolvedRuntime = $Runtime
if ($resolvedRuntime -eq 'auto') {
	$resolvedRuntime = if ($Mode -eq 'dev') { 'devClient' } else { 'expoGo' }
}
Write-Host "Runtime: $resolvedRuntime" -ForegroundColor Cyan

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

Write-Host 'Expo public env:' -ForegroundColor DarkGray
function Get-EnvOrUnset([string]$value) {
	if ([string]::IsNullOrWhiteSpace($value)) { return '<unset>' }
	return $value
}

Write-Host ("  EXPO_PUBLIC_APP_MODE = {0}" -f (Get-EnvOrUnset $env:EXPO_PUBLIC_APP_MODE)) -ForegroundColor DarkGray
Write-Host ("  EXPO_PUBLIC_API_URL  = {0}" -f (Get-EnvOrUnset $env:EXPO_PUBLIC_API_URL)) -ForegroundColor DarkGray
Write-Host ''

Set-Location (Join-Path (Split-Path $PSScriptRoot -Parent) 'mobile')
if ($resolvedRuntime -eq 'devClient') {
	npx expo start --dev-client --clear
} else {
	npx expo start
}
