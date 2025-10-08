# Production Environment Configuration
# Minimal configuration for cost optimization (same as dev for now)

# General Configuration
aws_region   = "us-east-1"
environment  = "production"
project_name = "recycle-system"
team_name    = "backend-team"
cost_center  = "engineering"

# Note: All DynamoDB tables use PAY_PER_REQUEST billing mode
# Note: Security, monitoring, and backup features are disabled for cost optimization
# These will be added in future phases as the system scales and requirements grow
