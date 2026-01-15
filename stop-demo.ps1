# ============================================================================
# Multi-Sport Athlete Injury Surveillance System
# Demo Shutdown Script
# ============================================================================
# This script gracefully stops all running services
# ============================================================================

Write-Host "Stopping Multi-Sport Injury Surveillance System..." -ForegroundColor Yellow
Write-Host ""

# Get the script directory (project root)
$ProjectRoot = $PSScriptRoot

# Change to project root
Set-Location $ProjectRoot

Write-Host "Working directory: $ProjectRoot" -ForegroundColor Cyan
Write-Host ""

# ============================================================================
# Stop Docker Containers
# ============================================================================
Write-Host "Stopping Docker containers..." -ForegroundColor Yellow

try {
    docker-compose down
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  [OK] Docker containers stopped successfully" -ForegroundColor Green
    } else {
        Write-Host "  [WARNING] Docker containers may already be stopped" -ForegroundColor Yellow
    }
} catch {
    Write-Host "  [ERROR] Error stopping Docker containers" -ForegroundColor Red
    Write-Host "  $_" -ForegroundColor Red
}

Write-Host ""

# ============================================================================
# Optional: Kill Node Processes
# ============================================================================
Write-Host "Checking for running Node.js processes..." -ForegroundColor Yellow

$nodeProcesses = Get-Process -Name "node" -ErrorAction SilentlyContinue

if ($nodeProcesses) {
    Write-Host "  Found $($nodeProcesses.Count) Node.js process(es)" -ForegroundColor Gray
    
    $response = Read-Host "  Do you want to stop all Node.js processes? (y/n)"
    
    if ($response -eq 'y' -or $response -eq 'Y') {
        try {
            Stop-Process -Name "node" -Force -ErrorAction Stop
            Write-Host "  [OK] Node.js processes stopped" -ForegroundColor Green
        } catch {
            Write-Host "  [WARNING] Some processes could not be stopped" -ForegroundColor Yellow
        }
    } else {
        Write-Host "  Skipping Node.js process termination" -ForegroundColor Gray
    }
} else {
    Write-Host "  [OK] No Node.js processes found" -ForegroundColor Green
}

Write-Host ""

# ============================================================================
# Check Port Usage
# ============================================================================
Write-Host "Checking ports..." -ForegroundColor Yellow

$ports = @(3000, 3001, 5432, 7474, 7687, 5050)
$portsInUse = @()

foreach ($port in $ports) {
    $connection = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue
    if ($connection) {
        $portsInUse += $port
    }
}

if ($portsInUse.Count -gt 0) {
    Write-Host "  [WARNING] The following ports are still in use: $($portsInUse -join ', ')" -ForegroundColor Yellow
    Write-Host "            You may need to manually close applications or restart your computer" -ForegroundColor Gray
} else {
    Write-Host "  [OK] All demo ports are free" -ForegroundColor Green
}

Write-Host ""

# ============================================================================
# Summary
# ============================================================================
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host "  SHUTDOWN COMPLETE" -ForegroundColor Green
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "To completely reset the databases (delete all data):" -ForegroundColor Yellow
Write-Host "   docker-compose down -v" -ForegroundColor White
Write-Host ""
Write-Host "To start the demo again:" -ForegroundColor Yellow
Write-Host "   .\start-demo.ps1" -ForegroundColor White
Write-Host ""

Read-Host "Press Enter to exit"
