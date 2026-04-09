# ============================================================================
# Seed Dev/Test Data
# ============================================================================
# Loads sample/fixture data after schema migrations have been applied.
# This is a dev/test-only entrypoint and must not be used for production.
#
# Usage:
#   .\scripts\seed-dev-data.ps1
#   .\scripts\seed-dev-data.ps1 -Target test
# ============================================================================

[CmdletBinding()]
param(
    [ValidateSet('dev', 'test')]
    [string]$Target = 'dev',
    [switch]$SkipPostgres,
    [switch]$SkipNeo4j
)

$ErrorActionPreference = 'Stop'

Write-Host "=====================================================================" -ForegroundColor Cyan
Write-Host "  Dev/Test Data Seeding" -ForegroundColor Cyan
Write-Host "=====================================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "[INFO] This loads sample data only. Production seeding is disallowed." -ForegroundColor Yellow
Write-Host ""

$ProjectRoot = Split-Path -Parent $PSScriptRoot

if ($SkipPostgres -and $SkipNeo4j) {
    Write-Host "[ERROR] Nothing to seed because both -SkipPostgres and -SkipNeo4j were set." -ForegroundColor Red
    exit 1
}

switch ($Target) {
    'dev' {
        $postgresContainer = 'injury-surveillance-postgres'
        $postgresDb = 'identity_service'
        $postgresUser = 'identity_admin'
        $postgresPassword = 'identity-service-dev-password'

        $neo4jContainer = 'injury-surveillance-neo4j'
        $neo4jPassword = 'injury-surveillance-dev-password'
    }
    'test' {
        $postgresContainer = 'injury-surveillance-postgres'
        $postgresDb = 'identity_service_test'
        $postgresUser = 'identity_admin'
        $postgresPassword = 'identity-service-dev-password'

        $neo4jContainer = 'injury-surveillance-neo4j-test'
        $neo4jPassword = 'injury-surveillance-test-password'
    }
}

$postgresSeedFile = Join-Path $ProjectRoot 'database\postgres\003-sample-identities.sql'
$neo4jSeedFile = Join-Path $ProjectRoot 'database\neo4j\010-sample-data.cypher'

function Assert-ContainerRunning {
    param(
        [string]$ContainerName
    )

    # Use docker inspect for exact-name lookup; docker ps name filters can match substrings
    # (e.g., injury-surveillance-neo4j matches injury-surveillance-neo4j-test).
    $isRunning = $null
    $prev = $ErrorActionPreference
    $ErrorActionPreference = 'Continue'
    try {
        $isRunning = (& docker inspect -f "{{.State.Running}}" $ContainerName 2>$null | Out-String).Trim()
    } finally {
        $ErrorActionPreference = $prev
    }

    if ($isRunning -ne 'true') {
        Write-Host "[ERROR] Container $ContainerName is not running." -ForegroundColor Red
        exit 1
    }
}

function Wait-ForPostgres {
    param(
        [string]$ContainerName,
        [string]$DatabaseName,
        [string]$UserName,
        [SecureString]$Password
    )

    $plainPassword = [System.Net.NetworkCredential]::new('', $Password).Password

    for ($attempt = 1; $attempt -le 30; $attempt++) {
        docker exec -e PGPASSWORD=$plainPassword $ContainerName psql -U $UserName -d $DatabaseName -tAc "SELECT 1" > $null 2>&1
        if ($LASTEXITCODE -eq 0) {
            Write-Host "  [OK] $ContainerName is ready" -ForegroundColor Green
            return
        }

        Write-Host "  Waiting for $ContainerName... ($attempt/30)" -ForegroundColor DarkGray
        Start-Sleep -Seconds 2
    }

    Write-Host "[ERROR] $ContainerName did not become ready in time." -ForegroundColor Red
    exit 1
}

function Wait-ForNeo4j {
    param(
        [string]$ContainerName,
        [SecureString]$Password
    )

    $plainPassword = [System.Net.NetworkCredential]::new('', $Password).Password

    for ($attempt = 1; $attempt -le 30; $attempt++) {
        docker exec $ContainerName cypher-shell -u neo4j -p $plainPassword -d neo4j "RETURN 1" > $null 2>&1
        if ($LASTEXITCODE -eq 0) {
            Write-Host "  [OK] $ContainerName is ready" -ForegroundColor Green
            return
        }

        Write-Host "  Waiting for $ContainerName... ($attempt/30)" -ForegroundColor DarkGray
        Start-Sleep -Seconds 2
    }

    Write-Host "[ERROR] $ContainerName did not become ready in time." -ForegroundColor Red
    exit 1
}

if (-not $SkipPostgres) {
    Assert-ContainerRunning -ContainerName $postgresContainer
    Wait-ForPostgres -ContainerName $postgresContainer -DatabaseName $postgresDb -UserName $postgresUser -Password (ConvertTo-SecureString $postgresPassword -AsPlainText -Force)

    if (-not (Test-Path $postgresSeedFile)) {
        Write-Host "[ERROR] PostgreSQL seed file not found: $postgresSeedFile" -ForegroundColor Red
        exit 1
    }

    Write-Host "Applying PostgreSQL seed data to $Target environment..." -ForegroundColor Yellow

    # Copy seed SQL into container and run it there to avoid PowerShell piping/encoding issues.
    $pgContainerSeedPath = '/tmp/seed.sql'
    docker cp $postgresSeedFile "${postgresContainer}:${pgContainerSeedPath}" 2>&1 | Out-Null
    if ($LASTEXITCODE -ne 0) {
        Write-Host "[ERROR] Failed to copy PostgreSQL seed file to container." -ForegroundColor Red
        exit 1
    }

    # -v ON_ERROR_STOP=1: fail fast
    # -1: wrap in a single transaction
    & docker exec -e PGPASSWORD=$postgresPassword $postgresContainer psql -v ON_ERROR_STOP=1 -1 -U $postgresUser -d $postgresDb -f $pgContainerSeedPath
    if ($LASTEXITCODE -ne 0) {
        Write-Host "[ERROR] PostgreSQL seed failed." -ForegroundColor Red
        exit $LASTEXITCODE
    }

    docker exec $postgresContainer rm -f $pgContainerSeedPath > $null 2>&1
}

if (-not $SkipNeo4j) {
    Assert-ContainerRunning -ContainerName $neo4jContainer
    Wait-ForNeo4j -ContainerName $neo4jContainer -Password (ConvertTo-SecureString $neo4jPassword -AsPlainText -Force)

    if (-not (Test-Path $neo4jSeedFile)) {
        Write-Host "[ERROR] Neo4j seed file not found: $neo4jSeedFile" -ForegroundColor Red
        exit 1
    }

    Write-Host "Applying Neo4j sample data to $Target environment..." -ForegroundColor Yellow
    
    # Copy seed file into container, then execute it
    $containerSeedPath = '/tmp/seed.cypher'
    docker cp $neo4jSeedFile "${neo4jContainer}:${containerSeedPath}" 2>&1 | Out-Null
    if ($LASTEXITCODE -ne 0) {
        Write-Host "[ERROR] Failed to copy Neo4j seed file to container." -ForegroundColor Red
        exit 1
    }
    
    docker exec $neo4jContainer cypher-shell -u neo4j -p $neo4jPassword -d neo4j -f $containerSeedPath
    if ($LASTEXITCODE -ne 0) {
        Write-Host "[ERROR] Neo4j seed failed." -ForegroundColor Red
        exit $LASTEXITCODE
    }
}

Write-Host ""
Write-Host "=====================================================================" -ForegroundColor Green
Write-Host "  Dev/Test data seeding completed successfully" -ForegroundColor Green
Write-Host "=====================================================================" -ForegroundColor Green
Write-Host ""
