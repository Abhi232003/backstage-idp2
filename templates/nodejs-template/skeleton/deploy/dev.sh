#!/bin/bash
# Deploy script for Development Environment

set -e

# Load dev environment variables
source .env.dev

# Configuration
SERVICE_NAME="${{ values.component_id }}"
PROJECT_ID="${GCP_PROJECT_ID}"
REGION="${GCP_REGION}"
IMAGE_TAG="${1:-dev-$(git rev-parse --short HEAD)}"

echo "🚀 Deploying $SERVICE_NAME to Development Environment..."
echo "📋 Project: $PROJECT_ID"
echo "📍 Region: $REGION"
echo "🏷️ Tag: $IMAGE_TAG"

# Check if gcloud is authenticated
if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" | grep -q .; then
    echo "❌ Please authenticate with Google Cloud first:"
    echo "   gcloud auth login"
    exit 1
fi

# Set the project
echo "📋 Setting GCP project to $PROJECT_ID..."
gcloud config set project $PROJECT_ID

# Build and push Docker image
echo "📦 Building Docker image..."
IMAGE="${REGION}-docker.pkg.dev/${PROJECT_ID}/${SERVICE_NAME}/${SERVICE_NAME}"
docker build -t ${IMAGE}:${IMAGE_TAG} .

echo "📤 Pushing to Artifact Registry..."
docker push ${IMAGE}:${IMAGE_TAG}

# Deploy to Cloud Run with dev-specific settings
echo "☁️ Deploying to Cloud Run (Development)..."
gcloud run deploy $SERVICE_NAME \
  --image ${IMAGE}:${IMAGE_TAG} \
  --platform managed \
  --region $REGION \
  --allow-unauthenticated \
  --port 3001 \
  --memory $MEMORY \
  --cpu $CPU \
  --max-instances $MAX_INSTANCES \
  --set-env-vars="NODE_ENV=$NODE_ENV,SERVICE_VERSION=$SERVICE_VERSION" \
  --tag dev

# Get service URL
SERVICE_URL=$(gcloud run services describe $SERVICE_NAME --region=$REGION --format='value(status.url)')

echo "✅ Development deployment complete!"
echo "🌐 Service URL: $SERVICE_URL"
echo "🔍 Health check: $SERVICE_URL/health"
