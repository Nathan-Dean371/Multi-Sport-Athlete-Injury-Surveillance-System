# ============================================================================
# Multi-Sport Athlete Injury Surveillance System
# Demo Startup Script
# ============================================================================
# This script opens three PowerShell terminals to run:
#   1. Docker containers (databases)
#   2. Backend API server
#   3. Mobile app (React Native/Expo)
# ============================================================================

Write-Host "Starting Multi-Sport Injury Surveillance System Demo..." -ForegroundColor Cyan
Write-Host ""

# Get the script directory (project root)
$ProjectRoot = $PSScriptRoot

# Verify we're in the right directory
if (-not (Test-Path "$ProjectRoot\docker-compose.yml")) {
    Write-Host "[ERROR] docker-compose.yml not found!" -ForegroundColor Red
    Write-Host "        Please run this script from the project root directory." -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit 1
}

# Check if Docker is running
Write-Host "Checking Docker..." -ForegroundColor Yellow
try {
    $dockerCheck = docker ps 2>&1
    if ($LASTEXITCODE -ne 0) {
        throw "Docker not running"
    }
    Write-Host "  [OK] Docker is running" -ForegroundColor Green
} catch {
    Write-Host "  [ERROR] Docker is not running!" -ForegroundColor Red
    Write-Host "          Please start Docker Desktop and try again." -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host ""
Write-Host "Project Root: $ProjectRoot" -ForegroundColor Cyan
Write-Host ""
# start-demo.ps1
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host "  Multi-Sport Injury Surveillance System" -ForegroundColor Cyan
Write-Host "  Demo Startup" -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Opening terminals..." -ForegroundColor Yellow

# Terminal 1 - Docker Databases (new window, runs attached so logs are visible)
Start-Process powershell -ArgumentList "-NoExit", "-File", ".\scripts\start-docker.ps1"

Write-Host "  [1] Database terminal opened" -ForegroundColor Green

# Give Docker a moment to begin starting before opening the next windows
Start-Sleep -Seconds 2

# Terminal 2 - Backend API
Start-Process powershell -ArgumentList "-NoExit", "-File", ".\scripts\start-backend.ps1"

Write-Host "  [2] Backend terminal opened" -ForegroundColor Green

# Terminal 3 - Mobile App
Start-Process powershell -ArgumentList "-NoExit", "-File", ".\scripts\start-mobile.ps1"

Write-Host "  [3] Mobile terminal opened" -ForegroundColor Green

Write-Host ""
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host "  All terminals launched!" -ForegroundColor Green
Write-Host ""
Write-Host "  Wait ~60 seconds for full startup, then:" -ForegroundColor Yellow
Write-Host "  - Swagger:    http://localhost:3000/api" -ForegroundColor White
Write-Host "  - pgAdmin:    http://localhost:5050" -ForegroundColor White
Write-Host "  - Neo4j:      http://localhost:7474" -ForegroundColor White
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Test Login Credentials:" -ForegroundColor Cyan
Write-Host "   Email: liam.murphy@email.com" -ForegroundColor White
Write-Host "   Password: password123" -ForegroundColor White
Write-Host ""
Write-Host "See DEMO-CHEAT-SHEET.md for:" -ForegroundColor Yellow
Write-Host "   - Neo4j demo queries" -ForegroundColor Gray
Write-Host "   - API endpoints" -ForegroundColor Gray
Write-Host "   - Database credentials" -ForegroundColor Gray
Write-Host "   - Troubleshooting tips" -ForegroundColor Gray
Write-Host ""
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "System Startup Timeline:" -ForegroundColor Cyan
Write-Host "   - Databases: ~30 seconds" -ForegroundColor Gray
Write-Host "   - Backend: ~45 seconds (after databases)" -ForegroundColor Gray
Write-Host "   - Mobile App: ~30 seconds (after backend)" -ForegroundColor Gray
Write-Host "   - Total: ~2 minutes for full system" -ForegroundColor Gray
Write-Host ""
Write-Host "Tip: Watch each terminal for 'ready' messages" -ForegroundColor Yellow
Write-Host "Tip: Use Expo Go app on your phone or run iOS/Android simulator" -ForegroundColor Yellow
Write-Host ""
Write-Host "To stop everything:" -ForegroundColor Red
Write-Host "   1. Press Ctrl+C in each terminal" -ForegroundColor Gray
Write-Host "   2. Or close all terminal windows" -ForegroundColor Gray
Write-Host "   3. Run: .\stop-demo.ps1" -ForegroundColor Gray
Write-Host ""

# Keep this window open
Write-Host "Press any key to close this launcher window..." -ForegroundColor DarkGray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
