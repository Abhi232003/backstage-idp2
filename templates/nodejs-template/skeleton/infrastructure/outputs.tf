{% if values.provisionInfra %}# Database outputs
{% if values.infraDatabase === 'mysql' %}
output "mysql_instance_name" {
  description = "Name of the MySQL Cloud SQL instance"
  value       = google_sql_database_instance.mysql.name
}

output "mysql_connection_name" {
  description = "Connection name for the MySQL Cloud SQL instance"
  value       = google_sql_database_instance.mysql.connection_name
}

output "mysql_public_ip" {
  description = "Public IP address of the MySQL Cloud SQL instance"
  value       = google_sql_database_instance.mysql.public_ip_address
}

output "mysql_database_name" {
  description = "Name of the MySQL database"
  value       = google_sql_database.app_database.name
}

output "mysql_username" {
  description = "Username for the MySQL database"
  value       = google_sql_user.app_user.name
}

output "mysql_password" {
  description = "Password for the MySQL database"
  value       = random_password.db_password.result
  sensitive   = true
}
{% endif %}

{% if values.infraDatabase === 'postgresql' %}
output "postgresql_instance_name" {
  description = "Name of the PostgreSQL Cloud SQL instance"
  value       = google_sql_database_instance.postgresql.name
}

output "postgresql_connection_name" {
  description = "Connection name for the PostgreSQL Cloud SQL instance"
  value       = google_sql_database_instance.postgresql.connection_name
}

output "postgresql_public_ip" {
  description = "Public IP address of the PostgreSQL Cloud SQL instance"
  value       = google_sql_database_instance.postgresql.public_ip_address
}

output "postgresql_database_name" {
  description = "Name of the PostgreSQL database"
  value       = google_sql_database.app_database.name
}

output "postgresql_username" {
  description = "Username for the PostgreSQL database"
  value       = google_sql_user.app_user.name
}

output "postgresql_password" {
  description = "Password for the PostgreSQL database"
  value       = random_password.db_password.result
  sensitive   = true
}
{% endif %}

# Storage outputs
{% if values.infraStorage %}
output "storage_bucket_name" {
  description = "Name of the Cloud Storage bucket"
  value       = google_storage_bucket.app_bucket.name
}

output "storage_bucket_url" {
  description = "URL of the Cloud Storage bucket"
  value       = google_storage_bucket.app_bucket.url
}
{% endif %}

# General outputs
output "project_id" {
  description = "The GCP project ID"
  value       = var.project_id
}

output "region" {
  description = "The GCP region"
  value       = var.region
}

output "environment" {
  description = "The environment"
  value       = var.environment
}
{% endif %}
