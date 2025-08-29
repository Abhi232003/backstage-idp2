{% if values.provisionInfra %}terraform {
  required_version = ">= 1.0"
  
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 5.0"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.1"
    }
  }

  backend "gcs" {
    # bucket and prefix will be set via backend-config during terraform init
  }
}

provider "google" {
  project = var.project_id
  region  = var.region
}

# Local values
locals {
  resource_prefix = "${var.service_name}-${var.environment}"
  
  labels = {
    service     = var.service_name
    environment = var.environment
    managed_by  = "terraform"
  }
}

# Random suffix for globally unique resources
resource "random_id" "suffix" {
  byte_length = 4
}
{% endif %}
