#!/bin/bash

# Score Import E2E Test Runner
# This script helps run the score import end-to-end tests

# Default values
TEST_FILE="score-import-simple.spec.ts"
BROWSER="chromium"
DEBUG=false
HEADED=false
UI=false

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Function to show help
show_help() {
    echo "Score Import E2E Test Runner"
    echo ""
    echo "Usage:"
    echo "  ./run-score-import-tests.sh [options]"
    echo ""
    echo "Options:"
    echo "  -f, --file <filename>     Test file to run (default: score-import-simple.spec.ts)"
    echo "  -b, --browser <browser>   Browser to use: chromium, firefox, webkit (default: chromium)"
    echo "  -d, --debug               Run in debug mode"
    echo "  -h, --headed              Run with browser window visible"
    echo "  -u, --ui                  Run with Playwright UI mode"
    echo "  --help                    Show this help message"
    echo ""
    echo "Examples:"
    echo "  ./run-score-import-tests.sh"
    echo "  ./run-score-import-tests.sh -f score-import-flow.spec.ts"
    echo "  ./run-score-import-tests.sh -b firefox -h"
    echo "  ./run-score-import-tests.sh -d -u"
    echo ""
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -f|--file)
            TEST_FILE="$2"
            shift 2
            ;;
        -b|--browser)
            BROWSER="$2"
            shift 2
            ;;
        -d|--debug)
            DEBUG=true
            shift
            ;;
        -h|--headed)
            HEADED=true
            shift
            ;;
        -u|--ui)
            UI=true
            shift
            ;;
        --help)
            show_help
            exit 0
            ;;
        *)
            echo "Unknown option: $1"
            show_help
            exit 1
            ;;
    esac
done

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo -e "${RED}Error: Node.js is not installed or not in PATH${NC}"
    exit 1
fi

NODE_VERSION=$(node --version)
echo -e "${GREEN}Node.js version: $NODE_VERSION${NC}"

# Check if npm is available
if ! command -v npm &> /dev/null; then
    echo -e "${RED}Error: npm is not installed or not in PATH${NC}"
    exit 1
fi

NPM_VERSION=$(npm --version)
echo -e "${GREEN}npm version: $NPM_VERSION${NC}"

# Check if development server is running
echo -e "${YELLOW}Checking if development server is running...${NC}"
if curl -s http://localhost:3000 > /dev/null 2>&1; then
    echo -e "${GREEN}Development server is running on http://localhost:3000${NC}"
else
    echo -e "${YELLOW}Warning: Development server is not running on http://localhost:3000${NC}"
    echo -e "${YELLOW}Please start the development server with: npm run dev${NC}"
    read -p "Would you like to start the development server now? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${YELLOW}Starting development server...${NC}"
        npm run dev &
        DEV_PID=$!
        echo -e "${YELLOW}Waiting for server to start...${NC}"
        sleep 10
        echo -e "${GREEN}Development server started with PID: $DEV_PID${NC}"
    else
        echo -e "${RED}Please start the development server manually and try again${NC}"
        exit 1
    fi
fi

# Install Playwright browsers if not already installed
echo -e "${YELLOW}Checking Playwright browsers...${NC}"
if [ ! -d "$HOME/.cache/ms-playwright" ]; then
    echo -e "${YELLOW}Installing Playwright browsers...${NC}"
    npx playwright install --with-deps
else
    echo -e "${GREEN}Playwright browsers are already installed${NC}"
fi

# Build the test command
TEST_PATH="tests/e2e/$TEST_FILE"
COMMAND="npx playwright test $TEST_PATH"

# Add browser option
if [ "$BROWSER" != "all" ]; then
    COMMAND="$COMMAND --project=$BROWSER"
fi

# Add debug options
if [ "$DEBUG" = true ]; then
    COMMAND="$COMMAND --debug"
fi

if [ "$HEADED" = true ]; then
    COMMAND="$COMMAND --headed"
fi

if [ "$UI" = true ]; then
    COMMAND="$COMMAND --ui"
fi

# Display command being run
echo -e "${CYAN}Running command: $COMMAND${NC}"
echo ""

# Run the tests
if eval $COMMAND; then
    echo ""
    echo -e "${GREEN}✅ All tests passed!${NC}"
    EXIT_CODE=0
else
    echo ""
    echo -e "${RED}❌ Some tests failed. Exit code: $?${NC}"
    echo -e "${YELLOW}Run 'npx playwright show-report' to view detailed results${NC}"
    EXIT_CODE=1
fi

# Clean up development server if we started it
if [ ! -z "$DEV_PID" ]; then
    echo -e "${YELLOW}Stopping development server (PID: $DEV_PID)...${NC}"
    kill $DEV_PID 2>/dev/null
fi

exit $EXIT_CODE 