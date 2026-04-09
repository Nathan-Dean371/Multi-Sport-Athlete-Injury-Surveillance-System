# Web Terminal (Admin Dashboard)
Write-Host 'WEB TERMINAL' -ForegroundColor Cyan
Write-Host '===========' -ForegroundColor Cyan
Write-Host ''
Write-Host 'Starting Admin Dashboard (Next.js)...' -ForegroundColor Yellow
Write-Host ''

$projectRoot = Split-Path $PSScriptRoot -Parent
$webRoot = Join-Path $projectRoot 'web\admin-dashboard'

if (-not (Test-Path $webRoot)) {
    Write-Host "[ERROR] Web app folder not found: $webRoot" -ForegroundColor Red
    Write-Host "        Expected Next.js app at web\\admin-dashboard" -ForegroundColor Yellow
    exit 1
}

Set-Location $webRoot

if (-not (Test-Path '.\package.json')) {
    Write-Host "[ERROR] package.json not found in: $webRoot" -ForegroundColor Red
    exit 1
}

if (-not (Test-Path '.\node_modules')) {
    Write-Host 'Installing web dependencies (first run)...' -ForegroundColor Yellow
    if (Test-Path '.\package-lock.json') {
        npm ci
    } else {
        npm install
    }

    if ($LASTEXITCODE -ne 0) {
        Write-Host '[ERROR] Failed to install web dependencies' -ForegroundColor Red
        exit $LASTEXITCODE
    }
}

Write-Host ''
Write-Host 'Starting Next.js dev server on http://localhost:3001 ...' -ForegroundColor Green
npm run dev
