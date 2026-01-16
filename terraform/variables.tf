# Variables Configuration

variable "aws_region" {
  description = "AWS region for deployment"
  type        = string
  default     = "us-east-1"
}

variable "environment" {
  description = "Environment name (development, staging, production)"
  type        = string
  default     = "development"
}

variable "project_name" {
  description = "Project name used for resource naming"
  type        = string
  default     = "file-tracker-v2"
}

variable "timezone" {
  description = "Timezone for servers"
  type        = string
  default     = "UTC"
}

# VPC Configuration
variable "vpc_cidr" {
  description = "CIDR block for VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "public_subnet_cidrs" {
  description = "CIDR blocks for public subnets"
  type        = list(string)
  default     = ["10.0.1.0/24", "10.0.2.0/24"]
}

variable "private_subnet_cidrs" {
  description = "CIDR blocks for private subnets"
  type        = list(string)
  default     = ["10.0.11.0/24", "10.0.12.0/24"]
}

variable "database_subnet_cidrs" {
  description = "CIDR blocks for database subnets"
  type        = list(string)
  default     = ["10.0.21.0/24", "10.0.22.0/24"]
}

# Security Configuration
variable "allowed_ssh_cidrs" {
  description = "CIDR blocks allowed to SSH to jumphost"
  type        = list(string)
  default     = ["0.0.0.0/0"] # IMPORTANT: Change this to your IP for production!
}

variable "ssh_public_key" {
  description = "SSH public key for EC2 instances"
  type        = string
  # You need to provide this value in terraform.tfvars
}

# EC2 Configuration
variable "jumphost_instance_type" {
  description = "Instance type for jumphost"
  type        = string
  default     = "t3.micro"
}

variable "app_instance_type" {
  description = "Instance type for application servers"
  type        = string
  default     = "t3.small"
}

# RDS Configuration
variable "db_instance_class" {
  description = "Instance class for RDS database"
  type        = string
  default     = "db.t3.micro"
}

variable "db_allocated_storage" {
  description = "Allocated storage for RDS in GB"
  type        = number
  default     = 20
}

variable "db_name" {
  description = "Initial database name"
  type        = string
  default     = "filetracker"
}

variable "db_master_username" {
  description = "Master username for RDS"
  type        = string
  default     = "admin"
  sensitive   = true
}

variable "db_master_password" {
  description = "Master password for RDS"
  type        = string
  sensitive   = true
  # You need to provide this value in terraform.tfvars
}

# Optional: SSL Certificate ARN for HTTPS
variable "ssl_certificate_arn" {
  description = "ARN of SSL certificate for HTTPS listener"
  type        = string
  default     = ""
}
