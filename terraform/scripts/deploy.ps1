# PowerShell Deployment script for Recycle Point System Infrastructure
# Enterprise-grade deployment automation for Windows

param(
    [Parameter(Position=0)]
    [ValidateSet("dev", "staging", "production")]
    [string]$Environment = "dev",
    
    [Parameter(Position=1)]
    [ValidateSet("deploy", "plan", "apply", "destroy")]
    [string]$Command = "deploy"
)

# Configuration
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$TerraformDir = Split-Path -Parent $ScriptDir

# Logging functions
function Write-Info {
    param([string]$Message)
    Write-Host "[INFO] $Message" -ForegroundColor Blue
}

function Write-Success {
    param([string]$Message)
    Write-Host "[SUCCESS] $Message" -ForegroundColor Green
}

function Write-Warning {
    param([string]$Message)
    Write-Host "[WARNING] $Message" -ForegroundColor Yellow
}

function Write-Error {
    param([string]$Message)
    Write-Host "[ERROR] $Message" -ForegroundColor Red
}

# Validation functions
function Test-AwsCredentials {
    try {
        $null = aws sts get-caller-identity 2>$null
        return $true
    }
    catch {
        return $false
    }
}

function Test-Terraform {
    try {
        $null = Get-Command terraform -ErrorAction Stop
        return $true
    }
    catch {
        return $false
    }
}

# Terraform functions
function Initialize-Terraform {
    Write-Info "Initializing Terraform..."
    Set-Location $TerraformDir
    
    terraform init `
        -backend-config="key=recycle-system/$Environment/terraform.tfstate" `
        -backend-config="region=ap-northeast-1"
    
    if ($LASTEXITCODE -eq 0) {
        Write-Success "Terraform initialized successfully"
    } else {
        Write-Error "Terraform initialization failed"
        exit 1
    }
}

function New-TerraformPlan {
    Write-Info "Creating Terraform plan for environment: $Environment"
    Set-Location $TerraformDir
    
    $VarFile = "environments/$Environment.tfvars"
    if (-not (Test-Path $VarFile)) {
        Write-Error "Variable file not found: $VarFile"
        exit 1
    }
    
    terraform plan `
        -var-file="$VarFile" `
        -out="terraform-$Environment.plan"
    
    if ($LASTEXITCODE -eq 0) {
        Write-Success "Terraform plan created successfully"
    } else {
        Write-Error "Terraform plan creation failed"
        exit 1
    }
}

function Invoke-TerraformApply {
    Write-Info "Applying Terraform configuration for environment: $Environment"
    Set-Location $TerraformDir
    
    $PlanFile = "terraform-$Environment.plan"
    if (-not (Test-Path $PlanFile)) {
        Write-Error "Plan file not found: $PlanFile"
        Write-Error "Please run 'terraform plan' first"
        exit 1
    }
    
    # Confirmation for production
    if ($Environment -eq "production") {
        Write-Warning "You are about to deploy to PRODUCTION environment!"
        $Confirm = Read-Host "Are you sure you want to continue? (yes/no)"
        if ($Confirm -ne "yes") {
            Write-Info "Deployment cancelled"
            exit 0
        }
    }
    
    terraform apply $PlanFile
    
    if ($LASTEXITCODE -eq 0) {
        Write-Success "Terraform applied successfully"
    } else {
        Write-Error "Terraform apply failed"
        exit 1
    }
}

function Remove-TerraformInfrastructure {
    Write-Warning "DESTROYING infrastructure for environment: $Environment"
    Set-Location $TerraformDir
    
    # Extra confirmation for destroy
    $Confirm = Read-Host "Are you absolutely sure you want to destroy all resources? (yes/no)"
    if ($Confirm -ne "yes") {
        Write-Info "Destroy cancelled"
        exit 0
    }
    
    $VarFile = "environments/$Environment.tfvars"
    terraform destroy -var-file="$VarFile" -auto-approve
    
    if ($LASTEXITCODE -eq 0) {
        Write-Success "Infrastructure destroyed successfully"
    } else {
        Write-Error "Infrastructure destroy failed"
        exit 1
    }
}

# Main deployment function
function Start-Deployment {
    Write-Info "Starting deployment for environment: $Environment"
    
    # Validation
    if (-not (Test-AwsCredentials)) {
        Write-Error "AWS credentials not configured or invalid"
        Write-Error "Please run 'aws configure' or set AWS environment variables"
        exit 1
    }
    
    if (-not (Test-Terraform)) {
        Write-Error "Terraform is not installed"
        exit 1
    }
    
    $TerraformVersion = terraform version -json | ConvertFrom-Json | Select-Object -ExpandProperty terraform_version
    Write-Info "Using Terraform version: $TerraformVersion"
    
    Initialize-Terraform
    New-TerraformPlan
    Invoke-TerraformApply
    
    Write-Success "Deployment completed successfully for environment: $Environment"
}

# Main script logic
switch ($Command) {
    "deploy" {
        Start-Deployment
    }
    "plan" {
        if (-not (Test-AwsCredentials)) {
            Write-Error "AWS credentials not configured or invalid"
            exit 1
        }
        if (-not (Test-Terraform)) {
            Write-Error "Terraform is not installed"
            exit 1
        }
        Initialize-Terraform
        New-TerraformPlan
    }
    "apply" {
        if (-not (Test-AwsCredentials)) {
            Write-Error "AWS credentials not configured or invalid"
            exit 1
        }
        if (-not (Test-Terraform)) {
            Write-Error "Terraform is not installed"
            exit 1
        }
        Initialize-Terraform
        Invoke-TerraformApply
    }
    "destroy" {
        if (-not (Test-AwsCredentials)) {
            Write-Error "AWS credentials not configured or invalid"
            exit 1
        }
        if (-not (Test-Terraform)) {
            Write-Error "Terraform is not installed"
            exit 1
        }
        Initialize-Terraform
        Remove-TerraformInfrastructure
    }
    default {
        Write-Error "Invalid command: $Command"
        Write-Host "Usage: .\deploy.ps1 [ENVIRONMENT] [COMMAND]"
        Write-Host "ENVIRONMENT: dev, staging, production (default: dev)"
        Write-Host "COMMAND: deploy, plan, apply, destroy (default: deploy)"
        exit 1
    }
}
