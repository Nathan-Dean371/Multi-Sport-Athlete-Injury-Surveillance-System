# ============================================================================
# Sync Test Database Schema (Migration Wrapper)
# ============================================================================
# DEPRECATED ENTRYPOINT:
# This script remains as a compatibility wrapper and now delegates all schema
# operations to Flyway and neo4j-migrations. It no longer applies raw SQL or
# raw Cypher schema files directly.
#
# Usage: .\scripts\sync-test-schema.ps1
# ============================================================================

[CmdletBinding()]
param()

$ErrorActionPreference = 'Stop'

Write-Host "=====================================================================" -ForegroundColor Cyan
Write-Host "  Test Database Schema Synchronization (Migration Wrapper)" -ForegroundColor Cyan
Write-Host "=====================================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "[DEPRECATION] This compatibility script will be removed soon." -ForegroundColor Yellow
Write-Host "             Use migration tooling directly in CI/local automation." -ForegroundColor Yellow
Write-Host ""

$ProjectRoot = Split-Path -Parent $PSScriptRoot
$PostgresMigrations = Join-Path $ProjectRoot "database\postgres\migrations"
$Neo4jMigrations = Join-Path $ProjectRoot "database\neo4j\migrations"

if (-not (Test-Path $PostgresMigrations)) {
    Write-Host "[ERROR] Missing PostgreSQL migration directory: $PostgresMigrations" -ForegroundColor Red
    exit 1
}

if (-not (Test-Path $Neo4jMigrations)) {
    Write-Host "[ERROR] Missing Neo4j migration directory: $Neo4jMigrations" -ForegroundColor Red
    exit 1
}

$flyway = Get-Command flyway -ErrorAction SilentlyContinue

if (-not $flyway) {
    Write-Host "[ERROR] Flyway CLI not found on PATH." -ForegroundColor Red
    Write-Host "        Install Flyway before running this wrapper." -ForegroundColor Red
    exit 1
}

$pgHost = if ($env:TEST_POSTGRES_HOST) { $env:TEST_POSTGRES_HOST } else { "127.0.0.1" }
$pgPort = if ($env:TEST_POSTGRES_PORT) { $env:TEST_POSTGRES_PORT } else { "5433" }
$pgDb = if ($env:TEST_POSTGRES_DB) { $env:TEST_POSTGRES_DB } else { "identity_service_test" }
$pgUser = if ($env:TEST_POSTGRES_USER) { $env:TEST_POSTGRES_USER } else { "identity_admin" }
$pgPassword = if ($env:TEST_POSTGRES_PASSWORD) { $env:TEST_POSTGRES_PASSWORD } else { "identity-service-dev-password" }

$neo4jUser = if ($env:TEST_NEO4J_USER) { $env:TEST_NEO4J_USER } else { "neo4j" }
$neo4jPassword = if ($env:TEST_NEO4J_PASSWORD) { $env:TEST_NEO4J_PASSWORD } else { "injury-surveillance-test-password" }

Write-Host "[1/2] PostgreSQL migration (Flyway validate + migrate)..." -ForegroundColor Yellow

Write-Host "      Ensuring test database exists..." -ForegroundColor DarkGray
$dbExists = docker exec -i injury-surveillance-postgres psql -U $pgUser -d postgres -tAc "SELECT 1 FROM pg_database WHERE datname = '$pgDb';" 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERROR] Unable to check PostgreSQL test database existence." -ForegroundColor Red
    Write-Host "        $dbExists" -ForegroundColor Red
    exit 1
}

if (($dbExists | Out-String).Trim() -ne "1") {
    $createDbResult = docker exec -i injury-surveillance-postgres psql -U $pgUser -d postgres -v ON_ERROR_STOP=1 -c "CREATE DATABASE $pgDb;" 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Host "[ERROR] Unable to create PostgreSQL test database '$pgDb'." -ForegroundColor Red
        Write-Host "        $createDbResult" -ForegroundColor Red
        exit 1
    }
}

$env:FLYWAY_URL = "jdbc:postgresql://$pgHost`:$pgPort/$pgDb"
$env:FLYWAY_USER = $pgUser
$env:FLYWAY_PASSWORD = $pgPassword
$env:FLYWAY_LOCATIONS = "filesystem:$PostgresMigrations"
$env:FLYWAY_IGNORE_MIGRATION_PATTERNS = "*:pending"

& $flyway.Source validate
if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERROR] Flyway validate failed." -ForegroundColor Red
    exit $LASTEXITCODE
}

& $flyway.Source migrate
if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERROR] Flyway migrate failed." -ForegroundColor Red
    exit $LASTEXITCODE
}

Write-Host "[2/2] Neo4j migration (neo4j-migrations apply)..." -ForegroundColor Yellow
$applyScript = Join-Path $PSScriptRoot 'apply-neo4j-migrations.ps1'
& $applyScript `
    -Address 'neo4j://injury-surveillance-neo4j-test:7687' `
    -Username $neo4jUser `
    -PasswordSecureString (ConvertTo-SecureString $neo4jPassword -AsPlainText -Force) `
    -MigrationsPath $Neo4jMigrations

if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERROR] neo4j-migrations apply failed." -ForegroundColor Red
    exit $LASTEXITCODE
}

Write-Host "" 
Write-Host "=====================================================================" -ForegroundColor Green
Write-Host "  Schema synchronization completed via migration tooling" -ForegroundColor Green
Write-Host "=====================================================================" -ForegroundColor Green
Write-Host ""
