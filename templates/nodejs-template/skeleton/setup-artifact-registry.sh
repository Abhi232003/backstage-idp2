#!/bin/bash
# Manual setup script for Artifact Registry

set -e

# Configuration - update these values for your project
PROJECT_ID="zenhotels-428004"
REGION="asia-south1"
REPOSITORY_NAME="zenwebapivregh"

echo "🚀 Setting up Artifact Registry for project: $PROJECT_ID"

# Set the project
echo "📋 Setting GCP project..."
gcloud config set project $PROJECT_ID

# Enable required APIs
echo "🔌 Enabling required APIs..."
gcloud services enable artifactregistry.googleapis.com
gcloud services enable cloudbuild.googleapis.com
gcloud services enable cloudrun.googleapis.com
gcloud services enable container.googleapis.com

# Create Artifact Registry repository
echo "📦 Creating Artifact Registry repository: $REPOSITORY_NAME"
gcloud artifacts repositories create $REPOSITORY_NAME \
    --repository-format=docker \
    --location=$REGION \
    --description="Docker repository for $REPOSITORY_NAME"

# Configure Docker authentication
echo "🔐 Configuring Docker authentication..."
gcloud auth configure-docker $REGION-docker.pkg.dev

# Verify the repository was created
echo "✅ Verifying repository creation..."
gcloud artifacts repositories describe $REPOSITORY_NAME \
    --location=$REGION

echo ""
echo "✅ Setup complete!"
echo "🌐 Repository URL: $REGION-docker.pkg.dev/$PROJECT_ID/$REPOSITORY_NAME"
echo ""
echo "📋 Required permissions for GitHub Actions service account:"
echo "   roles/artifactregistry.admin"
echo "   roles/cloudbuild.builds.editor"
echo "   roles/run.admin"
echo "   roles/container.admin (if using GKE)"
echo ""
echo "🔍 To test access:"
echo "   docker tag your-image:tag $REGION-docker.pkg.dev/$PROJECT_ID/$REPOSITORY_NAME/your-image:tag"
echo "   docker push $REGION-docker.pkg.dev/$PROJECT_ID/$REPOSITORY_NAME/your-image:tag"
