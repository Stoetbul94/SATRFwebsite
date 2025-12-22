#!/bin/bash

# SATRF Frontend Deployment Script for Vercel
# This script prepares and deploys the Next.js frontend to Vercel

set -e

echo "🚀 Starting SATRF Frontend Deployment..."

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI not found. Installing..."
    npm install -g vercel
fi

# Clean previous builds
echo "🧹 Cleaning previous builds..."
rm -rf .next
rm -rf out

# Install dependencies
echo "📦 Installing dependencies..."
npm ci --production=false

# Run linting
echo "🔍 Running linting..."
npm run lint

# Run tests
echo "🧪 Running tests..."
npm run test

# Build for production
echo "🏗️ Building for production..."
npm run build

# Optimize images (if using next/image)
echo "🖼️ Optimizing images..."
# This will be handled by Next.js during build

# Deploy to Vercel
echo "🚀 Deploying to Vercel..."
vercel --prod

echo "✅ Frontend deployment completed successfully!"
echo "🌐 Your site is now live at: https://your-domain.vercel.app" 