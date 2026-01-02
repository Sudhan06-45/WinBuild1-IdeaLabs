# 🚀 Azure Deployment Guide - SQA Management System

## Complete Steps to Deploy Using Azure Web App + Azure DevOps with Publish Profile

---

## Phase 1: Prepare Azure Resources

### Step 1: Create Resource Group in Azure

```bash
# Go to Azure Portal: https://portal.azure.com
# Click "Create a resource" → search for "Resource Group"
# 
# Details:
# - Resource group name: sqa-management-rg
# - Region: East US (or your preferred region)
# - Click "Review + Create" → "Create"
```

**OR use Azure CLI:**
```bash
az group create \
  --name sqa-management-rg \
  --location eastus
```

---

### Step 2: Create App Service Plans

#### For Backend (Python FastAPI)
```bash
az appservice plan create \
  --name sqa-backend-plan \
  --resource-group sqa-management-rg \
  --sku B2 \
  --is-linux
```

#### For Frontend (React)
```bash
az appservice plan create \
  --name sqa-frontend-plan \
  --resource-group sqa-management-rg \
  --sku B2 \
  --is-linux
```

---

### Step 3: Create Web App Services

#### Backend Web App (Python)
```bash
az webapp create \
  --resource-group sqa-management-rg \
  --plan sqa-backend-plan \
  --name sqa-backend-app-<unique> \
  --runtime "PYTHON|3.11"
```

**Example: `sqa-backend-app-idealabs`**

#### Frontend Web App (Node.js)
```bash
az webapp create \
  --resource-group sqa-management-rg \
  --plan sqa-frontend-plan \
  --name sqa-frontend-app-<unique> \
  --runtime "NODE|20-lts"
```

**Example: `sqa-frontend-app-idealabs`**

---

### Step 4: Configure Azure SQL Firewall Rules

Your Azure SQL needs to allow connections from Azure Web Apps:

```bash
az sql server firewall-rule create \
  --resource-group sqa-management-rg \
  --server sqaidealabs \
  --name AllowAzureServices \
  --start-ip-address 0.0.0.0 \
  --end-ip-address 0.0.0.0
```

This allows all Azure services to connect to SQL Server.

---

## Phase 2: Download Publish Profiles

### For Backend Web App

1. Go to Azure Portal → Resource Groups → `sqa-management-rg`
2. Click on `sqa-backend-app-idealabs`
3. Click **"Download publish profile"** (top right)
4. Save as: `backend-publish-profile.xml`

### For Frontend Web App

1. Go to Azure Portal → Resource Groups → `sqa-management-rg`
2. Click on `sqa-frontend-app-idealabs`
3. Click **"Download publish profile"** (top right)
4. Save as: `frontend-publish-profile.xml`

**Store these securely!** ⚠️

---

## Phase 3: Set Up Azure DevOps

### Step 1: Create Azure DevOps Project

1. Go to: https://dev.azure.com
2. Create new project: `SQA-Management-System`
3. Choose Git (if not already a repo)
4. Click **Create**

### Step 2: Connect Your Repository

1. In Azure DevOps → **Repos**
2. Click **Import** (if code is on GitHub)
3. Fill in your GitHub repo URL
4. Click **Import**

OR 

Push your code to Azure Repos:
```bash
git remote add azure <your-azure-repos-url>
git push azure main
```

### Step 3: Create Service Connection

1. Go to **Project Settings** → **Service connections**
2. Click **New service connection** → **Azure Resource Manager**
3. Select **Service principal (automatic)**
4. Choose:
   - Subscription: Your Azure subscription
   - Resource group: `sqa-management-rg`
5. Name: `Azure-SQA-Connection`
6. Click **Save**

---

## Phase 4: Configure Publish Profiles in Azure DevOps

### Step 1: Add Publish Profiles as Secrets

1. Go to **Pipelines** → **Library**
2. Click **Secure files**
3. Click **+ Secure file**
4. Upload `backend-publish-profile.xml`
5. Repeat for `frontend-publish-profile.xml`

### Step 2: Create Variable Groups

1. Go to **Pipelines** → **Library**
2. Click **+ Variable group**
3. Create: `sqa-backend-vars`

Add variables:
```
AZURE_SQL_SERVER: sqaidealabs.database.windows.net
AZURE_SQL_DATABASE: idealabs
AZURE_SQL_USERNAME: sqaadmin
AZURE_SQL_PASSWORD: admin@123  (or use secret)
AZURE_SQL_DRIVER: ODBC Driver 17 for SQL Server
JWT_SECRET: your-secret-key-here
```

Mark sensitive variables as **Secret** 🔒

---

## Phase 5: Create Azure DevOps Pipeline

### Create `azure-pipelines.yml` in your repo root:

```yaml
trigger:
  branches:
    include:
      - main
      - develop
  paths:
    include:
      - backend/**
      - frontend/**
      - deployment/**

pool:
  vmImage: 'ubuntu-latest'

variables:
  - group: sqa-backend-vars
  backendAppName: 'sqa-backend-app-idealabs'
  frontendAppName: 'sqa-frontend-app-idealabs'
  resourceGroup: 'sqa-management-rg'

stages:
  # ============================
  # BUILD STAGE
  # ============================
  - stage: Build
    jobs:
      # Backend Build Job
      - job: BuildBackend
        displayName: 'Build Backend'
        steps:
          - task: UsePythonVersion@0
            inputs:
              versionSpec: '3.11'
            displayName: 'Use Python 3.11'

          - script: |
              python -m pip install --upgrade pip
              pip install -r requirements.txt
            workingDirectory: 'backend'
            displayName: 'Install Python dependencies'

          - script: |
              python -m pytest tests/ -v || true
            workingDirectory: 'backend'
            displayName: 'Run Python tests (optional)'

          - task: ArchiveFiles@2
            inputs:
              rootFolderOrFile: '$(System.DefaultWorkingDirectory)/backend'
              includeRootFolder: false
              archiveFile: '$(Build.ArtifactStagingDirectory)/backend.zip'
            displayName: 'Archive backend'

          - task: PublishBuildArtifacts@1
            inputs:
              pathToPublish: '$(Build.ArtifactStagingDirectory)'
              artifactName: 'drop'
              publishLocation: 'Container'

      # Frontend Build Job
      - job: BuildFrontend
        displayName: 'Build Frontend'
        steps:
          - task: NodeTool@0
            inputs:
              versionSpec: '20.x'
            displayName: 'Install Node.js'

          - script: |
              npm install
              npm run build
            workingDirectory: 'frontend'
            displayName: 'Build React app'

          - task: ArchiveFiles@2
            inputs:
              rootFolderOrFile: '$(System.DefaultWorkingDirectory)/frontend/dist'
              includeRootFolder: false
              archiveFile: '$(Build.ArtifactStagingDirectory)/frontend.zip'
            displayName: 'Archive frontend'

          - task: PublishBuildArtifacts@1
            inputs:
              pathToPublish: '$(Build.ArtifactStagingDirectory)'
              artifactName: 'drop'
              publishLocation: 'Container'

  # ============================
  # DEPLOY STAGE
  # ============================
  - stage: Deploy
    condition: succeeded()
    jobs:
      # Deploy Backend
      - deployment: DeployBackend
        displayName: 'Deploy Backend to Azure'
        environment: 'Production'
        strategy:
          runOnce:
            deploy:
              steps:
                - download: current
                  artifact: drop
                  displayName: 'Download artifacts'

                - task: DownloadSecureFile@1
                  inputs:
                    secureFile: 'backend-publish-profile.xml'
                  displayName: 'Download backend publish profile'

                - task: AzureWebApp@1
                  inputs:
                    azureSubscription: 'Azure-SQA-Connection'
                    appType: 'webAppLinux'
                    appName: '$(backendAppName)'
                    package: '$(Pipeline.Workspace)/drop/backend.zip'
                    deploymentMethod: 'zipDeploy'
                    appSettings: |
                      -WEBSITES_ENABLE_APP_SERVICE_STORAGE false
                      -SCM_DO_BUILD_DURING_DEPLOYMENT true
                      -PYTHON_VERSION 3.11
                  displayName: 'Deploy backend to App Service'

                - task: AzureAppServiceSettings@1
                  inputs:
                    azureSubscription: 'Azure-SQA-Connection'
                    appName: '$(backendAppName)'
                    resourceGroupName: '$(resourceGroup)'
                    appSettings: |
                      [
                        {
                          "name": "AZURE_SQL_SERVER",
                          "value": "$(AZURE_SQL_SERVER)",
                          "slotSetting": false
                        },
                        {
                          "name": "AZURE_SQL_DATABASE",
                          "value": "$(AZURE_SQL_DATABASE)",
                          "slotSetting": false
                        },
                        {
                          "name": "AZURE_SQL_USERNAME",
                          "value": "$(AZURE_SQL_USERNAME)",
                          "slotSetting": false
                        },
                        {
                          "name": "AZURE_SQL_PASSWORD",
                          "value": "$(AZURE_SQL_PASSWORD)",
                          "slotSetting": false
                        },
                        {
                          "name": "AZURE_SQL_DRIVER",
                          "value": "$(AZURE_SQL_DRIVER)",
                          "slotSetting": false
                        },
                        {
                          "name": "JWT_SECRET",
                          "value": "$(JWT_SECRET)",
                          "slotSetting": false
                        }
                      ]
                  displayName: 'Configure backend app settings'

      # Deploy Frontend
      - deployment: DeployFrontend
        displayName: 'Deploy Frontend to Azure'
        environment: 'Production'
        dependsOn: DeployBackend
        condition: succeeded()
        strategy:
          runOnce:
            deploy:
              steps:
                - download: current
                  artifact: drop
                  displayName: 'Download artifacts'

                - task: AzureWebApp@1
                  inputs:
                    azureSubscription: 'Azure-SQA-Connection'
                    appType: 'webAppLinux'
                    appName: '$(frontendAppName)'
                    package: '$(Pipeline.Workspace)/drop/frontend.zip'
                    deploymentMethod: 'zipDeploy'
                    appSettings: |
                      -WEBSITES_ENABLE_APP_SERVICE_STORAGE false
                      -SCM_DO_BUILD_DURING_DEPLOYMENT false
                      -NODE_ENV production
                  displayName: 'Deploy frontend to App Service'
```

---

## Phase 6: Set Up Backend Web App Configuration

### Step 1: Configure Environment Variables

1. Azure Portal → `sqa-backend-app-idealabs` → **Configuration**
2. Click **+ New application setting**

Add these settings:

| Name | Value |
|------|-------|
| `AZURE_SQL_SERVER` | `sqaidealabs.database.windows.net` |
| `AZURE_SQL_DATABASE` | `idealabs` |
| `AZURE_SQL_USERNAME` | `sqaadmin` |
| `AZURE_SQL_PASSWORD` | `admin@123` |
| `AZURE_SQL_DRIVER` | `ODBC Driver 17 for SQL Server` |
| `JWT_SECRET` | `your-secret-key-change-me-in-production` |
| `ENVIRONMENT` | `production` |

Click **Save**

### Step 2: Configure Startup Command

1. Go to **Configuration** → **General settings**
2. Set **Startup command**:
   ```
   gunicorn -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000 main:app
   ```

3. Click **Save**

### Step 3: Disable Local Git Deployment

1. Go to **Deployment** → **Deployment center**
2. Disconnect local Git (if exists)
3. Ensure connected to Azure DevOps

---

## Phase 7: Set Up Frontend Web App Configuration

### Step 1: Configure Startup Command

1. Azure Portal → `sqa-frontend-app-idealabs` → **Configuration**
2. Go to **General settings**
3. Set **Startup command**:
   ```
   npm install -g serve && serve -s dist -l 3000
   ```

4. Click **Save**

### Step 2: Configure CORS (if needed)

Frontend is hosted on different origin, update backend CORS:

```python
# In backend/main.py
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://sqa-frontend-app-idealabs.azurewebsites.net",
        "http://localhost:3000",
        "http://localhost:5173"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

---

## Phase 8: Create the Pipeline in Azure DevOps

### Step 1: Create New Pipeline

1. Go to Azure DevOps → **Pipelines** → **Create Pipeline**
2. Select **Azure Repos Git** (or GitHub)
3. Select your repository
4. Choose **Existing Azure Pipelines YAML file**
5. Path: `azure-pipelines.yml`
6. Click **Continue** → **Save and run**

### Step 2: Name Your Pipeline

- Name: `SQA-Management-CI-CD`
- Click **Save and run**

---

## Phase 9: Run the Deployment

### First Deployment

1. Azure DevOps → **Pipelines** → **SQA-Management-CI-CD**
2. Click **Run pipeline**
3. Select branch: `main`
4. Click **Run**

Monitor the pipeline:
- ✅ **Build stage**: Compiles backend and frontend
- ✅ **Deploy stage**: Deploys to Azure using publish profiles
- ✅ **App Service settings**: Configures environment variables

---

## Phase 10: Verify Deployment

### Backend Verification

1. Open: `https://sqa-backend-app-idealabs.azurewebsites.net/docs`
   - Should show Swagger UI
   - API is running ✅

2. Test signup endpoint:
   ```bash
   curl -X POST https://sqa-backend-app-idealabs.azurewebsites.net/api/auth/signup \
     -H "Content-Type: application/json" \
     -d '{"email": "test@example.com", "password": "SecurePass123", "full_name": "Test User"}'
   ```

### Frontend Verification

1. Open: `https://sqa-frontend-app-idealabs.azurewebsites.net`
   - Should load React app ✅
   - Login page displays ✅

### Database Verification

1. Connect to Azure SQL in SSMS:
   ```
   Server: sqaidealabs.database.windows.net
   Database: idealabs
   Username: sqaadmin
   Password: admin@123
   ```

2. Check if tables exist:
   ```sql
   SELECT * FROM INFORMATION_SCHEMA.TABLES 
   WHERE TABLE_SCHEMA = 'dbo'
   ```

3. Test signup creates user:
   - Sign up on frontend
   - Check `dbo.users` table for new record

---

## Phase 11: Configure Continuous Deployment

### Auto-deploy on Git Push

1. Azure DevOps → **Pipelines** → **SQA-Management-CI-CD**
2. Click **Edit**
3. Trigger is already set to `main` branch
4. Commit and push to trigger auto-deployment

```bash
git add .
git commit -m "Update deployment configuration"
git push origin main
```

Pipeline will run automatically! 🚀

---

## Phase 12: Monitor & Logs

### View Application Logs

**In Azure Portal:**
1. Go to Web App → **Log stream**
2. See real-time logs as requests come in

**In Azure DevOps:**
1. Go to **Pipelines** → **SQA-Management-CI-CD**
2. Click latest run
3. Review build and deploy logs

---

## Troubleshooting

### Backend Not Starting

**Check logs:**
```bash
# In Azure Portal, go to Web App → Log stream
# Look for errors like "Module not found", "Invalid connection string"
```

**Common issues:**

| Error | Solution |
|-------|----------|
| `No module named 'sqlalchemy'` | Requirements not installed during deploy |
| `Connection timeout to Azure SQL` | Firewall rules not configured |
| `Invalid connection string` | Environment variables not set |
| `Port already in use` | Use `0.0.0.0:8000` binding |

### Frontend Not Loading

**Check:**
1. Build log for compile errors
2. Ensure `dist` folder is created
3. Check CORS headers in browser console

---

## Architecture Diagram

```
GitHub/Azure Repos
        ↓
    Commit/Push
        ↓
Azure DevOps Pipeline (azure-pipelines.yml)
        ├─→ Build Backend (Python 3.11)
        │   ├─ Install dependencies
        │   ├─ Run tests
        │   └─ Create backend.zip
        │
        ├─→ Build Frontend (Node.js 20)
        │   ├─ npm install
        │   ├─ npm run build
        │   └─ Create frontend.zip
        │
        └─→ Deploy Stage
            ├─→ Deploy Backend Zip
            │   ├─ Download backend.zip
            │   ├─ Extract to Web App
            │   ├─ Set environment variables
            │   ├─ Start Uvicorn/Gunicorn
            │   └─ Backend Live ✅
            │
            └─→ Deploy Frontend Zip
                ├─ Download frontend.zip
                ├─ Extract to Web App
                ├─ Start Node.js server
                └─ Frontend Live ✅

Both apps connect to Azure SQL Database
```

---

## Summary

| Step | Action | Status |
|------|--------|--------|
| 1 | Create Azure resources (RG, plans, apps) | ⚪ Pending |
| 2 | Download publish profiles | ⚪ Pending |
| 3 | Set up Azure DevOps project | ⚪ Pending |
| 4 | Create service connection | ⚪ Pending |
| 5 | Add publish profiles as secure files | ⚪ Pending |
| 6 | Create variable group | ⚪ Pending |
| 7 | Create `azure-pipelines.yml` | ⚪ Pending |
| 8 | Configure Web App settings | ⚪ Pending |
| 9 | Create and run pipeline | ⚪ Pending |
| 10 | Verify deployment | ⚪ Pending |
| 11 | Enable auto-deployment | ⚪ Pending |

---

## Cost Estimate (Monthly)

- **B2 App Service Plan × 2**: ~$50/month each = $100
- **Azure SQL (Standard)**: ~$40-100/month depending on DTU
- **Total**: ~$140-200/month

---

## Next Steps

1. ✅ Create Azure resources (steps 1-4)
2. ✅ Set up Azure DevOps (steps 5-7)
3. ✅ Run pipeline (step 9)
4. ✅ Verify deployment (step 10)
5. ✅ Monitor & maintain

---

For questions or issues, check **Phase 12: Troubleshooting** section.

Good luck! 🚀
