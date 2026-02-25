#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Cleans the repository by removing all untracked and ignored files.

.DESCRIPTION
    This script removes all files and folders that are not tracked by Git,
    including those specified in .gitignore. This includes:
    - node_modules/
    - .next/
    - generated-images/*
    - Build artifacts and cache files

    Note: .env files and .ps1 scripts are preserved and will NOT be deleted.

.PARAMETER Force
    Skip confirmation prompt and immediately clean.

.PARAMETER DryRun
    Show what would be deleted without actually deleting anything.

.EXAMPLE
    .\clean-repo.ps1
    # Shows what will be deleted and asks for confirmation

.EXAMPLE
    .\clean-repo.ps1 -DryRun
    # Only shows what would be deleted

.EXAMPLE
    .\clean-repo.ps1 -Force
    # Cleans without confirmation
#>

param(
    [switch]$Force,
    [switch]$DryRun
)

$ErrorActionPreference = "Stop"

# Ensure we're in a git repository
if (-not (Test-Path ".git")) {
    Write-Error "This script must be run from the root of a Git repository."
    exit 1
}

Write-Host "Repository Cleanup Script" -ForegroundColor Cyan
Write-Host "=========================" -ForegroundColor Cyan
Write-Host ""

# Show what will be deleted
Write-Host "Files and folders that will be removed:" -ForegroundColor Yellow
Write-Host ""

$filesToClean = git clean -fdxn -e ".env*" -e "*.ps1" 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Error "Failed to determine files to clean: $filesToClean"
    exit 1
}

if ([string]::IsNullOrWhiteSpace($filesToClean)) {
    Write-Host "Repository is already clean. No untracked or ignored files found." -ForegroundColor Green
    exit 0
}

# Display files to be cleaned
$filesToClean | ForEach-Object {
    $line = $_ -replace "^Would remove ", ""
    Write-Host "  - $line" -ForegroundColor Gray
}

Write-Host ""

if ($DryRun) {
    Write-Host "Dry run complete. No files were deleted." -ForegroundColor Cyan
    exit 0
}

# Confirm unless Force is specified
if (-not $Force) {
    Write-Host "WARNING: This action cannot be undone!" -ForegroundColor Red
    $response = Read-Host "Do you want to proceed? (y/N)"
    if ($response -ne "y" -and $response -ne "Y") {
        Write-Host "Cleanup cancelled." -ForegroundColor Yellow
        exit 0
    }
}

# Perform the cleanup
Write-Host ""
Write-Host "Cleaning repository..." -ForegroundColor Cyan

git clean -fdx -e ".env*" -e "*.ps1"
if ($LASTEXITCODE -ne 0) {
    Write-Error "Failed to clean repository."
    exit 1
}

Write-Host ""
Write-Host "Repository cleaned successfully!" -ForegroundColor Green