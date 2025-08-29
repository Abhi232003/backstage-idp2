#!/bin/bash

# GCP Setup Script for Backstage Template Components
# This script helps set up the required GCP resources for each new component

set -e

PROJECT_ID="zenhotels-428004"
REGION="asia-south1"

echo "🚀 Setting up GCP resources for new component..."

# Check if component name is provided
if [ -z "$1" ]; then
    echo "❌ Error: Please provide a component name"
    echo "Usage: $0 <component-name>"
    echo "Example: $0 user-service"
    exit 1
fi

COMPONENT_NAME=$1

echo "📦 Component: $COMPONENT_NAME"
echo "🌍 Project: $PROJECT_ID"
echo "📍 Region: $REGION"
echo ""

# Set the project
echo "🔧 Setting GCP project..."
gcloud config set project $PROJECT_ID

# Enable required APIs
echo "🔌 Enabling required APIs..."
gcloud services enable run.googleapis.com
gcloud services enable sql-component.googleapis.com
gcloud services enable artifactregistry.googleapis.com
gcloud services enable container.googleapis.com

# Create Artifact Registry repository
echo "📦 Creating Artifact Registry repository..."
gcloud artifacts repositories create $COMPONENT_NAME \
    --repository-format=docker \
    --location=$REGION \
    --description="Docker repository for $COMPONENT_NAME" || echo "Repository may already exist"

# Configure Docker for Artifact Registry
echo "🐳 Configuring Docker authentication..."
gcloud auth configure-docker $REGION-docker.pkg.dev

echo ""
echo "✅ Setup complete!"
echo ""
echo "📋 Summary:"
echo "   • Artifact Registry: $REGION-docker.pkg.dev/$PROJECT_ID/$COMPONENT_NAME"
echo "   • Cloud Run region: $REGION"
echo "   • Docker configured for: $REGION-docker.pkg.dev"
echo ""
echo "🔑 Next steps:"
echo "   1. Add GCP_SA_KEY secret to your GitHub repository"
echo "   2. Push your code to trigger the CI/CD pipeline"
echo "   3. Your app will be deployed automatically!"
echo ""
echo "🔐 To create a service account key:"
echo "   gcloud iam service-accounts create github-actions-$COMPONENT_NAME"
echo "   gcloud projects add-iam-policy-binding $PROJECT_ID --member=\"serviceAccount:github-actions-$COMPONENT_NAME@$PROJECT_ID.iam.gserviceaccount.com\" --role=\"roles/run.admin\""
echo "   gcloud projects add-iam-policy-binding $PROJECT_ID --member=\"serviceAccount:github-actions-$COMPONENT_NAME@$PROJECT_ID.iam.gserviceaccount.com\" --role=\"roles/storage.admin\""
echo "   gcloud projects add-iam-policy-binding $PROJECT_ID --member=\"serviceAccount:github-actions-$COMPONENT_NAME@$PROJECT_ID.iam.gserviceaccount.com\" --role=\"roles/artifactregistry.admin\""
echo "   gcloud iam service-accounts keys create key.json --iam-account=github-actions-$COMPONENT_NAME@$PROJECT_ID.iam.gserviceaccount.com"
echo ""
