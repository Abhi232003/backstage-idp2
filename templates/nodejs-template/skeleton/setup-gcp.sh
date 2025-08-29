#!/bin/bash
# GCP Setup Script for ${{ values.component_id }}

echo "🚀 Setting up GCP deployment for ${{ values.component_id }}"
echo ""
echo "📋 Prerequisites Checklist:"
echo "  ✅ Google Cloud Project created with billing enabled"
echo "  ✅ gcloud CLI installed (https://cloud.google.com/sdk/docs/install)"
echo "  ✅ Docker installed and running"
echo ""

# Check if gcloud is installed
if ! command -v gcloud &> /dev/null; then
    echo "❌ gcloud CLI not found. Please install it first:"
    echo "   https://cloud.google.com/sdk/docs/install"
    exit 1
fi

# Authenticate and set project
echo "🔐 Please authenticate with Google Cloud:"
gcloud auth login

echo ""
read -p "📝 Enter your GCP Project ID: " PROJECT_ID

if [ -z "$PROJECT_ID" ]; then
    echo "❌ Project ID cannot be empty"
    exit 1
fi

echo "📋 Setting project to: $PROJECT_ID"
gcloud config set project $PROJECT_ID

echo ""
echo "🔧 Enabling required APIs..."
gcloud services enable run.googleapis.com
gcloud services enable containerregistry.googleapis.com
gcloud services enable cloudbuild.googleapis.com

echo ""
echo "👤 Creating service account for CI/CD..."
SERVICE_ACCOUNT="backstage-deployer"
gcloud iam service-accounts create $SERVICE_ACCOUNT \
    --description="Service account for Backstage IDP deployments" \
    --display-name="Backstage Deployer"

echo ""
echo "🔑 Granting required permissions..."
gcloud projects add-iam-policy-binding $PROJECT_ID \
    --member="serviceAccount:$SERVICE_ACCOUNT@$PROJECT_ID.iam.gserviceaccount.com" \
    --role="roles/run.admin"

gcloud projects add-iam-policy-binding $PROJECT_ID \
    --member="serviceAccount:$SERVICE_ACCOUNT@$PROJECT_ID.iam.gserviceaccount.com" \
    --role="roles/storage.admin"

gcloud projects add-iam-policy-binding $PROJECT_ID \
    --member="serviceAccount:$SERVICE_ACCOUNT@$PROJECT_ID.iam.gserviceaccount.com" \
    --role="roles/iam.serviceAccountUser"

echo ""
echo "🗝️ Creating service account key..."
KEY_FILE="gcp-key.json"
gcloud iam service-accounts keys create $KEY_FILE \
    --iam-account="$SERVICE_ACCOUNT@$PROJECT_ID.iam.gserviceaccount.com"

echo ""
echo "🔧 Configuring Docker for GCR..."
gcloud auth configure-docker

echo ""
echo "✅ Setup complete!"
echo ""
echo "📋 Next steps:"
echo "1. Add these GitHub Secrets to your repository:"
echo "   - GCP_PROJECT_ID: $PROJECT_ID"
echo "   - GCP_SA_KEY: (content of $KEY_FILE)"
echo ""
echo "2. Copy the content of $KEY_FILE:"
echo "   cat $KEY_FILE"
echo ""
echo "3. Go to GitHub repository → Settings → Secrets and variables → Actions"
echo "4. Add the secrets as described in README.md"
echo ""
echo "🌐 Repository: https://github.com/${{ values.owner }}/${{ values.component_id }}"
echo "🎯 After adding secrets, push code to main branch for automatic deployment!"
