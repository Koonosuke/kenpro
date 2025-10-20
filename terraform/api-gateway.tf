resource "aws_api_gateway_rest_api" "main" {
  name        = "${local.name_prefix}-api"
  description = "REST API for recycle point system"

  endpoint_configuration {
    types = ["REGIONAL"]
  }

  tags = local.common_tags
}

resource "aws_api_gateway_resource" "locations" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  parent_id   = aws_api_gateway_rest_api.main.root_resource_id
  path_part   = "locations"
}

resource "aws_api_gateway_resource" "location_id" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  parent_id   = aws_api_gateway_resource.locations.id
  path_part   = "{location_id}"
}

resource "aws_api_gateway_resource" "rewards" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  parent_id   = aws_api_gateway_rest_api.main.root_resource_id
  path_part   = "rewards"
}

resource "aws_api_gateway_resource" "reward_id" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  parent_id   = aws_api_gateway_resource.rewards.id
  path_part   = "{rewardId}"
}

resource "aws_api_gateway_resource" "reward_exchange" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  parent_id   = aws_api_gateway_resource.reward_id.id
  path_part   = "exchange"
}

locals {
  lambda_integration_uri = "arn:aws:apigateway:${data.aws_region.current.name}:lambda:path/2015-03-31/functions"
}

#####################
# /locations routes #
#####################

resource "aws_api_gateway_method" "locations_get" {
  rest_api_id   = aws_api_gateway_rest_api.main.id
  resource_id   = aws_api_gateway_resource.locations.id
  http_method   = "GET"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "locations_get" {
  rest_api_id             = aws_api_gateway_rest_api.main.id
  resource_id             = aws_api_gateway_resource.locations.id
  http_method             = aws_api_gateway_method.locations_get.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = "${local.lambda_integration_uri}/${aws_lambda_function.locations.arn}/invocations"
}

resource "aws_api_gateway_method" "locations_options" {
  rest_api_id   = aws_api_gateway_rest_api.main.id
  resource_id   = aws_api_gateway_resource.locations.id
  http_method   = "OPTIONS"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "locations_options" {
  rest_api_id             = aws_api_gateway_rest_api.main.id
  resource_id             = aws_api_gateway_resource.locations.id
  http_method             = aws_api_gateway_method.locations_options.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = "${local.lambda_integration_uri}/${aws_lambda_function.locations.arn}/invocations"
}

resource "aws_api_gateway_method" "location_get" {
  rest_api_id   = aws_api_gateway_rest_api.main.id
  resource_id   = aws_api_gateway_resource.location_id.id
  http_method   = "GET"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "location_get" {
  rest_api_id             = aws_api_gateway_rest_api.main.id
  resource_id             = aws_api_gateway_resource.location_id.id
  http_method             = aws_api_gateway_method.location_get.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = "${local.lambda_integration_uri}/${aws_lambda_function.locations.arn}/invocations"
}

resource "aws_api_gateway_method" "location_options" {
  rest_api_id   = aws_api_gateway_rest_api.main.id
  resource_id   = aws_api_gateway_resource.location_id.id
  http_method   = "OPTIONS"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "location_options" {
  rest_api_id             = aws_api_gateway_rest_api.main.id
  resource_id             = aws_api_gateway_resource.location_id.id
  http_method             = aws_api_gateway_method.location_options.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = "${local.lambda_integration_uri}/${aws_lambda_function.locations.arn}/invocations"
}

####################
# /rewards routes  #
####################

resource "aws_api_gateway_method" "rewards_get" {
  rest_api_id   = aws_api_gateway_rest_api.main.id
  resource_id   = aws_api_gateway_resource.rewards.id
  http_method   = "GET"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "rewards_get" {
  rest_api_id             = aws_api_gateway_rest_api.main.id
  resource_id             = aws_api_gateway_resource.rewards.id
  http_method             = aws_api_gateway_method.rewards_get.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = "${local.lambda_integration_uri}/${aws_lambda_function.rewards.arn}/invocations"
}

resource "aws_api_gateway_method" "rewards_options" {
  rest_api_id   = aws_api_gateway_rest_api.main.id
  resource_id   = aws_api_gateway_resource.rewards.id
  http_method   = "OPTIONS"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "rewards_options" {
  rest_api_id             = aws_api_gateway_rest_api.main.id
  resource_id             = aws_api_gateway_resource.rewards.id
  http_method             = aws_api_gateway_method.rewards_options.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = "${local.lambda_integration_uri}/${aws_lambda_function.rewards.arn}/invocations"
}

resource "aws_api_gateway_method" "reward_get" {
  rest_api_id   = aws_api_gateway_rest_api.main.id
  resource_id   = aws_api_gateway_resource.reward_id.id
  http_method   = "GET"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "reward_get" {
  rest_api_id             = aws_api_gateway_rest_api.main.id
  resource_id             = aws_api_gateway_resource.reward_id.id
  http_method             = aws_api_gateway_method.reward_get.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = "${local.lambda_integration_uri}/${aws_lambda_function.rewards.arn}/invocations"
}

resource "aws_api_gateway_method" "reward_options" {
  rest_api_id   = aws_api_gateway_rest_api.main.id
  resource_id   = aws_api_gateway_resource.reward_id.id
  http_method   = "OPTIONS"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "reward_options" {
  rest_api_id             = aws_api_gateway_rest_api.main.id
  resource_id             = aws_api_gateway_resource.reward_id.id
  http_method             = aws_api_gateway_method.reward_options.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = "${local.lambda_integration_uri}/${aws_lambda_function.rewards.arn}/invocations"
}

resource "aws_api_gateway_method" "reward_exchange_post" {
  rest_api_id   = aws_api_gateway_rest_api.main.id
  resource_id   = aws_api_gateway_resource.reward_exchange.id
  http_method   = "POST"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "reward_exchange_post" {
  rest_api_id             = aws_api_gateway_rest_api.main.id
  resource_id             = aws_api_gateway_resource.reward_exchange.id
  http_method             = aws_api_gateway_method.reward_exchange_post.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = "${local.lambda_integration_uri}/${aws_lambda_function.rewards.arn}/invocations"
}

resource "aws_api_gateway_method" "reward_exchange_options" {
  rest_api_id   = aws_api_gateway_rest_api.main.id
  resource_id   = aws_api_gateway_resource.reward_exchange.id
  http_method   = "OPTIONS"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "reward_exchange_options" {
  rest_api_id             = aws_api_gateway_rest_api.main.id
  resource_id             = aws_api_gateway_resource.reward_exchange.id
  http_method             = aws_api_gateway_method.reward_exchange_options.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = "${local.lambda_integration_uri}/${aws_lambda_function.rewards.arn}/invocations"
}

#################
# Permissions   #
#################

resource "aws_lambda_permission" "allow_apigw_locations" {
  statement_id  = "AllowAPIGatewayInvokeLocations"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.locations.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.main.execution_arn}/*/*/locations*"
}

resource "aws_lambda_permission" "allow_apigw_rewards" {
  statement_id  = "AllowAPIGatewayInvokeRewards"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.rewards.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.main.execution_arn}/*/*/rewards*"
}

resource "aws_api_gateway_deployment" "main" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  stage_name  = "dev"

  depends_on = [
    aws_api_gateway_integration.locations_get,
    aws_api_gateway_integration.locations_options,
    aws_api_gateway_integration.location_get,
    aws_api_gateway_integration.location_options,
    aws_api_gateway_integration.rewards_get,
    aws_api_gateway_integration.rewards_options,
    aws_api_gateway_integration.reward_get,
    aws_api_gateway_integration.reward_options,
    aws_api_gateway_integration.reward_exchange_post,
    aws_api_gateway_integration.reward_exchange_options
  ]

  triggers = {
    redeploy = sha1(jsonencode({
      locations_get        = aws_api_gateway_integration.locations_get.uri
      location_get         = aws_api_gateway_integration.location_get.uri
      rewards_get          = aws_api_gateway_integration.rewards_get.uri
      reward_get           = aws_api_gateway_integration.reward_get.uri
      reward_exchange_post = aws_api_gateway_integration.reward_exchange_post.uri
    }))
  }
}

output "api_gateway_invoke_url" {
  description = "Invoke URL for the API Gateway dev stage"
  value       = "https://${aws_api_gateway_rest_api.main.id}.execute-api.${data.aws_region.current.name}.amazonaws.com/dev"
}
