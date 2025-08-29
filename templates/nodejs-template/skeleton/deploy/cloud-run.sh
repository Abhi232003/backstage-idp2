#!/bin/bash
# Deploy script for Google Cloud Run

set -e

# Configuration
SERVICE_NAME="${{ values.component_id }}"
PROJECT_ID="${GCP_PROJECT_ID:-${{ values.project_id }}}"
REGION="${GCP_REGION:-${{ values.region }}}"
IMAGE_TAG="${1:-latest}"
ARTIFACT_REGISTRY_URL="$REGION-docker.pkg.dev/$PROJECT_ID/$SERVICE_NAME"

echo "🚀 Deploying $SERVICE_NAME to Google Cloud Run..."

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
docker build -t $ARTIFACT_REGISTRY_URL/$SERVICE_NAME:$IMAGE_TAG .

echo "📤 Pushing to Artifact Registry..."
docker push $ARTIFACT_REGISTRY_URL/$SERVICE_NAME:$IMAGE_TAG

# Deploy to Cloud Run
echo "☁️ Deploying to Cloud Run..."
gcloud run deploy $SERVICE_NAME \
  --image $ARTIFACT_REGISTRY_URL/$SERVICE_NAME:$IMAGE_TAG \
  --platform managed \
  --region $REGION \
  --allow-unauthenticated \
  --port 3000 \
  --memory 512Mi \
  --cpu 1 \
  --max-instances 10 \
  --set-env-vars="NODE_ENV=production"

# Get service URL
SERVICE_URL=$(gcloud run services describe $SERVICE_NAME --region=$REGION --format='value(status.url)')

echo "✅ Deployment complete!"
echo "🌐 Service URL: $SERVICE_URL"
echo "🔍 Health check: $SERVICE_URL/health"
echo ""
echo "📊 Useful commands:"
echo "   gcloud run services list"
echo "   gcloud run services describe $SERVICE_NAME --region=$REGION"
echo "   gcloud run services delete $SERVICE_NAME --region=$REGION"
