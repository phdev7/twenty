######################
# Required Variables #
######################
variable "diexcrm_pgdb_admin_password" {
  type        = string
  description = "DiexCRM password for postgres database."
  sensitive   = true
}

variable "diexcrm_app_hostname" {
  type        = string
  description = "The protocol, DNS fully qualified hostname, and port used to access DiexCRM in your environment. Ex: https://crm.example.com:443"
}

######################
# Optional Variables #
######################
variable "diexcrm_app_name" {
  type        = string
  default     = "diexcrm"
  description = "A friendly name prefix to use for every component deployed."
}

variable "diexcrm_server_image" {
  type        = string
  default     = "diexcrm/diex:latest"
  description = "DiexCRM server image for the server deployment. This defaults to latest. This value is also used for the workers image."
}

variable "diexcrm_db_image" {
  type        = string
  default     = "diexcrm/diex-postgres-spilo:latest"
  description = "DiexCRM image for database deployment. This defaults to latest."
}

variable "diexcrm_server_replicas" {
  type        = number
  default     = 1
  description = "Number of replicas for the DiexCRM server deployment. This defaults to 1."
}

variable "diexcrm_worker_replicas" {
  type        = number
  default     = 1
  description = "Number of replicas for the DiexCRM worker deployment. This defaults to 1."
}

variable "diexcrm_db_replicas" {
  type        = number
  default     = 1
  description = "Number of replicas for the DiexCRM database deployment. This defaults to 1."
}

variable "diexcrm_server_data_mount_path" {
  type        = string
  default     = "/app/packages/diex-server/.local-storage"
  description = "DiexCRM mount path for servers application data. Defaults to '/app/packages/diex-server/.local-storage'."
}

variable "diexcrm_db_pv_path" {
  type        = string
  default     = ""
  description = "Local path to use to store the physical volume if using local storage on nodes."
}

variable "diexcrm_server_pv_path" {
  type        = string
  default     = ""
  description = "Local path to use to store the physical volume if using local storage on nodes."
}

variable "diexcrm_db_pv_capacity" {
  type        = string
  default     = "10Gi"
  description = "Storage capacity provisioned for database persistent volume."
}

variable "diexcrm_db_pvc_requests" {
  type        = string
  default     = "10Gi"
  description = "Storage capacity reservation for database persistent volume claim."
}

variable "diexcrm_server_pv_capacity" {
  type        = string
  default     = "10Gi"
  description = "Storage capacity provisioned for server persistent volume."
}

variable "diexcrm_server_pvc_requests" {
  type        = string
  default     = "10Gi"
  description = "Storage capacity reservation for server persistent volume claim."
}

variable "diexcrm_namespace" {
  type        = string
  default     = "diexcrm"
  description = "Namespace for all DiexCRM resources"
}

variable "diexcrm_redis_replicas" {
  type        = number
  default     = 1
  description = "Number of replicas for the DiexCRM Redis deployment. This defaults to 1."
}

variable "diexcrm_redis_image" {
  type        = string
  default     = "redis/redis-stack-server:latest"
  description = "DiexCRM image for Redis deployment. This defaults to latest."
}

variable "diexcrm_docker_data_mount_path" {
  type        = string
  default     = "/app/docker-data"
  description = "DiexCRM mount path for servers application data. Defaults to '/app/docker-data'."
}

variable "diexcrm_docker_data_pv_path" {
  type        = string
  default     = ""
  description = "Local path to use to store the physical volume if using local storage on nodes."
}

variable "diexcrm_docker_data_pv_capacity" {
  type        = string
  default     = "100Mi"
  description = "Storage capacity provisioned for server persistent volume."
}

variable "diexcrm_docker_data_pvc_requests" {
  type        = string
  default     = "100Mi"
  description = "Storage capacity reservation for server persistent volume claim."
}
