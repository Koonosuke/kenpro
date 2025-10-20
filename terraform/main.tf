# Recycle Point System - Main Terraform Configuration
# Enterprise-grade infrastructure management

terraform {
  required_version = ">= 1.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  # Remote state management for team collaboration
  # backend "s3" {
  #   # Configure in terraform.tfvars or environment variables
  #   # bucket = "your-terraform-state-bucket"
  #   # key    = "recycle-system/terraform.tfstate"
  #   # region = "us-east-1"
  # }
}

# Configure the AWS Provider
provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project     = "recycle-point-system"
      Environment = var.environment
      ManagedBy   = "terraform"
      Owner       = var.team_name
      CostCenter  = var.cost_center
    }
  }
}

# Data sources
data "aws_caller_identity" "current" {}
data "aws_region" "current" {}

# Local values for common configurations
locals {
  common_tags = {
    Project     = "recycle-point-system"
    Environment = var.environment
    ManagedBy   = "terraform"
    Owner       = var.team_name
    CostCenter  = var.cost_center
  }

  # Naming convention
  name_prefix = "${var.project_name}-${var.environment}"

  # DynamoDB table configurations (minimal for cost optimization)
  dynamodb_tables = {
    qr_tokens = {
      table_name = "${local.name_prefix}-qr-tokens"
      hash_key   = "token_id"
      attributes = [
        {
          name = "token_id"
          type = "S"
        }
      ]
      # GSI removed for cost optimization - will be added when needed
    }

    locations = {
      table_name = "${local.name_prefix}-locations"
      hash_key   = "location_id"
      attributes = [
        {
          name = "location_id"
          type = "S"
        }
      ]
    }

    recycle_events = {
      table_name = "${local.name_prefix}-recycle-events"
      hash_key   = "event_id"
      attributes = [
        {
          name = "event_id"
          type = "S"
        }
      ]
      # GSI removed for cost optimization - will be added when needed
    }

    users = {
      table_name = "${local.name_prefix}-users"
      hash_key   = "user_id"
      attributes = [
        {
          name = "user_id"
          type = "S"
        }
      ]
      # GSI removed for cost optimization - will be added when needed
    }

    points_ledger = {
      table_name = "${local.name_prefix}-points-ledger"
      hash_key   = "transaction_id"
      attributes = [
        {
          name = "transaction_id"
          type = "S"
        }
      ]
      # GSI removed for cost optimization - will be added when needed
    }

    rewards = {
      table_name = "${local.name_prefix}-rewards"
      hash_key   = "reward_id"
      attributes = [
        {
          name = "reward_id"
          type = "S"
        }
      ]
    }

  }
}
