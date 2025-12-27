# Setup script to prevent npm ENOENT errors
# Run this once to install permanent guardrails

Write-Host "Setting up npm guardrails..." -ForegroundColor Cyan

# Get PowerShell profile path
$profilePath = $PROFILE.CurrentUserAllHosts
$profileDir = Split-Path $profilePath -Parent

# Create profile directory if it doesn't exist
if (-not (Test-Path $profileDir)) {
    New-Item -ItemType Directory -Path $profileDir -Force | Out-Null
}

# Check if profile exists, create if not
if (-not (Test-Path $profilePath)) {
    New-Item -ItemType File -Path $profilePath -Force | Out-Null
}

# Read existing profile
$existingContent = ""
if (Test-Path $profilePath) {
    $existingContent = Get-Content $profilePath -Raw
}

# Check if guardrails already installed
if ($existingContent -match "SATRF npm guardrails") {
    Write-Host "⚠️  Guardrails already installed. Skipping..." -ForegroundColor Yellow
    exit 0
}

# Get project root (assumes script is in project root)
$projectRoot = $PSScriptRoot
$validateScript = Join-Path $projectRoot "scripts\validate-npm-directory.ps1"

# Add guardrails to profile
$guardrailCode = @"

# SATRF npm guardrails - Prevents ENOENT errors
function npm {
    param([Parameter(ValueFromRemainingArguments)]$args)
    
    # Get project root (adjust path if needed)
    `$projectRoot = "$projectRoot"
    `$packageJson = Join-Path `$projectRoot "package.json"
    
    # Check if we're in the project directory or a subdirectory
    `$currentDir = Get-Location
    `$inProject = `$currentDir.Path -like "`$projectRoot*"
    
    if (-not `$inProject -or -not (Test-Path `$packageJson)) {
        Write-Host "❌ ERROR: Not in project directory!" -ForegroundColor Red
        Write-Host "Current: `$(`$currentDir.Path)" -ForegroundColor Yellow
        Write-Host "Expected: `$projectRoot" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "Run: cd `"`$projectRoot`"" -ForegroundColor Cyan
        return
    }
    
    # Execute npm with original arguments
    & (Get-Command npm -CommandType Application) @args
}

"@

# Append to profile
Add-Content -Path $profilePath -Value $guardrailCode

Write-Host "✅ Guardrails installed successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "Please restart PowerShell or run:" -ForegroundColor Yellow
Write-Host "  . `$PROFILE" -ForegroundColor Cyan
Write-Host ""
Write-Host "The npm function will now validate directory before running." -ForegroundColor Green
