{% if values.provisionInfra %}variable "project_id" {
  description = "The GCP project ID"
  type        = string
}

variable "region" {
  description = "The GCP region"
  type        = string
  default     = "us-central1"
}

variable "service_name" {
  description = "Name of the service"
  type        = string
  default     = "${{ values.component_id }}"
}

variable "environment" {
  description = "Environment (dev, staging, prod)"
  type        = string
}

variable "database_type" {
  description = "Type of database to provision (mysql, postgresql, none)"
  type        = string
  default     = "${{ values.infraDatabase }}"
}

variable "enable_storage" {
  description = "Whether to provision cloud storage bucket"
  type        = bool
  default     = ${{ values.infraStorage }}
}
{% endif %}
