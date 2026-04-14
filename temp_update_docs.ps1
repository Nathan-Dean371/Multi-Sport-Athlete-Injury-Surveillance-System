# Temporary script to update documentation copies from the main repository.

$ErrorActionPreference = 'Stop'

# Define paths relative to the project root
$projectRoot = $PSScriptRoot
$inventoryPath = Join-Path $projectRoot "Documentation/docs-archive-view/INVENTORY.txt"
$archiveBaseDir = Join-Path $projectRoot "Documentation/docs-archive-view"
$mainRepoArchiveDir = Join-Path $archiveBaseDir "from-main-repo"

# Read the inventory to find which files to copy
Write-Host "Reading inventory file to find files to update..."
$inventoryContent = Get-Content $inventoryPath

# Filter for lines that start with 'from-main-repo/'
$mainRepoFiles = $inventoryContent | Where-Object { $_.StartsWith('from-main-repo/') }

Write-Host "Found $($mainRepoFiles.Count) files to update in the 'from-main-repo' archive."

foreach ($fileEntry in $mainRepoFiles) {
    # The inventory format is "from-main-repo/path/to/file.md"
    # The source path is "path/to/file.md" relative to the project root
    $sourceRelativePath = $fileEntry.Substring("from-main-repo/".Length)
    
    # Normalize path for PowerShell
    $sourceRelativePath = $sourceRelativePath.Replace('/', '')
    
    $sourceFullPath = Join-Path $projectRoot $sourceRelativePath
    $destFullPath = Join-Path $mainRepoArchiveDir $sourceRelativePath

    if (Test-Path $sourceFullPath) {
        # Ensure the destination directory exists
        $destDir = Split-Path -Path $destFullPath -Parent
        if (-not (Test-Path $destDir)) {
            New-Item -ItemType Directory -Path $destDir -Force > $null
        }
        
        # Copy the file
        Write-Host "Copying '$sourceFullPath' to '$destFullPath'"
        Copy-Item -Path $sourceFullPath -Destination $destFullPath -Force
    } else {
        # If the source file does not exist, it might have been deleted. Remove it from the archive.
        if (Test-Path $destFullPath) {
            Write-Warning "Source file '$sourceFullPath' does not exist. Removing from archive."
            Remove-Item -Path $destFullPath -Force
        } else {
            Write-Warning "Source file '$sourceFullPath' does not exist, and it's not in the archive."
        }
    }
}

Write-Host "File copy process complete."
