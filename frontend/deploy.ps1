# Frontend Deployment Script for SQA-FE
# This script deploys the frontend to Azure Web App using Kudu API

$resourceGroup = "RG-WinBuild1-IdeaLabs"
$webAppName = "SQA-FE"
$zipFile = "frontend-deploy.zip"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Frontend Deployment for SQA-FE" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if zip file exists
if (-not (Test-Path $zipFile)) {
    Write-Host "Error: $zipFile not found!" -ForegroundColor Red
    exit 1
}

Write-Host "Deployment package found: $zipFile" -ForegroundColor Green
$fileSize = [math]::Round((Get-Item $zipFile).Length / 1MB, 2)
Write-Host "  Size: $fileSize MB" -ForegroundColor Gray
Write-Host ""

# Get deployment credentials
Write-Host "Please enter your Azure Web App deployment credentials:" -ForegroundColor Yellow
Write-Host "Find at: Azure Portal, SQA-FE, Deployment Center, Local Git/FTPS credentials" -ForegroundColor Gray
Write-Host ""

$username = Read-Host "Username"
$password = Read-Host "Password" -AsSecureString

# Convert secure string to plain text
$BSTR = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($password)
$plainPassword = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($BSTR)

# Create authorization header
$base64AuthInfo = [Convert]::ToBase64String([Text.Encoding]::ASCII.GetBytes(("$username`:$plainPassword")))
$headers = @{
    Authorization = "Basic $base64AuthInfo"
}

Write-Host ""
Write-Host "Deploying to Azure Web App..." -ForegroundColor Yellow

try {
    # Deploy using Kudu API
    $kuduUrl = "https://$webAppName.scm.azurewebsites.net/api/zipdeploy"
    
    Invoke-RestMethod -Uri $kuduUrl -Method POST -InFile $zipFile -ContentType "application/zip" -Headers $headers -TimeoutSec 300
    
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "Deployment completed successfully!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "Your app is available at:" -ForegroundColor Cyan
    Write-Host "https://$webAppName.azurewebsites.net" -ForegroundColor White
    Write-Host ""
    Write-Host "Backend API URL configured:" -ForegroundColor Cyan
    Write-Host "https://sqa-be-g4bthxdncyhncags.uksouth-01.azurewebsites.net/api" -ForegroundColor White
    Write-Host ""
}
catch {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Red
    Write-Host "Deployment failed!" -ForegroundColor Red
    Write-Host "========================================" -ForegroundColor Red
    Write-Host ""
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please verify:" -ForegroundColor Yellow
    Write-Host "1. Your deployment credentials are correct" -ForegroundColor Gray
    Write-Host "2. The web app SQA-FE exists in resource group RG-WinBuild1-IdeaLabs" -ForegroundColor Gray
    Write-Host "3. You have permissions to deploy to the web app" -ForegroundColor Gray
    exit 1
}
