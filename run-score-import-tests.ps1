#!/usr/bin/env pwsh

# Score Import E2E Test Runner
# This script helps run the score import end-to-end tests

param(
    [string]$TestFile = "score-import-simple.spec.ts",
    [string]$Browser = "chromium",
    [switch]$Debug,
    [switch]$Headed,
    [switch]$UI,
    [switch]$Help
)

if ($Help) {
    Write-Host @"
Score Import E2E Test Runner

Usage:
    .\run-score-import-tests.ps1 [options]

Options:
    -TestFile <filename>    Test file to run (default: score-import-simple.spec.ts)
    -Browser <browser>      Browser to use: chromium, firefox, webkit (default: chromium)
    -Debug                  Run in debug mode
    -Headed                 Run with browser window visible
    -UI                     Run with Playwright UI mode
    -Help                   Show this help message

Examples:
    .\run-score-import-tests.ps1
    .\run-score-import-tests.ps1 -TestFile score-import-flow.spec.ts
    .\run-score-import-tests.ps1 -Browser firefox -Headed
    .\run-score-import-tests.ps1 -Debug -UI

"@
    exit 0
}

# Check if Node.js is installed
try {
    $nodeVersion = node --version
    Write-Host "Node.js version: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "Error: Node.js is not installed or not in PATH" -ForegroundColor Red
    exit 1
}

# Check if npm is available
try {
    $npmVersion = npm --version
    Write-Host "npm version: $npmVersion" -ForegroundColor Green
} catch {
    Write-Host "Error: npm is not installed or not in PATH" -ForegroundColor Red
    exit 1
}

# Check if development server is running
Write-Host "Checking if development server is running..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000" -TimeoutSec 5 -UseBasicParsing
    Write-Host "Development server is running on http://localhost:3000" -ForegroundColor Green
} catch {
    Write-Host "Warning: Development server is not running on http://localhost:3000" -ForegroundColor Yellow
    Write-Host "Please start the development server with: npm run dev" -ForegroundColor Yellow
    $startServer = Read-Host "Would you like to start the development server now? (y/n)"
    if ($startServer -eq "y" -or $startServer -eq "Y") {
        Write-Host "Starting development server..." -ForegroundColor Yellow
        Start-Process -FilePath "npm" -ArgumentList "run", "dev" -WindowStyle Minimized
        Write-Host "Waiting for server to start..." -ForegroundColor Yellow
        Start-Sleep -Seconds 10
    } else {
        Write-Host "Please start the development server manually and try again" -ForegroundColor Red
        exit 1
    }
}

# Install Playwright browsers if not already installed
Write-Host "Checking Playwright browsers..." -ForegroundColor Yellow
if (-not (Test-Path "$env:USERPROFILE\AppData\Local\ms-playwright")) {
    Write-Host "Installing Playwright browsers..." -ForegroundColor Yellow
    npx playwright install --with-deps
} else {
    Write-Host "Playwright browsers are already installed" -ForegroundColor Green
}

# Build the test command
$testPath = "tests/e2e/$TestFile"
$command = @("npx", "playwright", "test", $testPath)

# Add browser option
if ($Browser -ne "all") {
    $command += "--project=$Browser"
}

# Add debug options
if ($Debug) {
    $command += "--debug"
}

if ($Headed) {
    $command += "--headed"
}

if ($UI) {
    $command += "--ui"
}

# Display command being run
Write-Host "Running command: $($command -join ' ')" -ForegroundColor Cyan
Write-Host ""

# Run the tests
try {
    & $command[0] $command[1..($command.Length-1)]
    $exitCode = $LASTEXITCODE
    
    if ($exitCode -eq 0) {
        Write-Host ""
        Write-Host "✅ All tests passed!" -ForegroundColor Green
    } else {
        Write-Host ""
        Write-Host "❌ Some tests failed. Exit code: $exitCode" -ForegroundColor Red
        Write-Host "Run 'npx playwright show-report' to view detailed results" -ForegroundColor Yellow
    }
    
    exit $exitCode
} catch {
    Write-Host "Error running tests: $_" -ForegroundColor Red
    exit 1
} 