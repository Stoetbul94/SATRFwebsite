# SATRF Website Test Runner Script
# This script helps you run tests with the proper virtual environment setup

param(
    [string]$TestType = "all",
    [switch]$FrontendOnly,
    [switch]$BackendOnly,
    [switch]$E2EOnly,
    [switch]$Coverage
)

Write-Host "🚀 SATRF Website Test Runner" -ForegroundColor Green
Write-Host "================================" -ForegroundColor Green

# Function to activate virtual environment
function Enable-VirtualEnv {
    if (Test-Path ".\venv\Scripts\Activate.ps1") {
        Write-Host "📦 Activating virtual environment..." -ForegroundColor Yellow
        & ".\venv\Scripts\Activate.ps1"
        return $true
    } else {
        Write-Host "❌ Virtual environment not found. Creating one..." -ForegroundColor Red
        python -m venv venv
        & ".\venv\Scripts\Activate.ps1"
        return $true
    }
}

# Function to install backend dependencies
function Install-BackendDeps {
    Write-Host "📦 Installing backend dependencies..." -ForegroundColor Yellow
    Set-Location "backend"
    
    # Install main requirements
    pip install -r requirements.txt
    
    # Install test requirements
    pip install -r requirements-test.txt
    
    Set-Location ".."
    Write-Host "✅ Backend dependencies installed" -ForegroundColor Green
}

# Function to run frontend tests
function Invoke-FrontendTests {
    Write-Host "🧪 Running frontend tests..." -ForegroundColor Yellow
    
    if ($Coverage) {
        npm run test:coverage
    } else {
        npm test
    }
    
    Write-Host "✅ Frontend tests completed" -ForegroundColor Green
}

# Function to run backend tests
function Invoke-BackendTests {
    Write-Host "🧪 Running backend tests..." -ForegroundColor Yellow
    
    Set-Location "backend"
    
    if ($Coverage) {
        pytest --cov=app --cov-report=html --cov-report=term-missing
    } else {
        pytest -v
    }
    
    Set-Location ".."
    Write-Host "✅ Backend tests completed" -ForegroundColor Green
}

# Function to run E2E tests
function Invoke-E2ETests {
    Write-Host "🌐 Running E2E tests..." -ForegroundColor Yellow
    
    # Make sure the dev server is running
    Write-Host "⚠️  Make sure your dev server is running (npm run dev)" -ForegroundColor Yellow
    Start-Sleep -Seconds 3
    
    npm run test:e2e
    
    Write-Host "✅ E2E tests completed" -ForegroundColor Green
}

# Main execution
try {
    # Check if we're in the right directory
    if (-not (Test-Path "package.json")) {
        Write-Host "❌ Please run this script from the project root directory" -ForegroundColor Red
        exit 1
    }
    
    # Install frontend dependencies if needed
    if (-not (Test-Path "node_modules")) {
        Write-Host "📦 Installing frontend dependencies..." -ForegroundColor Yellow
        npm install
    }
    
    # Activate virtual environment and install backend deps
    if (Enable-VirtualEnv) {
        Install-BackendDeps
    }
    
    # Run tests based on parameters
    switch ($TestType.ToLower()) {
        "frontend" {
            Invoke-FrontendTests
        }
        "backend" {
            Invoke-BackendTests
        }
        "e2e" {
            Invoke-E2ETests
        }
        "all" {
            if ($FrontendOnly) {
                Invoke-FrontendTests
            } elseif ($BackendOnly) {
                Invoke-BackendTests
            } elseif ($E2EOnly) {
                Invoke-E2ETests
            } else {
                Write-Host "🧪 Running all tests..." -ForegroundColor Yellow
                Invoke-FrontendTests
                Invoke-BackendTests
                Write-Host "📝 Note: E2E tests require the dev server to be running" -ForegroundColor Cyan
                Write-Host "   Run 'npm run test:e2e' separately after starting the dev server" -ForegroundColor Cyan
            }
        }
        default {
            Write-Host "❌ Invalid test type. Use: frontend, backend, e2e, or all" -ForegroundColor Red
            exit 1
        }
    }
    
    Write-Host "🎉 All tests completed successfully!" -ForegroundColor Green
    
} catch {
    Write-Host "❌ Error running tests: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
} 