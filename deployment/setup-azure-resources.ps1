# ============================================================================
# Azure Setup Script for Windows (PowerShell)
# ============================================================================

param(
    [string]$Subscription = "",
    [string]$Location = "eastus",
    [switch]$SkipLogin = $false
)

$ErrorActionPreference = "Stop"

# Colors for output
$colors = @{
    Red    = "Red"
    Green  = "Green"
    Yellow = "Yellow"
    Blue   = "Cyan"
    Gray   = "Gray"
}

# ============================================================================
# Configuration
# ============================================================================

$ResourceGroup = "sqa-management-rg"
$BackendPlan = "sqa-backend-plan"
$FrontendPlan = "sqa-frontend-plan"
$BackendApp = "sqa-backend-app-idealabs"
$FrontendApp = "sqa-frontend-app-idealabs"
$SqlServer = "sqaidealabs"
$SqlDatabase = "idealabs"
$SqlAdmin = "sqaadmin"
$SqlPassword = "admin@123"

Write-Host "======================================" -ForegroundColor $colors.Blue
Write-Host "Azure Setup for SQA Management System" -ForegroundColor $colors.Blue
Write-Host "======================================" -ForegroundColor $colors.Blue
Write-Host ""

# ============================================================================
# Step 1: Check Prerequisites
# ============================================================================

Write-Host "[1/8] Checking Prerequisites..." -ForegroundColor $colors.Yellow

$azExists = $null -ne (Get-Command az -ErrorAction SilentlyContinue)
if (-not $azExists) {
    Write-Host "❌ Azure CLI not installed!" -ForegroundColor $colors.Red
    Write-Host "Install from: https://learn.microsoft.com/en-us/cli/azure/install-azure-cli" -ForegroundColor $colors.Red
    exit 1
}

Write-Host "✅ Azure CLI found" -ForegroundColor $colors.Green
Write-Host ""

# ============================================================================
# Step 2: Login to Azure
# ============================================================================

if (-not $SkipLogin) {
    Write-Host "[2/8] Logging into Azure..." -ForegroundColor $colors.Yellow
    
    $account = az account show --query 'name' -o tsv 2>$null
    if (-not $account) {
        Write-Host "Opening Azure login page..." -ForegroundColor $colors.Yellow
        az login
    }
    
    $account = az account show --query 'name' -o tsv
    Write-Host "✅ Logged in as: $account" -ForegroundColor $colors.Green
} else {
    Write-Host "[2/8] Skipping login" -ForegroundColor $colors.Yellow
}
Write-Host ""

# ============================================================================
# Step 3: Create Resource Group
# ============================================================================

Write-Host "[3/8] Creating Resource Group..." -ForegroundColor $colors.Yellow

$rgExists = az group exists --name $ResourceGroup | ConvertFrom-Json
if ($rgExists) {
    Write-Host "✅ Resource group already exists: $ResourceGroup" -ForegroundColor $colors.Green
} else {
    Write-Host "Creating resource group: $ResourceGroup" -ForegroundColor $colors.Gray
    az group create `
        --name $ResourceGroup `
        --location $Location | Out-Null
    Write-Host "✅ Resource group created" -ForegroundColor $colors.Green
}
Write-Host ""

# ============================================================================
# Step 4: Create App Service Plans
# ============================================================================

Write-Host "[4/8] Creating App Service Plans..." -ForegroundColor $colors.Yellow

Write-Host "Creating backend plan: $BackendPlan" -ForegroundColor $colors.Gray
$backendPlanExists = az appservice plan list `
    --resource-group $ResourceGroup `
    --query "[?name=='$BackendPlan']" | ConvertFrom-Json

if ($backendPlanExists.Count -eq 0) {
    az appservice plan create `
        --name $BackendPlan `
        --resource-group $ResourceGroup `
        --sku B2 `
        --is-linux `
        --number-of-workers 1 | Out-Null
    Write-Host "✅ Backend plan created" -ForegroundColor $colors.Green
} else {
    Write-Host "✅ Backend plan already exists" -ForegroundColor $colors.Green
}

Write-Host "Creating frontend plan: $FrontendPlan" -ForegroundColor $colors.Gray
$frontendPlanExists = az appservice plan list `
    --resource-group $ResourceGroup `
    --query "[?name=='$FrontendPlan']" | ConvertFrom-Json

if ($frontendPlanExists.Count -eq 0) {
    az appservice plan create `
        --name $FrontendPlan `
        --resource-group $ResourceGroup `
        --sku B2 `
        --is-linux `
        --number-of-workers 1 | Out-Null
    Write-Host "✅ Frontend plan created" -ForegroundColor $colors.Green
} else {
    Write-Host "✅ Frontend plan already exists" -ForegroundColor $colors.Green
}
Write-Host ""

# ============================================================================
# Step 5: Create Web Apps
# ============================================================================

Write-Host "[5/8] Creating Web App Services..." -ForegroundColor $colors.Yellow

Write-Host "Creating backend web app: $BackendApp" -ForegroundColor $colors.Gray
$backendAppExists = az webapp list `
    --resource-group $ResourceGroup `
    --query "[?name=='$BackendApp']" | ConvertFrom-Json

if ($backendAppExists.Count -eq 0) {
    az webapp create `
        --resource-group $ResourceGroup `
        --plan $BackendPlan `
        --name $BackendApp `
        --runtime "PYTHON|3.11" | Out-Null
    Write-Host "✅ Backend app created" -ForegroundColor $colors.Green
} else {
    Write-Host "✅ Backend app already exists" -ForegroundColor $colors.Green
}

Write-Host "Creating frontend web app: $FrontendApp" -ForegroundColor $colors.Gray
$frontendAppExists = az webapp list `
    --resource-group $ResourceGroup `
    --query "[?name=='$FrontendApp']" | ConvertFrom-Json

if ($frontendAppExists.Count -eq 0) {
    az webapp create `
        --resource-group $ResourceGroup `
        --plan $FrontendPlan `
        --name $FrontendApp `
        --runtime "NODE|20-lts" | Out-Null
    Write-Host "✅ Frontend app created" -ForegroundColor $colors.Green
} else {
    Write-Host "✅ Frontend app already exists" -ForegroundColor $colors.Green
}
Write-Host ""

# ============================================================================
# Step 6: Configure SQL Firewall Rules
# ============================================================================

Write-Host "[6/8] Configuring Azure SQL Firewall..." -ForegroundColor $colors.Yellow

Write-Host "Adding firewall rule for Azure services..." -ForegroundColor $colors.Gray
try {
    az sql server firewall-rule create `
        --resource-group $ResourceGroup `
        --server $SqlServer `
        --name "AllowAzureServices" `
        --start-ip-address 0.0.0.0 `
        --end-ip-address 0.0.0.0 | Out-Null
    Write-Host "✅ Firewall rule created" -ForegroundColor $colors.Green
} catch {
    Write-Host "✅ Firewall rule may already exist" -ForegroundColor $colors.Green
}
Write-Host ""

# ============================================================================
# Step 7: Configure Web App Settings
# ============================================================================

Write-Host "[7/8] Configuring Web App Settings..." -ForegroundColor $colors.Yellow

Write-Host "Configuring backend app settings..." -ForegroundColor $colors.Gray
az webapp config appsettings set `
    --resource-group $ResourceGroup `
    --name $BackendApp `
    --settings `
        WEBSITES_ENABLE_APP_SERVICE_STORAGE=false `
        SCM_DO_BUILD_DURING_DEPLOYMENT=true `
        PYTHON_ENABLE_GUNICORN_ONLY=true `
        PYTHON_VERSION=3.11 `
        "AZURE_SQL_SERVER=$SqlServer.database.windows.net" `
        "AZURE_SQL_DATABASE=$SqlDatabase" `
        "AZURE_SQL_USERNAME=$SqlAdmin" `
        "AZURE_SQL_PASSWORD=$SqlPassword" `
        "AZURE_SQL_DRIVER=ODBC Driver 17 for SQL Server" `
        "JWT_SECRET=your-secret-key-change-me-production" `
        "ENVIRONMENT=production" | Out-Null
Write-Host "✅ Backend settings configured" -ForegroundColor $colors.Green

Write-Host "Configuring frontend app settings..." -ForegroundColor $colors.Gray
az webapp config appsettings set `
    --resource-group $ResourceGroup `
    --name $FrontendApp `
    --settings `
        WEBSITES_ENABLE_APP_SERVICE_STORAGE=false `
        NODE_ENV=production `
        "VITE_API_URL=https://$BackendApp.azurewebsites.net/api" | Out-Null
Write-Host "✅ Frontend settings configured" -ForegroundColor $colors.Green
Write-Host ""

# ============================================================================
# Step 8: Display Resource Information
# ============================================================================

Write-Host "[8/8] Displaying Resource Information..." -ForegroundColor $colors.Yellow
Write-Host ""
Write-Host "========================================" -ForegroundColor $colors.Green
Write-Host "✅ AZURE RESOURCES CREATED SUCCESSFULLY" -ForegroundColor $colors.Green
Write-Host "========================================" -ForegroundColor $colors.Green
Write-Host ""

Write-Host "Resource Information:" -ForegroundColor $colors.Blue
Write-Host "================================"
Write-Host "Resource Group: $ResourceGroup"
Write-Host "Location: $Location"
Write-Host ""

Write-Host "Backend:" -ForegroundColor $colors.Blue
Write-Host "  App Name: $BackendApp"
Write-Host "  URL: https://$BackendApp.azurewebsites.net"
Write-Host "  Docs: https://$BackendApp.azurewebsites.net/docs"
Write-Host "  Runtime: Python 3.11"
Write-Host ""

Write-Host "Frontend:" -ForegroundColor $colors.Blue
Write-Host "  App Name: $FrontendApp"
Write-Host "  URL: https://$FrontendApp.azurewebsites.net"
Write-Host "  Runtime: Node.js 20"
Write-Host ""

Write-Host "Database:" -ForegroundColor $colors.Blue
Write-Host "  Server: $SqlServer.database.windows.net"
Write-Host "  Database: $SqlDatabase"
Write-Host "  Admin: $SqlAdmin"
Write-Host ""

Write-Host "NEXT STEPS:" -ForegroundColor $colors.Yellow
Write-Host "================================"
Write-Host "1. Download publish profiles (see guide)"
Write-Host "2. Set up Azure DevOps project"
Write-Host "3. Configure service connection"
Write-Host "4. Create variable group in DevOps"
Write-Host "5. Upload publish profiles as secure files"
Write-Host "6. Run azure-pipelines.yml"
Write-Host ""

Write-Host "Download Publish Profiles:" -ForegroundColor $colors.Blue
Write-Host "Backend:  https://portal.azure.com → $BackendApp → Download publish profile"
Write-Host "Frontend: https://portal.azure.com → $FrontendApp → Download publish profile"
Write-Host ""

Write-Host "========================================" -ForegroundColor $colors.Green
Write-Host "Setup complete! Ready for deployment." -ForegroundColor $colors.Green
Write-Host "========================================" -ForegroundColor $colors.Green
