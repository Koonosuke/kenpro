# Development Environment Configuration
# Minimal configuration for cost optimization

# General Configuration
aws_region   = "ap-northeast-1"
environment  = "dev"
project_name = "recycle-system"
team_name    = "backend-team"
cost_center  = "engineering"

# Note: All DynamoDB tables use PAY_PER_REQUEST billing mode
# Note: Security, monitoring, and backup features are disabled for cost optimization
# These will be added in future phases as the system scales
