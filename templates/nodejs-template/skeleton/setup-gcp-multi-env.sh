#!/bin/bash
# Multi-Environment GCP Setup Script for ${{ values.component_id }}

echo "🚀 Setting up multi-environment GCP configuration for ${{ values.component_id }}"
echo ""
echo "📋 This script will help you set up three environments:"
echo "   - Development (dev)"
echo "   - Staging (staging)" 
echo "   - Production (prod)"
echo ""

# Check if gcloud is installed
if ! command -v gcloud &> /dev/null; then
    echo "❌ gcloud CLI not found. Please install it first:"
    echo "   https://cloud.google.com/sdk/docs/install"
    exit 1
fi

# Authenticate and get projects
echo "🔐 Please authenticate with Google Cloud:"
gcloud auth login

echo ""
echo "📝 Please provide your GCP Project IDs for each environment:"
echo ""

read -p "Development Project ID: " DEV_PROJECT_ID
read -p "Staging Project ID: " STAGING_PROJECT_ID  
read -p "Production Project ID: " PROD_PROJECT_ID

if [ -z "$DEV_PROJECT_ID" ] || [ -z "$STAGING_PROJECT_ID" ] || [ -z "$PROD_PROJECT_ID" ]; then
    echo "❌ All project IDs are required"
    exit 1
fi

# Function to setup environment
setup_environment() {
    local ENV_NAME=$1
    local PROJECT_ID=$2
    
    echo ""
    echo "🔧 Setting up $ENV_NAME environment (Project: $PROJECT_ID)..."
    
    gcloud config set project $PROJECT_ID
    
    echo "🔧 Enabling required APIs..."
    gcloud services enable run.googleapis.com
    gcloud services enable containerregistry.googleapis.com
    gcloud services enable cloudbuild.googleapis.com
    gcloud services enable artifactregistry.googleapis.com
    
    echo "👤 Creating service account for $ENV_NAME..."
    SERVICE_ACCOUNT="backstage-deployer-$ENV_NAME"
    gcloud iam service-accounts create $SERVICE_ACCOUNT \
        --description="Service account for Backstage IDP $ENV_NAME deployments" \
        --display-name="Backstage Deployer ($ENV_NAME)" || echo "Service account might already exist"
    
    echo "🔑 Granting required permissions..."
    gcloud projects add-iam-policy-binding $PROJECT_ID \
        --member="serviceAccount:$SERVICE_ACCOUNT@$PROJECT_ID.iam.gserviceaccount.com" \
        --role="roles/run.admin"
    
    gcloud projects add-iam-policy-binding $PROJECT_ID \
        --member="serviceAccount:$SERVICE_ACCOUNT@$PROJECT_ID.iam.gserviceaccount.com" \
        --role="roles/storage.admin"
        
    gcloud projects add-iam-policy-binding $PROJECT_ID \
        --member="serviceAccount:$SERVICE_ACCOUNT@$PROJECT_ID.iam.gserviceaccount.com" \
        --role="roles/artifactregistry.admin"
    
    gcloud projects add-iam-policy-binding $PROJECT_ID \
        --member="serviceAccount:$SERVICE_ACCOUNT@$PROJECT_ID.iam.gserviceaccount.com" \
        --role="roles/iam.serviceAccountUser"
    
    echo "🗝️ Creating service account key..."
    gcloud iam service-accounts keys create "sa-key-$ENV_NAME.json" \
        --iam-account="$SERVICE_ACCOUNT@$PROJECT_ID.iam.gserviceaccount.com"
    
    echo "✅ $ENV_NAME environment setup complete!"
}

# Setup each environment
setup_environment "dev" $DEV_PROJECT_ID
setup_environment "staging" $STAGING_PROJECT_ID
setup_environment "prod" $PROD_PROJECT_ID

echo ""
echo "🎉 Multi-environment GCP setup complete!"
echo ""
echo "📋 Next steps:"
echo "   1. Add the following GitHub Secrets to your repository:"
echo "      Settings → Secrets and variables → Actions"
echo ""
echo "📝 Required GitHub Secrets:"
echo ""
echo "Development Environment:"
echo "   - GCP_PROJECT_ID_DEV: $DEV_PROJECT_ID"
echo "   - GCP_SA_KEY_DEV: Contents of sa-key-dev.json"
echo ""
echo "Staging Environment:"
echo "   - GCP_PROJECT_ID_STAGING: $STAGING_PROJECT_ID"
echo "   - GCP_SA_KEY_STAGING: Contents of sa-key-staging.json"
echo ""
echo "Production Environment:"
echo "   - GCP_PROJECT_ID_PROD: $PROD_PROJECT_ID"
echo "   - GCP_SA_KEY_PROD: Contents of sa-key-prod.json"
echo ""
echo "🔐 Service account key files created:"
echo "   - sa-key-dev.json"
echo "   - sa-key-staging.json"
echo "   - sa-key-prod.json"
echo ""
echo "⚠️  IMPORTANT: Store these keys securely and delete the local files after adding to GitHub Secrets"
echo ""
echo "🌐 Repository: https://github.com/${{ values.owner }}/${{ values.component_id }}"
echo "🎯 After adding secrets, use the following workflow:"
echo "   - Push to 'dev' branch → Deploy to development"
echo "   - Push to 'staging' branch → Deploy to staging"
echo "   - Push to 'main' branch → Deploy to production"
