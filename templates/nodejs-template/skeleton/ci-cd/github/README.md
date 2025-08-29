# GitHub Workflows

This directory contains GitHub Actions workflows for the ${{ values.component_id }} service.

## Workflows

### ci.yml
- **Purpose**: Main CI/CD pipeline with comprehensive testing and deployment
- **Triggers**: Push to `main`, `staging`, `dev` branches and pull requests
- **Features**:
  - Node.js testing and building
  - Docker image creation and testing
  - Multi-environment GCP deployment (dev, staging, production)
  - Automated deployments based on branch

### ci.yml.hbs
- **Purpose**: Handlebars template version of the CI workflow
- **Usage**: Template file for dynamic generation

### setup-branches.yml
- **Purpose**: Automatically sets up development branches (dev, staging)
- **Triggers**: Manual workflow dispatch or repository creation
- **Features**: Creates and configures branch protection rules

## Usage

When your repository is hosted on **GitHub**, these workflows will automatically execute based on the defined triggers.

## Environment Setup

Configure the following GitHub Secrets for proper deployment:

### Required Secrets
- `GCP_PROJECT_ID_DEV` - GCP project ID for development environment
- `GCP_PROJECT_ID_STAGING` - GCP project ID for staging environment  
- `GCP_PROJECT_ID_PROD` - GCP project ID for production environment
- `GCP_SA_KEY_DEV` - Service account key for development
- `GCP_SA_KEY_STAGING` - Service account key for staging
- `GCP_SA_KEY_PROD` - Service account key for production

### Alternative (Single Environment)
- `GCP_PROJECT_ID` - Single GCP project ID for all environments
- `GCP_SA_KEY` - Single service account key for all environments

## Branch Strategy

| Branch   | Environment | Auto-Deploy | Purpose           |
|----------|-------------|-------------|-------------------|
| dev      | Development | ✅ Yes      | Feature development |
| staging  | Staging     | ✅ Yes      | Pre-production testing |
| main     | Production  | ✅ Yes      | Live production |
