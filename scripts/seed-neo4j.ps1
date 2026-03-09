# ============================================================================
# Seed Neo4j Database with Schema and Sample Data
# ============================================================================
# This script loads the schema and sample data into the Neo4j database.
# Run this after starting Docker containers: docker-compose up

Write-Host "=====================================================================" -ForegroundColor Cyan
Write-Host "  Neo4j Database Seeding" -ForegroundColor Cyan
Write-Host "=====================================================================" -ForegroundColor Cyan
Write-Host ""

$ProjectRoot = Split-Path -Parent $PSScriptRoot

# ============================================================================
# Verify Neo4j Container
# ============================================================================
Write-Host "Checking Neo4j container..." -ForegroundColor Yellow

$containerStatus = docker ps --filter "name=injury-surveillance-neo4j" --filter "status=running" --format "{{.Names}}" 2>&1
if ($containerStatus -match "injury-surveillance-neo4j") {
    Write-Host "  [OK] Neo4j container is running" -ForegroundColor Green
} else {
    Write-Host "  [ERROR] Neo4j container is not running!" -ForegroundColor Red
    Write-Host "          Start it with: docker-compose up" -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host ""

# ============================================================================
# Step 1: Run Schema Setup
# ============================================================================
Write-Host "Step 1: Creating database schema and constraints..." -ForegroundColor Yellow
Write-Host ""

$schemaFile = "$ProjectRoot\database\neo4j\schema-setup.cypher"
if (-not (Test-Path $schemaFile)) {
    Write-Host "  [ERROR] schema-setup.cypher not found at: $schemaFile" -ForegroundColor Red
    exit 1
}

try {
    Get-Content $schemaFile | docker exec -i injury-surveillance-neo4j cypher-shell -u neo4j -p "injury-surveillance-dev-password" 2>&1 | Out-Null
    Write-Host "  [OK] Schema created successfully" -ForegroundColor Green
} catch {
    Write-Host "  [ERROR] Failed to create schema: $_" -ForegroundColor Red
    exit 1
}

Write-Host ""

# ============================================================================
# Step 2: Run Sample Data
# ============================================================================
Write-Host "Step 2: Loading sample data (injuries, players, coaches, etc.)..." -ForegroundColor Yellow
Write-Host ""

$sampleFile = "$ProjectRoot\database\neo4j\sample-data.cypher"
if (-not (Test-Path $sampleFile)) {
    Write-Host "  [ERROR] sample-data.cypher not found at: $sampleFile" -ForegroundColor Red
    exit 1
}

try {
    Get-Content $sampleFile | docker exec -i injury-surveillance-neo4j cypher-shell -u neo4j -p "injury-surveillance-dev-password" 2>&1 | Out-Null
    Write-Host "  [OK] Sample data loaded successfully" -ForegroundColor Green
} catch {
    Write-Host "  [ERROR] Failed to load sample data: $_" -ForegroundColor Red
    exit 1
}

Write-Host ""

# ============================================================================
# Step 3: Verify Data
# ============================================================================
Write-Host "Step 3: Verifying data..." -ForegroundColor Yellow
Write-Host ""

$verifyQuery = @"
MATCH (n) RETURN labels(n)[0] AS Type, count(*) AS Count ORDER BY Count DESC;
"@

try {
    $result = $verifyQuery | docker exec -i injury-surveillance-neo4j cypher-shell -u neo4j -p "injury-surveillance-dev-password" 2>&1 | Select-String "Type|Count|rows"
    Write-Host "  [OK] Database verification:" -ForegroundColor Green
    Write-Host ""
    $result | ForEach-Object { Write-Host "  $_" }
    Write-Host ""
} catch {
    Write-Host "  [WARNING] Could not verify data: $_" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "=====================================================================" -ForegroundColor Green
Write-Host "  ✅ Neo4j Database Seeding Complete!" -ForegroundColor Green
Write-Host "=====================================================================" -ForegroundColor Green
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Cyan
Write-Host "  1. Start the backend (if not already running):" -ForegroundColor Gray
Write-Host "     cd backend && npm run start:dev" -ForegroundColor White
Write-Host ""
Write-Host "  2. Test the API:" -ForegroundColor Gray
Write-Host "     http://localhost:3000/api" -ForegroundColor White
Write-Host ""
Write-Host "  3. View Neo4j data:" -ForegroundColor Gray
Write-Host "     http://localhost:7474" -ForegroundColor White
Write-Host ""
Write-Host "Test Credentials:" -ForegroundColor Cyan
Write-Host "  Email:    liam.murphy@email.com (Coach)" -ForegroundColor White
Write-Host "  Password: password123" -ForegroundColor White
Write-Host ""
Write-Host "=====================================================================" -ForegroundColor Green
