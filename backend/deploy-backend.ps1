# Backend Deployment Script for Azure App Service
# This script packages and deploys the backend to Azure using Azure CLI

param(
    [Parameter(Mandatory=$false)]
    [string]$ResourceGroup = "sqa-management-rg",
    
    [Parameter(Mandatory=$false)]
    [string]$AppName = "SQA-Mangement-backend",
    
    [Parameter(Mandatory=$false)]
    [string]$BackendUrl = "sqa-be-g4bthxdncyhncags.uksouth-01.azurewebsites.net"
)

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  SQA Backend Deployment Script" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if Azure CLI is installed
$azCheck = Get-Command az -ErrorAction SilentlyContinue
if (-not $azCheck) {
    Write-Host "Error: Azure CLI not found. Please install from: https://learn.microsoft.com/cli/azure/install-azure-cli" -ForegroundColor Red
    exit 1
}
Write-Host "Azure CLI installed" -ForegroundColor Green

# Check if logged in to Azure
Write-Host "Checking Azure login status..." -ForegroundColor Yellow
$account = az account show 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "Not logged in to Azure. Running 'az login'..." -ForegroundColor Yellow
    az login
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Error: Azure login failed" -ForegroundColor Red
        exit 1
    }
}
Write-Host "Logged in to Azure" -ForegroundColor Green

# Get current directory
$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
$backendPath = $scriptPath
$projectRoot = Split-Path -Parent $backendPath

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  Step 1: Creating Deployment Package" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

# Create temporary directory for deployment
$tempDir = Join-Path $env:TEMP "backend-deploy-$(Get-Date -Format 'yyyyMMdd-HHmmss')"
New-Item -ItemType Directory -Path $tempDir -Force | Out-Null
Write-Host "Created temp directory: $tempDir" -ForegroundColor Green

# Copy backend files to temp directory
Write-Host "`nCopying backend files..." -ForegroundColor Yellow
$excludeItems = @('__pycache__', '*.pyc', '.pytest_cache', 'venv', '.venv', 'env', '.env', 'tests', '*.md', 'backend-deploy.zip', 'deploy-backend.ps1', '*.log')

Get-ChildItem -Path $backendPath | ForEach-Object {
    $item = $_
    $shouldExclude = $false
    
    foreach ($pattern in $excludeItems) {
        if ($item.Name -like $pattern) {
            $shouldExclude = $true
            break
        }
    }
    
    if (-not $shouldExclude) {
        Copy-Item -Path $_.FullName -Destination $tempDir -Recurse -Force -ErrorAction SilentlyContinue
        Write-Host "  Copied: $($_.Name)" -ForegroundColor Gray
    }
}

# Create zip file
$zipFile = Join-Path $projectRoot "backend-deploy-$(Get-Date -Format 'yyyyMMdd-HHmmss').zip"
Write-Host "`nCreating deployment package..." -ForegroundColor Yellow

if (Test-Path $zipFile) {
    Remove-Item $zipFile -Force
}

Add-Type -Assembly 'System.IO.Compression.FileSystem'
[System.IO.Compression.ZipFile]::CreateFromDirectory($tempDir, $zipFile)
Write-Host "Created: $zipFile" -ForegroundColor Green

# Get file size
$zipSize = (Get-Item $zipFile).Length / 1KB
Write-Host "  Package size: $([math]::Round($zipSize, 2)) KB" -ForegroundColor Gray

# Cleanup temp directory
Remove-Item -Path $tempDir -Recurse -Force
Write-Host "Cleaned up temp files" -ForegroundColor Green

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  Step 2: Deploying to Azure" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Resource Group: $ResourceGroup" -ForegroundColor Gray
Write-Host "  App Name: $AppName" -ForegroundColor Gray
Write-Host ""

# Deploy using Azure CLI
Write-Host "Deploying to Azure App Service..." -ForegroundColor Yellow
Write-Host "(This may take 2-3 minutes)" -ForegroundColor Gray
Write-Host ""

az webapp deployment source config-zip --resource-group $ResourceGroup --name $AppName --src $zipFile --timeout 600

if ($LASTEXITCODE -eq 0) {
    Write-Host "`nDeployment successful!" -ForegroundColor Green
} else {
    Write-Host "`nDeployment failed!" -ForegroundColor Red
    Write-Host "Check the deployment logs for details" -ForegroundColor Yellow
    exit 1
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  Step 3: Restarting App Service" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

az webapp restart --resource-group $ResourceGroup --name $AppName
Write-Host "App restarted" -ForegroundColor Green

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  Deployment Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Backend URL: https://$BackendUrl" -ForegroundColor Cyan
Write-Host ""
Write-Host "Verify deployment:" -ForegroundColor Yellow
Write-Host "  Health Check: https://$BackendUrl/api/health" -ForegroundColor Gray
Write-Host "  API Docs: https://$BackendUrl/docs" -ForegroundColor Gray
Write-Host ""
Write-Host "View logs:" -ForegroundColor Yellow
Write-Host "  az webapp log tail --resource-group $ResourceGroup --name $AppName" -ForegroundColor Gray
Write-Host ""
Write-Host "Deployment package saved: $zipFile" -ForegroundColor Gray
Write-Host ""
