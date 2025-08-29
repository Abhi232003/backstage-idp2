{% if values.provisionInfra %}# Database resources
{% if values.infraDatabase === 'mysql' %}
resource "google_sql_database_instance" "mysql" {
  name             = "${local.resource_prefix}-mysql-${random_id.suffix.hex}"
  database_version = "MYSQL_8_0"
  region           = var.region
  
  settings {
    tier = "db-f1-micro"
    
    ip_configuration {
      ipv4_enabled = true
      authorized_networks {
        name  = "all"
        value = "0.0.0.0/0"
      }
    }
    
    backup_configuration {
      enabled = true
    }
  }

  deletion_protection = false

  labels = local.labels
}

resource "google_sql_database" "app_database" {
  name     = var.service_name
  instance = google_sql_database_instance.mysql.name
}

resource "random_password" "db_password" {
  length  = 16
  special = true
}

resource "google_sql_user" "app_user" {
  name     = "${var.service_name}_user"
  instance = google_sql_database_instance.mysql.name
  password = random_password.db_password.result
}
{% endif %}

{% if values.infraDatabase === 'postgresql' %}
resource "google_sql_database_instance" "postgresql" {
  name             = "${local.resource_prefix}-postgres-${random_id.suffix.hex}"
  database_version = "POSTGRES_15"
  region           = var.region
  
  settings {
    tier = "db-f1-micro"
    
    ip_configuration {
      ipv4_enabled = true
      authorized_networks {
        name  = "all"
        value = "0.0.0.0/0"
      }
    }
    
    backup_configuration {
      enabled = true
    }
  }

  deletion_protection = false

  labels = local.labels
}

resource "google_sql_database" "app_database" {
  name     = var.service_name
  instance = google_sql_database_instance.postgresql.name
}

resource "random_password" "db_password" {
  length  = 16
  special = true
}

resource "google_sql_user" "app_user" {
  name     = "${var.service_name}_user"
  instance = google_sql_database_instance.postgresql.name
  password = random_password.db_password.result
}
{% endif %}

# Cloud Storage bucket
{% if values.infraStorage %}
resource "google_storage_bucket" "app_bucket" {
  name          = "${local.resource_prefix}-storage-${random_id.suffix.hex}"
  location      = var.region
  force_destroy = true

  uniform_bucket_level_access = true

  versioning {
    enabled = true
  }

  labels = local.labels
}

resource "google_storage_bucket_iam_member" "app_bucket_admin" {
  bucket = google_storage_bucket.app_bucket.name
  role   = "roles/storage.admin"
  member = "serviceAccount:${var.project_id}@appspot.gserviceaccount.com"
}
{% endif %}
{% endif %}
