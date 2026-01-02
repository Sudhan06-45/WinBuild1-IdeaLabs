#!/bin/bash

# ============================================================================
# Azure Resources Setup Script for SQA Management System
# This script automates creation of all Azure resources needed for deployment
# ============================================================================

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'  # No Color

# ============================================================================
# Configuration Variables
# ============================================================================

RESOURCE_GROUP="sqa-management-rg"
LOCATION="eastus"
BACKEND_PLAN="sqa-backend-plan"
FRONTEND_PLAN="sqa-frontend-plan"
BACKEND_APP="sqa-backend-app-idealabs"
FRONTEND_APP="sqa-frontend-app-idealabs"
SQL_SERVER="sqaidealabs"
SQL_DATABASE="idealabs"
SQL_ADMIN="sqaadmin"
SQL_PASSWORD="admin@123"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Azure Setup for SQA Management System${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# ============================================================================
# Step 1: Check Prerequisites
# ============================================================================

echo -e "${YELLOW}[1/8] Checking Prerequisites...${NC}"

if ! command -v az &> /dev/null; then
    echo -e "${RED}❌ Azure CLI not installed!${NC}"
    echo "Install from: https://learn.microsoft.com/en-us/cli/azure/install-azure-cli"
    exit 1
fi

echo -e "${GREEN}✅ Azure CLI found${NC}"
echo ""

# ============================================================================
# Step 2: Login to Azure
# ============================================================================

echo -e "${YELLOW}[2/8] Logging into Azure...${NC}"
az account show > /dev/null 2>&1 || az login
ACCOUNT=$(az account show --query 'name' -o tsv)
echo -e "${GREEN}✅ Logged in as: $ACCOUNT${NC}"
echo ""

# ============================================================================
# Step 3: Create Resource Group
# ============================================================================

echo -e "${YELLOW}[3/8] Creating Resource Group...${NC}"
if az group exists --name "$RESOURCE_GROUP" | grep -q true; then
    echo -e "${GREEN}✅ Resource group already exists: $RESOURCE_GROUP${NC}"
else
    echo "Creating resource group: $RESOURCE_GROUP"
    az group create \
        --name "$RESOURCE_GROUP" \
        --location "$LOCATION"
    echo -e "${GREEN}✅ Resource group created${NC}"
fi
echo ""

# ============================================================================
# Step 4: Create App Service Plans
# ============================================================================

echo -e "${YELLOW}[4/8] Creating App Service Plans...${NC}"

# Backend Plan
echo "Creating backend plan: $BACKEND_PLAN"
az appservice plan create \
    --name "$BACKEND_PLAN" \
    --resource-group "$RESOURCE_GROUP" \
    --sku B2 \
    --is-linux \
    --number-of-workers 1 || echo "Plan may already exist"
echo -e "${GREEN}✅ Backend plan ready${NC}"

# Frontend Plan
echo "Creating frontend plan: $FRONTEND_PLAN"
az appservice plan create \
    --name "$FRONTEND_PLAN" \
    --resource-group "$RESOURCE_GROUP" \
    --sku B2 \
    --is-linux \
    --number-of-workers 1 || echo "Plan may already exist"
echo -e "${GREEN}✅ Frontend plan ready${NC}"
echo ""

# ============================================================================
# Step 5: Create Web Apps
# ============================================================================

echo -e "${YELLOW}[5/8] Creating Web App Services...${NC}"

# Backend Web App
echo "Creating backend web app: $BACKEND_APP"
az webapp create \
    --resource-group "$RESOURCE_GROUP" \
    --plan "$BACKEND_PLAN" \
    --name "$BACKEND_APP" \
    --runtime "PYTHON|3.11" \
    --runtime-version 3.11 || echo "App may already exist"
echo -e "${GREEN}✅ Backend app ready${NC}"

# Frontend Web App
echo "Creating frontend web app: $FRONTEND_APP"
az webapp create \
    --resource-group "$RESOURCE_GROUP" \
    --plan "$FRONTEND_PLAN" \
    --name "$FRONTEND_APP" \
    --runtime "NODE|20-lts" \
    --runtime-version 20 || echo "App may already exist"
echo -e "${GREEN}✅ Frontend app ready${NC}"
echo ""

# ============================================================================
# Step 6: Configure SQL Firewall Rules
# ============================================================================

echo -e "${YELLOW}[6/8] Configuring Azure SQL Firewall...${NC}"

# Allow Azure Services
echo "Adding firewall rule for Azure services..."
az sql server firewall-rule create \
    --resource-group "$RESOURCE_GROUP" \
    --server "$SQL_SERVER" \
    --name "AllowAzureServices" \
    --start-ip-address 0.0.0.0 \
    --end-ip-address 0.0.0.0 || echo "Rule may already exist"

echo -e "${GREEN}✅ SQL firewall configured${NC}"
echo ""

# ============================================================================
# Step 7: Configure Web App Settings
# ============================================================================

echo -e "${YELLOW}[7/8] Configuring Web App Settings...${NC}"

# Backend Configuration
echo "Configuring backend app settings..."
az webapp config appsettings set \
    --resource-group "$RESOURCE_GROUP" \
    --name "$BACKEND_APP" \
    --settings \
        WEBSITES_ENABLE_APP_SERVICE_STORAGE=false \
        SCM_DO_BUILD_DURING_DEPLOYMENT=true \
        PYTHON_ENABLE_GUNICORN_ONLY=true \
        PYTHON_VERSION=3.11 \
        AZURE_SQL_SERVER="$SQL_SERVER.database.windows.net" \
        AZURE_SQL_DATABASE="$SQL_DATABASE" \
        AZURE_SQL_USERNAME="$SQL_ADMIN" \
        AZURE_SQL_PASSWORD="$SQL_PASSWORD" \
        AZURE_SQL_DRIVER="ODBC Driver 17 for SQL Server" \
        JWT_SECRET="your-secret-key-change-me-production" \
        ENVIRONMENT="production"

echo -e "${GREEN}✅ Backend settings configured${NC}"

# Frontend Configuration
echo "Configuring frontend app settings..."
az webapp config appsettings set \
    --resource-group "$RESOURCE_GROUP" \
    --name "$FRONTEND_APP" \
    --settings \
        WEBSITES_ENABLE_APP_SERVICE_STORAGE=false \
        NODE_ENV=production \
        VITE_API_URL="https://$BACKEND_APP.azurewebsites.net/api"

echo -e "${GREEN}✅ Frontend settings configured${NC}"
echo ""

# ============================================================================
# Step 8: Display Resource Information
# ============================================================================

echo -e "${YELLOW}[8/8] Displaying Resource Information...${NC}"
echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}✅ AZURE RESOURCES CREATED SUCCESSFULLY${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "${BLUE}Resource Information:${NC}"
echo "================================"
echo "Resource Group: $RESOURCE_GROUP"
echo "Location: $LOCATION"
echo ""
echo -e "${BLUE}Backend:${NC}"
echo "  App Name: $BACKEND_APP"
echo "  URL: https://$BACKEND_APP.azurewebsites.net"
echo "  Docs: https://$BACKEND_APP.azurewebsites.net/docs"
echo "  Runtime: Python 3.11"
echo ""
echo -e "${BLUE}Frontend:${NC}"
echo "  App Name: $FRONTEND_APP"
echo "  URL: https://$FRONTEND_APP.azurewebsites.net"
echo "  Runtime: Node.js 20"
echo ""
echo -e "${BLUE}Database:${NC}"
echo "  Server: $SQL_SERVER.database.windows.net"
echo "  Database: $SQL_DATABASE"
echo "  Admin: $SQL_ADMIN"
echo ""
echo -e "${YELLOW}NEXT STEPS:${NC}"
echo "================================"
echo "1. Download publish profiles (see guide)"
echo "2. Set up Azure DevOps project"
echo "3. Configure service connection"
echo "4. Create variable group in DevOps"
echo "5. Upload publish profiles as secure files"
echo "6. Run azure-pipelines.yml"
echo ""
echo -e "${BLUE}Download Publish Profiles:${NC}"
echo "Backend: https://portal.azure.com → $BACKEND_APP → Download publish profile"
echo "Frontend: https://portal.azure.com → $FRONTEND_APP → Download publish profile"
echo ""
