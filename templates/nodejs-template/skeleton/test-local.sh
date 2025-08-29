#!/bin/bash

# Local testing script for CI/CD workflow simulation
# This script simulates the GitHub Actions environment for local testing

echo "🧪 Simulating GitHub Actions environment locally..."

# Set environment variables that would normally be provided by GitHub Actions
export SERVICE_NAME="test-service"
export GITHUB_SHA="abc123def456"
export GITHUB_REF="refs/heads/main"

echo "📋 Environment Variables:"
echo "SERVICE_NAME=$SERVICE_NAME"
echo "GITHUB_SHA=$GITHUB_SHA" 
echo "GITHUB_REF=$GITHUB_REF"
echo ""

echo "🔍 Running environment check..."
if [ -z "$SERVICE_NAME" ] || [ -z "$GITHUB_SHA" ]; then
  echo "❌ Missing required environment variables"
  exit 1
else
  echo "✅ Environment variables are set correctly"
fi

echo ""
echo "📦 Installing dependencies..."
npm install

echo ""
echo "🧪 Running tests..."
npm test

echo ""
echo "🐳 Building Docker image..."
echo "Building image: $SERVICE_NAME:$GITHUB_SHA"
docker build -t $SERVICE_NAME:$GITHUB_SHA .

echo ""
echo "🚀 Testing Docker container..."
PORT=8080
docker run -d -p $PORT:3001 --name test-container $SERVICE_NAME:$GITHUB_SHA
sleep 5
echo "Testing container at http://localhost:$PORT"
curl -f http://localhost:$PORT || (echo "❌ Container test failed" && docker logs test-container && exit 1)
echo "✅ Container test passed"

echo ""
echo "🧹 Cleaning up..."
docker stop test-container
docker rm test-container

echo ""
echo "🎉 All local tests passed! Template is ready for Backstage deployment."
