# Variables for Recycle Point System Infrastructure
# Environment-specific configurations

# General Configuration
variable "aws_region" {
  description = "AWS region for resources"
  type        = string
  default     = "ap-northeast-1"
}

variable "environment" {
  description = "Environment name (dev, staging, production)"
  type        = string
  validation {
    condition     = contains(["dev", "staging", "production"], var.environment)
    error_message = "Environment must be one of: dev, staging, production."
  }
}

variable "project_name" {
  description = "Name of the project"
  type        = string
  default     = "recycle-system"
}

variable "team_name" {
  description = "Name of the team responsible for this infrastructure"
  type        = string
  default     = "backend-team"
}

variable "cost_center" {
  description = "Cost center for billing and resource tracking"
  type        = string
  default     = "engineering"
}

# DynamoDB Configuration (simplified for cost optimization)
# Note: All tables use PAY_PER_REQUEST billing mode for cost optimization

# Security Configuration (simplified for cost optimization)
# Note: Security features will be added in future phases

# Monitoring Configuration (simplified for cost optimization)
# Note: Monitoring features will be added in future phases

# Backup Configuration (simplified for cost optimization)
# Note: Backup features will be added in future phases

# Network Configuration (for future use)
variable "vpc_id" {
  description = "VPC ID for resources that need VPC configuration"
  type        = string
  default     = ""
}

variable "subnet_ids" {
  description = "List of subnet IDs for resources that need subnet configuration"
  type        = list(string)
  default     = []
}

# Feature Flags
variable "enable_advanced_monitoring" {
  description = "Enable advanced monitoring features"
  type        = bool
  default     = false
}

variable "enable_xray_tracing" {
  description = "Enable X-Ray tracing for Lambda functions"
  type        = bool
  default     = false
}

# Resource Naming
variable "resource_name_prefix" {
  description = "Prefix for resource names"
  type        = string
  default     = ""
}

variable "resource_name_suffix" {
  description = "Suffix for resource names"
  type        = string
  default     = ""
}
