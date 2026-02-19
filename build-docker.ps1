# ============================================================================
# Build and Test Docker Image Locally
# Multi-Sport Athlete Injury Surveillance System
# ============================================================================

param(
    [Parameter(Mandatory=$false)]
    [switch]$Build,
    
    [Parameter(Mandatory=$false)]
    [switch]$Test,
    
    [Parameter(Mandatory=$false)]
    [switch]$Clean,
    
    [Parameter(Mandatory=$false)]
    [switch]$Push,
    
    [Parameter(Mandatory=$false)]
    [string]$Tag = "latest"
)

$ErrorActionPreference = "Stop"

$IMAGE_NAME = "injury-surveillance-backend"
$FULL_IMAGE_NAME = "${IMAGE_NAME}:${Tag}"

# Colors for output
function Write-Success {
    param([string]$Message)
    Write-Host "✓ $Message" -ForegroundColor Green
}

function Write-Info {
    param([string]$Message)
    Write-Host "ℹ $Message" -ForegroundColor Cyan
}

function Write-Error {
    param([string]$Message)
    Write-Host "✗ $Message" -ForegroundColor Red
}

function Write-Section {
    param([string]$Message)
    Write-Host "`n============================================================" -ForegroundColor Yellow
    Write-Host " $Message" -ForegroundColor Yellow
    Write-Host "============================================================`n" -ForegroundColor Yellow
}

# Clean Docker resources
function Clean-Docker {
    Write-Section "Cleaning Docker Resources"
    
    # Stop and remove container if running
    $container = docker ps -aq --filter "name=${IMAGE_NAME}"
    if ($container) {
        Write-Info "Stopping and removing existing container..."
        docker stop $IMAGE_NAME 2>$null
        docker rm $IMAGE_NAME 2>$null
        Write-Success "Container removed"
    }
    
    # Remove image
    $image = docker images -q $IMAGE_NAME
    if ($image) {
        Write-Info "Removing existing image..."
        docker rmi -f $FULL_IMAGE_NAME 2>$null
        Write-Success "Image removed"
    }
    
    # Prune build cache
    Write-Info "Pruning build cache..."
    docker builder prune -f | Out-Null
    Write-Success "Build cache pruned"
}

# Build Docker image
function Build-DockerImage {
    Write-Section "Building Docker Image"
    
    Push-Location backend
    
    Write-Info "Building image: $FULL_IMAGE_NAME"
    Write-Info "Context: $(Get-Location)"
    
    $buildResult = docker build -t $FULL_IMAGE_NAME . 2>&1
    
    if ($LASTEXITCODE -eq 0) {
        Write-Success "Image built successfully!"
        
        # Show image details
        Write-Info "Image details:"
        docker images $IMAGE_NAME
        
        # Show image size
        $imageSize = docker images --format "{{.Size}}" $FULL_IMAGE_NAME
        Write-Info "Total size: $imageSize"
    } else {
        Write-Error "Build failed!"
        Write-Host $buildResult
        Pop-Location
        exit 1
    }
    
    Pop-Location
}

# Test Docker image
function Test-DockerImage {
    Write-Section "Testing Docker Image"
    
    # Start databases if not running
    Write-Info "Ensuring databases are running..."
    docker compose up -d neo4j postgres
    Start-Sleep -Seconds 5
    
    # Run container
    Write-Info "Starting backend container..."
    docker run -d `
        --name $IMAGE_NAME `
        --network injury-surveillance-network `
        -p 3000:3000 `
        -e NODE_ENV=development `
        -e PORT=3000 `
        -e JWT_SECRET=test-jwt-secret-for-local-testing-only `
        -e POSTGRES_HOST=postgres `
        -e POSTGRES_PORT=5432 `
        -e POSTGRES_DB=identity_service `
        -e POSTGRES_USER=identity_admin `
        -e POSTGRES_PASSWORD=identity-service-dev-password `
        -e NEO4J_URI=bolt://neo4j:7687 `
        -e NEO4J_USERNAME=neo4j `
        -e NEO4J_PASSWORD=injury-surveillance-dev-password `
        -e CORS_ORIGIN=http://localhost:3001,http://localhost:19006 `
        $FULL_IMAGE_NAME
    
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Failed to start container!"
        exit 1
    }
    
    # Wait for container to start
    Write-Info "Waiting for container to be healthy..."
    $attempts = 0
    $maxAttempts = 30
    
    while ($attempts -lt $maxAttempts) {
        $attempts++
        try {
            $response = Invoke-WebRequest -Uri "http://localhost:3000/status" -UseBasicParsing -TimeoutSec 2 -ErrorAction SilentlyContinue
            if ($response.StatusCode -eq 200) {
                Write-Success "Container is healthy!"
                
                # Show response
                Write-Info "Status endpoint response:"
                $response.Content | ConvertFrom-Json | ConvertTo-Json -Depth 3
                
                break
            }
        } catch {
            Start-Sleep -Seconds 2
        }
        
        if ($attempts -eq $maxAttempts) {
            Write-Error "Container failed to become healthy!"
            Write-Info "Container logs:"
            docker logs $IMAGE_NAME
            exit 1
        }
    }
    
    # Show container info
    Write-Info "Container details:"
    docker ps --filter "name=${IMAGE_NAME}"
    
    Write-Info "`nContainer logs:"
    docker logs --tail 20 $IMAGE_NAME
    
    Write-Success "Test completed successfully!"
    Write-Info "Backend is running at http://localhost:3000"
    Write-Info "Try: curl http://localhost:3000/status"
    Write-Info "`nTo view logs: docker logs -f ${IMAGE_NAME}"
    Write-Info "To stop: docker stop ${IMAGE_NAME}"
}

# Push to registry (placeholder for AWS ECR)
function Push-ToRegistry {
    Write-Section "Pushing to Registry"
    
    Write-Info "This would push to AWS ECR in production."
    Write-Info "Commands needed:"
    Write-Host "  1. aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <account>.dkr.ecr.us-east-1.amazonaws.com"
    Write-Host "  2. docker tag ${FULL_IMAGE_NAME} <account>.dkr.ecr.us-east-1.amazonaws.com/${IMAGE_NAME}:${Tag}"
    Write-Host "  3. docker push <account>.dkr.ecr.us-east-1.amazonaws.com/${IMAGE_NAME}:${Tag}"
    
    Write-Info "`nFor automated pushing, use the GitHub Actions CI/CD pipeline."
}

# Main execution
try {
    Write-Host @"

    ╔═══════════════════════════════════════════════════════════════╗
    ║  Multi-Sport Athlete Injury Surveillance System              ║
    ║  Docker Build & Test Script                                  ║
    ╚═══════════════════════════════════════════════════════════════╝

"@ -ForegroundColor Cyan

    if ($Clean) {
        Clean-Docker
    }
    
    if ($Build) {
        Build-DockerImage
    }
    
    if ($Test) {
        Test-DockerImage
    }
    
    if ($Push) {
        Push-ToRegistry
    }
    
    # If no flags provided, show help
    if (-not ($Build -or $Test -or $Clean -or $Push)) {
        Write-Info "Docker Build & Test Script"
        Write-Host "`nUsage:"
        Write-Host "  .\build-docker.ps1 -Build          Build the Docker image"
        Write-Host "  .\build-docker.ps1 -Test           Test the Docker image"
        Write-Host "  .\build-docker.ps1 -Build -Test    Build and test"
        Write-Host "  .\build-docker.ps1 -Clean          Clean Docker resources"
        Write-Host "  .\build-docker.ps1 -Push           Show push commands"
        Write-Host "  .\build-docker.ps1 -Tag v1.2.3     Use specific tag"
        Write-Host "`nExamples:"
        Write-Host "  .\build-docker.ps1 -Build -Test"
        Write-Host "  .\build-docker.ps1 -Clean -Build -Test"
        Write-Host "  .\build-docker.ps1 -Build -Tag v1.0.0"
    }
    
} catch {
    Write-Error "An error occurred: $_"
    exit 1
}
