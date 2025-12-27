# Validate that npm is being run from the correct directory
# This script ensures package.json exists before running npm commands

param(
    [Parameter(Mandatory=$false)]
    [string]$Command = ""
)

$packageJsonPath = Join-Path $PSScriptRoot "..\package.json"

if (-not (Test-Path $packageJsonPath)) {
    Write-Host "❌ ERROR: package.json not found!" -ForegroundColor Red
    Write-Host "Current directory: $(Get-Location)" -ForegroundColor Yellow
    Write-Host "Expected location: $(Split-Path $packageJsonPath -Parent)" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Please run npm commands from the project root directory." -ForegroundColor Red
    exit 1
}

if ($Command) {
    # If command provided, execute it
    Invoke-Expression $Command
} else {
    # Otherwise, just validate
    Write-Host "✅ Valid directory: package.json found" -ForegroundColor Green
    exit 0
}
