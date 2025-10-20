data "archive_file" "locations_lambda" {
  type        = "zip"
  source_dir  = "${path.module}/../backend/lambda/locations"
  output_path = "${path.module}/locations-lambda.zip"
}

data "archive_file" "rewards_lambda" {
  type        = "zip"
  source_dir  = "${path.module}/../backend/lambda/rewards"
  output_path = "${path.module}/rewards-lambda.zip"
}

resource "aws_iam_role" "lambda_execution" {
  name = "${local.name_prefix}-lambda-execution-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
        Action = "sts:AssumeRole"
      }
    ]
  })

  tags = local.common_tags
}

resource "aws_iam_role_policy_attachment" "lambda_basic_execution" {
  role       = aws_iam_role.lambda_execution.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

resource "aws_iam_role_policy" "lambda_dynamodb_access" {
  name = "${local.name_prefix}-lambda-dynamodb-policy"
  role = aws_iam_role.lambda_execution.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "dynamodb:GetItem",
          "dynamodb:PutItem",
          "dynamodb:UpdateItem",
          "dynamodb:Query",
          "dynamodb:Scan"
        ]
        Resource = [
          aws_dynamodb_table.tables["locations"].arn,
          aws_dynamodb_table.tables["qr_tokens"].arn,
          aws_dynamodb_table.tables["recycle_events"].arn,
          aws_dynamodb_table.tables["users"].arn,
          aws_dynamodb_table.tables["points_ledger"].arn,
          aws_dynamodb_table.tables["rewards"].arn
        ]
      }
    ]
  })
}

resource "aws_lambda_function" "locations" {
  function_name    = "${local.name_prefix}-locations"
  runtime          = "nodejs18.x"
  handler          = "index.handler"
  role             = aws_iam_role.lambda_execution.arn
  filename         = data.archive_file.locations_lambda.output_path
  source_code_hash = data.archive_file.locations_lambda.output_base64sha256

  environment {
    variables = {
      LOCATIONS_TABLE_NAME = aws_dynamodb_table.tables["locations"].name
    }
  }

  tags = merge(local.common_tags, {
    Function = "locations"
  })
}

resource "aws_lambda_function" "rewards" {
  function_name    = "${local.name_prefix}-rewards"
  runtime          = "nodejs18.x"
  handler          = "index.handler"
  role             = aws_iam_role.lambda_execution.arn
  filename         = data.archive_file.rewards_lambda.output_path
  source_code_hash = data.archive_file.rewards_lambda.output_base64sha256

  environment {
    variables = {
      REWARDS_TABLE_NAME       = aws_dynamodb_table.tables["rewards"].name
      USERS_TABLE_NAME         = aws_dynamodb_table.tables["users"].name
      POINTS_LEDGER_TABLE_NAME = aws_dynamodb_table.tables["points_ledger"].name
    }
  }

  tags = merge(local.common_tags, {
    Function = "rewards"
  })
}
