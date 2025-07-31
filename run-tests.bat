@echo off
echo 🚀 SATRF Website Test Runner
echo ================================

REM Check if we're in the right directory
if not exist "package.json" (
    echo ❌ Please run this script from the project root directory
    exit /b 1
)

REM Activate virtual environment
if exist "venv\Scripts\activate.bat" (
    echo 📦 Activating virtual environment...
    call venv\Scripts\activate.bat
) else (
    echo ❌ Virtual environment not found. Creating one...
    python -m venv venv
    call venv\Scripts\activate.bat
)

REM Install backend dependencies
echo 📦 Installing backend dependencies...
cd backend
pip install -r requirements.txt
pip install -r requirements-test.txt
cd ..

REM Run tests based on argument
if "%1"=="frontend" (
    echo 🧪 Running frontend tests...
    npm test
) else if "%1"=="backend" (
    echo 🧪 Running backend tests...
    cd backend
    pytest -v
    cd ..
) else if "%1"=="e2e" (
    echo 🌐 Running E2E tests...
    echo ⚠️  Make sure your dev server is running (npm run dev)
    timeout /t 3
    npm run test:e2e
) else (
    echo 🧪 Running all tests...
    npm test
    cd backend
    pytest -v
    cd ..
    echo 📝 Note: E2E tests require the dev server to be running
    echo    Run 'npm run test:e2e' separately after starting the dev server
)

echo �� Tests completed! 