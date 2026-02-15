# ============================================================================
# Setup Test Databases
# ============================================================================
# This script initializes test databases for E2E testing.
# It should be run once after setting up the project, or whenever you need
# to reset the test environment.
#
# Usage: .\scripts\setup-test-databases.ps1
# ============================================================================

Write-Host "=====================================================================" -ForegroundColor Cyan
Write-Host "  Test Database Setup" -ForegroundColor Cyan
Write-Host "=====================================================================" -ForegroundColor Cyan
Write-Host ""

$ProjectRoot = Split-Path -Parent $PSScriptRoot

# ============================================================================
# Verify Docker Containers
# ============================================================================
Write-Host "Verifying Docker containers..." -ForegroundColor Yellow
Write-Host ""

$requiredContainers = @(
    "injury-surveillance-postgres",
    "injury-surveillance-neo4j-test"
)

$allRunning = $true
foreach ($container in $requiredContainers) {
    $status = docker ps --filter "name=$container" --format "{{.Names}}" 2>&1
    if ($status -match $container) {
        Write-Host "  [OK] $container is running" -ForegroundColor Green
    } else {
        Write-Host "  [ERROR] $container is not running" -ForegroundColor Red
        $allRunning = $false
    }
}

if (-not $allRunning) {
    Write-Host ""
    Write-Host "Please start Docker containers first:" -ForegroundColor Yellow
    Write-Host "  docker-compose up -d" -ForegroundColor Gray
    Write-Host ""
    exit 1
}

Write-Host ""

# ============================================================================
# Run Schema Synchronization
# ============================================================================
Write-Host "Running schema synchronization..." -ForegroundColor Yellow
Write-Host ""

$syncScript = Join-Path $PSScriptRoot "sync-test-schema.ps1"
& $syncScript

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "[ERROR] Schema synchronization failed!" -ForegroundColor Red
    exit 1
}

# ============================================================================
# Update Cleanup Helpers
# ============================================================================
Write-Host "Updating test cleanup helpers..." -ForegroundColor Yellow
Write-Host ""

$cleanupFile = Join-Path $ProjectRoot "backend\test\helpers\cleanup.ts"
if (Test-Path $cleanupFile) {
    Write-Host "  [OK] Cleanup helpers found at: backend/test/helpers/cleanup.ts" -ForegroundColor Green
    Write-Host "  Remember: Neo4j cleanup now uses the TEST container (port 7688)" -ForegroundColor Yellow
} else {
    Write-Host "  [WARNING] Cleanup helpers not found" -ForegroundColor Yellow
    Write-Host "  You may need to create them manually" -ForegroundColor Yellow
}

Write-Host ""

# ============================================================================
# Summary
# ============================================================================
Write-Host "=====================================================================" -ForegroundColor Green
Write-Host "  Test Databases Ready!" -ForegroundColor Green
Write-Host "=====================================================================" -ForegroundColor Green
Write-Host ""
Write-Host "Test Environment Configuration:" -ForegroundColor Cyan
Write-Host ""
Write-Host "  PostgreSQL Test DB:" -ForegroundColor Yellow
Write-Host "    Host:     localhost:5432" -ForegroundColor Gray
Write-Host "    Database: identity_service_test" -ForegroundColor Gray
Write-Host "    User:     identity_admin" -ForegroundColor Gray
Write-Host "    Password: identity-service-dev-password" -ForegroundColor Gray
Write-Host ""
Write-Host "  Neo4j Test DB:" -ForegroundColor Yellow
Write-Host "    URI:      bolt://localhost:7688" -ForegroundColor Gray
Write-Host "    Browser:  http://localhost:7475" -ForegroundColor Gray
Write-Host "    Username: neo4j" -ForegroundColor Gray
Write-Host "    Password: injury-surveillance-test-password" -ForegroundColor Gray
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Cyan
Write-Host "  1. Run E2E tests:  cd backend && npm run test:e2e" -ForegroundColor Gray
Write-Host "  2. View coverage:  cd backend && npm run test:cov" -ForegroundColor Gray
Write-Host "  3. Resync schema:  .\scripts\sync-test-schema.ps1" -ForegroundColor Gray
Write-Host ""
Write-Host "Note: Test databases can be safely wiped - dev data is protected!" -ForegroundColor Green
Write-Host ""
