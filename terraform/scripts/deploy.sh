#!/bin/bash
# Deployment script for Recycle Point System Infrastructure
# Enterprise-grade deployment automation

set -e  # Exit on any error

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TERRAFORM_DIR="$(dirname "$SCRIPT_DIR")"
ENVIRONMENT=${1:-dev}

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Validation functions
validate_environment() {
    if [[ ! "$ENVIRONMENT" =~ ^(dev|staging|production)$ ]]; then
        log_error "Invalid environment: $ENVIRONMENT"
        log_error "Valid environments: dev, staging, production"
        exit 1
    fi
}

validate_aws_credentials() {
    if ! aws sts get-caller-identity > /dev/null 2>&1; then
        log_error "AWS credentials not configured or invalid"
        log_error "Please run 'aws configure' or set AWS environment variables"
        exit 1
    fi
}

validate_terraform() {
    if ! command -v terraform &> /dev/null; then
        log_error "Terraform is not installed"
        exit 1
    fi
    
    local terraform_version=$(terraform version -json | jq -r '.terraform_version')
    log_info "Using Terraform version: $terraform_version"
}

# Terraform functions
terraform_init() {
    log_info "Initializing Terraform..."
    cd "$TERRAFORM_DIR"
    
    terraform init \
        -backend-config="key=recycle-system/${ENVIRONMENT}/terraform.tfstate" \
        -backend-config="region=ap-northeast-1"
    
    log_success "Terraform initialized successfully"
}

terraform_plan() {
    log_info "Creating Terraform plan for environment: $ENVIRONMENT"
    cd "$TERRAFORM_DIR"
    
    local var_file="environments/${ENVIRONMENT}.tfvars"
    if [[ ! -f "$var_file" ]]; then
        log_error "Variable file not found: $var_file"
        exit 1
    fi
    
    terraform plan \
        -var-file="$var_file" \
        -out="terraform-${ENVIRONMENT}.plan"
    
    log_success "Terraform plan created successfully"
}

terraform_apply() {
    log_info "Applying Terraform configuration for environment: $ENVIRONMENT"
    cd "$TERRAFORM_DIR"
    
    local plan_file="terraform-${ENVIRONMENT}.plan"
    if [[ ! -f "$plan_file" ]]; then
        log_error "Plan file not found: $plan_file"
        log_error "Please run 'terraform plan' first"
        exit 1
    fi
    
    # Confirmation for production
    if [[ "$ENVIRONMENT" == "production" ]]; then
        log_warning "You are about to deploy to PRODUCTION environment!"
        read -p "Are you sure you want to continue? (yes/no): " confirm
        if [[ "$confirm" != "yes" ]]; then
            log_info "Deployment cancelled"
            exit 0
        fi
    fi
    
    terraform apply "$plan_file"
    
    log_success "Terraform applied successfully"
}

terraform_destroy() {
    log_warning "DESTROYING infrastructure for environment: $ENVIRONMENT"
    cd "$TERRAFORM_DIR"
    
    # Extra confirmation for destroy
    read -p "Are you absolutely sure you want to destroy all resources? (yes/no): " confirm
    if [[ "$confirm" != "yes" ]]; then
        log_info "Destroy cancelled"
        exit 0
    fi
    
    local var_file="environments/${ENVIRONMENT}.tfvars"
    terraform destroy -var-file="$var_file" -auto-approve
    
    log_success "Infrastructure destroyed successfully"
}

# Main deployment function
deploy() {
    log_info "Starting deployment for environment: $ENVIRONMENT"
    
    validate_environment
    validate_aws_credentials
    validate_terraform
    
    terraform_init
    terraform_plan
    terraform_apply
    
    log_success "Deployment completed successfully for environment: $ENVIRONMENT"
}

# Script usage
usage() {
    echo "Usage: $0 [ENVIRONMENT] [COMMAND]"
    echo ""
    echo "ENVIRONMENT: dev, staging, production (default: dev)"
    echo "COMMAND: deploy, plan, apply, destroy (default: deploy)"
    echo ""
    echo "Examples:"
    echo "  $0 dev deploy"
    echo "  $0 production plan"
    echo "  $0 staging destroy"
}

# Main script logic
main() {
    local command=${2:-deploy}
    
    case "$command" in
        deploy)
            deploy
            ;;
        plan)
            validate_environment
            validate_aws_credentials
            validate_terraform
            terraform_init
            terraform_plan
            ;;
        apply)
            validate_environment
            validate_aws_credentials
            validate_terraform
            terraform_init
            terraform_apply
            ;;
        destroy)
            validate_environment
            validate_aws_credentials
            validate_terraform
            terraform_init
            terraform_destroy
            ;;
        *)
            log_error "Invalid command: $command"
            usage
            exit 1
            ;;
    esac
}

# Run main function
main "$@"
