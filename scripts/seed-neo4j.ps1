# ============================================================================
# Seed Neo4j Database with Schema and Sample Data
# ============================================================================
# DEPRECATED ENTRYPOINT:
# Use .\scripts\seed-dev-data.ps1 instead.
# This wrapper remains for compatibility and seeds Neo4j only.

Write-Host "=====================================================================" -ForegroundColor Cyan
Write-Host "  Neo4j Database Seeding (Deprecated Wrapper)" -ForegroundColor Cyan
Write-Host "=====================================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "[DEPRECATION] Use .\scripts\seed-dev-data.ps1 for dev/test seeding." -ForegroundColor Yellow
Write-Host ""

& (Join-Path $PSScriptRoot 'seed-dev-data.ps1') -SkipPostgres
