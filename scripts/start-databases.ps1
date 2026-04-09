# Databases + Migration Services Terminal
Write-Host 'DATABASES + MIGRATIONS TERMINAL' -ForegroundColor Cyan
Write-Host '===============================' -ForegroundColor Cyan
Write-Host ''
Write-Host 'Starting PostgreSQL, Neo4j, Neo4j test, and migration services...' -ForegroundColor Yellow
Write-Host ''
Write-Host 'This excludes backend/mobile/web containers.' -ForegroundColor DarkGray
Write-Host ''

Set-Location (Split-Path $PSScriptRoot -Parent)

$env:COMPOSE_PROGRESS = 'plain'
$env:COMPOSE_ANSI = 'never'

docker compose up -d postgres neo4j neo4j-test flyway

if ($LASTEXITCODE -ne 0) {
	Write-Host '[ERROR] Failed to start database services.' -ForegroundColor Red
	exit $LASTEXITCODE
}

function Wait-ForNeo4j {
	param(
		[string]$Container,
		[SecureString]$Password
	)

	$plainPassword = [System.Net.NetworkCredential]::new('', $Password).Password

	$maxAttempts = 30
	for ($attempt = 1; $attempt -le $maxAttempts; $attempt++) {
		docker exec $Container cypher-shell -u neo4j -p $plainPassword -d neo4j "RETURN 1" >$null 2>&1
		if ($LASTEXITCODE -eq 0) {
			Write-Host "  [OK] $Container is ready for Bolt queries" -ForegroundColor Green
			return
		}

		Write-Host "  Waiting for $Container Bolt readiness... ($attempt/$maxAttempts)" -ForegroundColor DarkGray
		Start-Sleep -Seconds 2
	}

	Write-Host "[ERROR] $Container did not become ready in time." -ForegroundColor Red
	exit 1
}

function Wait-ForFlyway {
	$maxAttempts = 60
	for ($attempt = 1; $attempt -le $maxAttempts; $attempt++) {
		$state = docker inspect -f "{{.State.Status}} {{.State.ExitCode}}" injury-surveillance-flyway 2>$null
		if ($LASTEXITCODE -ne 0) {
			Write-Host "  Waiting for flyway container status... ($attempt/$maxAttempts)" -ForegroundColor DarkGray
			Start-Sleep -Seconds 2
			continue
		}

		$parts = ($state | Out-String).Trim().Split(' ')
		$status = $parts[0]
		$exitCode = if ($parts.Length -gt 1) { [int]$parts[1] } else { -1 }

		if ($status -eq 'exited') {
			if ($exitCode -eq 0) {
				Write-Host '  [OK] Flyway migrations completed successfully' -ForegroundColor Green
				return
			}

			Write-Host "[ERROR] Flyway exited with code $exitCode." -ForegroundColor Red
			docker logs injury-surveillance-flyway
			exit 1
		}

		Write-Host "  Waiting for flyway to finish... ($attempt/$maxAttempts)" -ForegroundColor DarkGray
		Start-Sleep -Seconds 2
	}

	Write-Host '[ERROR] Timed out waiting for flyway completion.' -ForegroundColor Red
	exit 1
}

Write-Host ''
Write-Host 'Waiting for service readiness...' -ForegroundColor Yellow
Wait-ForFlyway
Wait-ForNeo4j -Container 'injury-surveillance-neo4j' -Password (ConvertTo-SecureString 'injury-surveillance-dev-password' -AsPlainText -Force)
Wait-ForNeo4j -Container 'injury-surveillance-neo4j-test' -Password (ConvertTo-SecureString 'injury-surveillance-test-password' -AsPlainText -Force)

Write-Host ''
Write-Host 'Applying Neo4j versioned migrations to dev and test containers...' -ForegroundColor Yellow

$applyScript = Join-Path $PSScriptRoot 'apply-neo4j-migrations.ps1'

& $applyScript `
	-Address 'neo4j://injury-surveillance-neo4j:7687' `
	-Username 'neo4j' `
	-PasswordSecureString (ConvertTo-SecureString 'injury-surveillance-dev-password' -AsPlainText -Force)

if ($LASTEXITCODE -ne 0) {
	Write-Host "[ERROR] Failed applying Neo4j migrations to dev Neo4j." -ForegroundColor Red
	exit $LASTEXITCODE
}

& $applyScript `
	-Address 'neo4j://injury-surveillance-neo4j-test:7687' `
	-Username 'neo4j' `
	-PasswordSecureString (ConvertTo-SecureString 'injury-surveillance-test-password' -AsPlainText -Force)

if ($LASTEXITCODE -ne 0) {
	Write-Host "[ERROR] Failed applying Neo4j migrations to test Neo4j." -ForegroundColor Red
	exit $LASTEXITCODE
}

Write-Host ''
Write-Host 'Database services and migrations are ready.' -ForegroundColor Green
