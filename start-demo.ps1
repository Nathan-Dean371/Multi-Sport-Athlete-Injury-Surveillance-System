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

# ============================================================================
# Terminal 1: Docker Databases
# ============================================================================
Write-Host "Opening Terminal 1: Databases (Docker)..." -ForegroundColor Cyan

Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$ProjectRoot'; Write-Host 'DATABASE TERMINAL' -ForegroundColor Cyan; Write-Host '==================' -ForegroundColor Cyan; Write-Host ''; Write-Host 'Starting Docker containers...' -ForegroundColor Yellow; Write-Host ''; docker-compose up"

Start-Sleep -Seconds 2

# ============================================================================
# Terminal 2: Backend API
# ============================================================================
Write-Host "Opening Terminal 2: Backend API..." -ForegroundColor Cyan

Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$ProjectRoot\backend'; Write-Host 'BACKEND API TERMINAL' -ForegroundColor Green; Write-Host '====================' -ForegroundColor Green; Write-Host ''; Write-Host 'Waiting 10 seconds for databases to initialize...' -ForegroundColor Yellow; Start-Sleep -Seconds 10; Write-Host ''; Write-Host 'Starting NestJS backend in development mode...' -ForegroundColor Yellow; Write-Host ''; npm run start:dev"

Start-Sleep -Seconds 2

# ============================================================================
# Terminal 3: Mobile App (Expo)
# ============================================================================
Write-Host "Opening Terminal 3: Mobile App (Expo)..." -ForegroundColor Cyan

Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$ProjectRoot\mobile'; Write-Host 'MOBILE APP TERMINAL' -ForegroundColor Magenta; Write-Host '===================' -ForegroundColor Magenta; Write-Host ''; Write-Host 'Waiting 15 seconds for backend to initialize...' -ForegroundColor Yellow; Start-Sleep -Seconds 15; Write-Host ''; Write-Host 'Starting Expo development server...' -ForegroundColor Yellow; Write-Host ''; npx expo start"

# ============================================================================
# Display Summary
# ============================================================================
Write-Host ""
Write-Host "[OK] All terminals launched!" -ForegroundColor Green
Write-Host ""
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host "  DEMO SYSTEM STATUS" -ForegroundColor Cyan
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "  Terminal 1: " -NoNewline; Write-Host "Databases (Docker)" -ForegroundColor Yellow
Write-Host "              - Neo4j Browser: http://localhost:7474" -ForegroundColor Gray
Write-Host "              - PostgreSQL: localhost:5432" -ForegroundColor Gray
Write-Host "              - pgAdmin: http://localhost:5050" -ForegroundColor Gray
Write-Host ""
Write-Host "  Terminal 2: " -NoNewline; Write-Host "Backend API" -ForegroundColor Green
Write-Host "              - API Server: http://localhost:3000" -ForegroundColor Gray
Write-Host "              - Swagger Docs: http://localhost:3000/api" -ForegroundColor Gray
Write-Host ""
Write-Host "  Terminal 3: " -NoNewline; Write-Host "Mobile App (Expo)" -ForegroundColor Magenta
Write-Host "              - Expo DevTools: http://localhost:19002" -ForegroundColor Gray
Write-Host "              - Scan QR code with Expo Go app to run on device" -ForegroundColor Gray
Write-Host "              - Press 'i' for iOS simulator" -ForegroundColor Gray
Write-Host "              - Press 'a' for Android emulator" -ForegroundColor Gray
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
