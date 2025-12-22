#!/bin/bash

# SATRF Backend Deployment Script
# This script prepares and deploys the FastAPI backend to various cloud platforms

set -e

PLATFORM=${1:-"render"}
BACKEND_DIR="backend"

echo "🚀 Starting SATRF Backend Deployment to $PLATFORM..."

# Change to backend directory
cd $BACKEND_DIR

# Clean previous builds
echo "🧹 Cleaning previous builds..."
rm -rf __pycache__
rm -rf .pytest_cache
rm -rf uploads/*
rm -rf logs/*

# Install dependencies
echo "📦 Installing dependencies..."
pip install -r requirements.txt

# Run tests
echo "🧪 Running tests..."
python -m pytest tests/ -v

# Build Docker image
echo "🐳 Building Docker image..."
docker build -t satrf-backend:latest .

# Deploy based on platform
case $PLATFORM in
    "render")
        echo "🚀 Deploying to Render..."
        # Render deployment (requires Render CLI or manual deployment)
        echo "📝 Please deploy manually to Render using the Dockerfile"
        ;;
    "railway")
        echo "🚀 Deploying to Railway..."
        # Railway deployment (requires Railway CLI)
        if command -v railway &> /dev/null; then
            railway up
        else
            echo "❌ Railway CLI not found. Please install it first."
        fi
        ;;
    "gcp")
        echo "🚀 Deploying to Google Cloud Run..."
        # Google Cloud Run deployment
        if command -v gcloud &> /dev/null; then
            gcloud run deploy satrf-backend \
                --image satrf-backend:latest \
                --platform managed \
                --region us-central1 \
                --allow-unauthenticated
        else
            echo "❌ Google Cloud CLI not found. Please install it first."
        fi
        ;;
    "docker")
        echo "🐳 Running locally with Docker..."
        docker-compose up -d
        ;;
    *)
        echo "❌ Unknown platform: $PLATFORM"
        echo "Supported platforms: render, railway, gcp, docker"
        exit 1
        ;;
esac

echo "✅ Backend deployment completed successfully!" 