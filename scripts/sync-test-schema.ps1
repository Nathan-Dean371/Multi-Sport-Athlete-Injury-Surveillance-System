# ============================================================================
# Sync Test Database Schema
# ============================================================================
# This script synchronizes the database schema from development to test
# environments. It ensures test databases mirror the production structure.
#
# Usage: .\scripts\sync-test-schema.ps1 [-WithData]
# ============================================================================

param(
    [switch]$WithData = $false
)

Write-Host "=====================================================================" -ForegroundColor Cyan
Write-Host "  Test Database Schema Synchronization" -ForegroundColor Cyan
Write-Host "=====================================================================" -ForegroundColor Cyan
Write-Host ""

$ProjectRoot = Split-Path -Parent $PSScriptRoot
$DatabaseDir = Join-Path $ProjectRoot "database"

# ============================================================================
# Step 1: Sync PostgreSQL Test Database
# ============================================================================
Write-Host "[1/3] Synchronizing PostgreSQL Test Database..." -ForegroundColor Yellow
Write-Host ""

# Check if test database exists, if not create it
Write-Host "  Creating test database (if not exists)..." -ForegroundColor Gray
try {
    $output = docker exec -i injury-surveillance-postgres psql -U identity_admin -d postgres -f /dev/stdin @"
SELECT 1 FROM pg_database WHERE datname = 'identity_service_test';
"@ 2>&1

    if ($output -notmatch "1 row") {
        Write-Host "  Test database doesn't exist, creating..." -ForegroundColor Yellow
        Get-Content "$DatabaseDir\postgres\init-test-db.sql" | docker exec -i injury-surveillance-postgres psql -U identity_admin -d postgres
        Write-Host "  [OK] Test database created" -ForegroundColor Green
    } else {
        Write-Host "  [OK] Test database already exists" -ForegroundColor Green
    }
} catch {
    Write-Host "  [ERROR] Failed to check/create test database" -ForegroundColor Red
    Write-Host "  $_" -ForegroundColor Red
    exit 1
}

# Apply schema
Write-Host "  Applying schema to test database..." -ForegroundColor Gray
try {
    Get-Content "$DatabaseDir\postgres\identity-service-schema.sql" | docker exec -i injury-surveillance-postgres psql -U identity_admin -d identity_service_test
    Write-Host "  [OK] PostgreSQL schema synchronized" -ForegroundColor Green
} catch {
    Write-Host "  [ERROR] Failed to apply PostgreSQL schema" -ForegroundColor Red
    Write-Host "  $_" -ForegroundColor Red
    exit 1
}

Write-Host ""

# ============================================================================
# Step 2: Sync Neo4j Test Database
# ============================================================================
Write-Host "[2/3] Synchronizing Neo4j Test Database..." -ForegroundColor Yellow
Write-Host ""

# Wait for Neo4j test container to be ready
Write-Host "  Checking Neo4j test container..." -ForegroundColor Gray
$retries = 0
$maxRetries = 10
while ($retries -lt $maxRetries) {
    try {
        $status = docker exec injury-surveillance-neo4j-test cypher-shell -u neo4j -p injury-surveillance-test-password "RETURN 1" 2>&1
        if ($LASTEXITCODE -eq 0) {
            Write-Host "  [OK] Neo4j test container is ready" -ForegroundColor Green
            break
        }
    } catch {
        # Container not ready yet
    }
    
    $retries++
    if ($retries -eq $maxRetries) {
        Write-Host "  [ERROR] Neo4j test container not responding" -ForegroundColor Red
        exit 1
    }
    
    Write-Host "  Waiting for Neo4j test container... ($retries/$maxRetries)" -ForegroundColor Gray
    Start-Sleep -Seconds 2
}

# Clear existing data and apply schema
Write-Host "  Applying schema to test database..." -ForegroundColor Gray
Write-Host "  [WARNING] This will delete all existing test data!" -ForegroundColor Yellow

try {
    Get-Content "$DatabaseDir\neo4j\init-test-db.cypher" | docker exec -i injury-surveillance-neo4j-test cypher-shell -u neo4j -p injury-surveillance-test-password -d neo4j
    Write-Host "  [OK] Neo4j schema synchronized" -ForegroundColor Green
} catch {
    Write-Host "  [ERROR] Failed to apply Neo4j schema" -ForegroundColor Red
    Write-Host "  $_" -ForegroundColor Red
    exit 1
}

Write-Host ""

# ============================================================================
# Step 3: Verify Synchronization
# ============================================================================
Write-Host "[3/3] Verifying Synchronization..." -ForegroundColor Yellow
Write-Host ""

# Verify PostgreSQL
Write-Host "  PostgreSQL Tables:" -ForegroundColor Gray
docker exec -i injury-surveillance-postgres psql -U identity_admin -d identity_service_test -c "\dt" 2>&1 | Select-String -Pattern "public \|" | ForEach-Object {
    Write-Host "    $_" -ForegroundColor DarkGray
}

Write-Host ""

# Verify Neo4j
Write-Host "  Neo4j Constraints:" -ForegroundColor Gray
$constraints = docker exec -i injury-surveillance-neo4j-test cypher-shell -u neo4j -p injury-surveillance-test-password -d neo4j "CALL db.constraints() YIELD name RETURN count(name) AS total" 2>&1
Write-Host "    Total constraints: $($constraints | Select-String -Pattern '\d+' | ForEach-Object { $_.Matches.Value })" -ForegroundColor DarkGray

Write-Host ""
Write-Host "=====================================================================" -ForegroundColor Green
Write-Host "  Test Database Schema Synchronized Successfully" -ForegroundColor Green
Write-Host "=====================================================================" -ForegroundColor Green
Write-Host ""
Write-Host "Test databases are ready for E2E testing!" -ForegroundColor Cyan
Write-Host ""
Write-Host "Connection Details:" -ForegroundColor Yellow
Write-Host "  PostgreSQL: localhost:5432/identity_service_test" -ForegroundColor Gray
Write-Host "  Neo4j:      bolt://localhost:7688" -ForegroundColor Gray
Write-Host ""
