# DynamoDB Tables Configuration
# Minimal configuration for cost optimization

# Create DynamoDB tables using for_each loop for scalability
resource "aws_dynamodb_table" "tables" {
  for_each = local.dynamodb_tables

  name         = each.value.table_name
  billing_mode = "PAY_PER_REQUEST" # Always use on-demand for cost optimization
  hash_key     = each.value.hash_key

  # Attribute definitions
  dynamic "attribute" {
    for_each = each.value.attributes
    content {
      name = attribute.value.name
      type = attribute.value.type
    }
  }

  # Global Secondary Indexes (minimal for cost optimization)
  dynamic "global_secondary_index" {
    for_each = lookup(each.value, "global_secondary_indexes", [])
    content {
      name            = global_secondary_index.value.name
      hash_key        = global_secondary_index.value.hash_key
      projection_type = "KEYS_ONLY" # Minimal projection for cost savings
    }
  }

  # Basic tags only
  tags = merge(local.common_tags, {
    Name        = each.value.table_name
    TableType   = each.key
    Description = "DynamoDB table for ${each.key} data"
  })
}

# NOTE: Auto Scaling, CloudWatch Alarms, and SNS Topics are removed for cost optimization
# These will be added in future phases as the system scales

# Output values for other modules
output "dynamodb_table_names" {
  description = "Map of DynamoDB table names"
  value = {
    for key, table in aws_dynamodb_table.tables : key => table.name
  }
}

output "dynamodb_table_arns" {
  description = "Map of DynamoDB table ARNs"
  value = {
    for key, table in aws_dynamodb_table.tables : key => table.arn
  }
}
