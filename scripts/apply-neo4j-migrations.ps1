# ============================================================================
# Apply Neo4j Migrations (dockerized runner)
# ============================================================================
# This script runs neo4j-migrations via a pinned Docker runner image.
# It is the canonical automation path for applying Neo4j schema migrations.
#
# Usage examples:
#   .\scripts\apply-neo4j-migrations.ps1 -Address neo4j://injury-surveillance-neo4j:7687 -Username neo4j -PasswordSecureString (ConvertTo-SecureString 'injury-surveillance-dev-password' -AsPlainText -Force)
#   .\scripts\apply-neo4j-migrations.ps1 -Address neo4j://localhost:7687 -Username neo4j -PasswordSecureString (ConvertTo-SecureString 'test-password' -AsPlainText -Force) -DockerNetwork host
# ============================================================================

[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)]
    [string]$Address,

    [Parameter(Mandatory = $true)]
    [string]$Username,

    [Parameter(Mandatory = $true)]
    [System.Security.SecureString]$PasswordSecureString,

    [string]$MigrationsPath,

    # Either a Docker network name (e.g. injury-surveillance-network) or the literal string 'host'
    [string]$DockerNetwork = 'injury-surveillance-network',

    [string]$RunnerImage = 'injury-surveillance-neo4j-migrations-runner:3.3.1'
)

$ErrorActionPreference = 'Stop'

$ProjectRoot = Split-Path -Parent $PSScriptRoot

if (-not $MigrationsPath) {
    $MigrationsPath = Join-Path $ProjectRoot 'database\neo4j\migrations'
}

if (-not (Test-Path $MigrationsPath)) {
    Write-Host "[ERROR] Neo4j migrations path not found: $MigrationsPath" -ForegroundColor Red
    exit 1
}

# Ensure Docker exists
$docker = Get-Command docker -ErrorAction SilentlyContinue
if (-not $docker) {
    Write-Host "[ERROR] Docker CLI not found on PATH." -ForegroundColor Red
    exit 1
}

# Build runner image if missing
$inspectExitCode = 0

# In some PowerShell configurations (notably PS7 with $PSNativeCommandUseErrorActionPreference),
# native command stderr can be treated as a terminating error. A missing image is expected here,
# so we temporarily relax native error handling for the inspect call.
$prevErrorActionPreference = $ErrorActionPreference
$ErrorActionPreference = 'Continue'

$hadNativePref = $false
$prevNativePref = $null
try {
    if (Get-Variable -Name PSNativeCommandUseErrorActionPreference -Scope Global -ErrorAction SilentlyContinue) {
        $hadNativePref = $true
        $prevNativePref = $global:PSNativeCommandUseErrorActionPreference
        $global:PSNativeCommandUseErrorActionPreference = $false
    }

    & docker image inspect $RunnerImage *> $null
    $inspectExitCode = $LASTEXITCODE
} finally {
    if ($hadNativePref) {
        $global:PSNativeCommandUseErrorActionPreference = $prevNativePref
    }
    $ErrorActionPreference = $prevErrorActionPreference
}

if ($inspectExitCode -ne 0) {
    Write-Host "[INFO] Building Neo4j migrations runner image: $RunnerImage" -ForegroundColor Yellow
    $dockerfileDir = Join-Path $ProjectRoot 'tools\neo4j-migrations-runner'
    docker build -t $RunnerImage $dockerfileDir
    if ($LASTEXITCODE -ne 0) {
        Write-Host "[ERROR] Failed to build neo4j-migrations runner image." -ForegroundColor Red
        exit $LASTEXITCODE
    }
}

$mountPath = (Resolve-Path $MigrationsPath).Path

Write-Host "Applying Neo4j migrations from: $mountPath" -ForegroundColor Yellow

$plainPassword = [System.Net.NetworkCredential]::new('', $PasswordSecureString).Password

$networkArgs = @()
if ($DockerNetwork -eq 'host') {
    $networkArgs = @('--network', 'host')
} elseif ($DockerNetwork) {
    $networkArgs = @('--network', $DockerNetwork)
}

# Use a mounted directory and a file:/// URI inside the container
$location = 'file:///migrations'

$cmd = @(
    'run', '--rm'
) + $networkArgs + @(
    '-v', "${mountPath}:/migrations:ro",
    $RunnerImage,
    '--address', $Address,
    '--username', $Username,
    "--password=$plainPassword",
    '--location', $location,
    'apply'
)

& docker @cmd
if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERROR] neo4j-migrations apply failed." -ForegroundColor Red
    exit $LASTEXITCODE
}
