# 🚀 Quick Deployment Reference

## One-Page Quick Start for Azure Deployment

### Prerequisites
- ✅ Azure subscription ([Create free account](https://azure.microsoft.com/en-us/free/))
- ✅ Azure CLI installed ([Install](https://learn.microsoft.com/en-us/cli/azure/install-azure-cli))
- ✅ Azure DevOps account ([Create](https://dev.azure.com))
- ✅ Git repository (GitHub or Azure Repos)

---

## 🎯 5-Step Deployment

### Step 1: Create Azure Resources (10 min)

**Windows:**
```powershell
cd deployment
.\setup-azure-resources.ps1
```

**Mac/Linux:**
```bash
cd deployment
chmod +x setup-azure-resources.sh
./setup-azure-resources.sh
```

✅ Creates:
- Resource Group
- Web Apps (Backend + Frontend)
- App Service Plans
- Firewall Rules

---

### Step 2: Download Publish Profiles (5 min)

1. Go to **Azure Portal** → Resource Group `sqa-management-rg`
2. Click on **Backend App** → **Download publish profile**
3. Click on **Frontend App** → **Download publish profile**
4. Save both files securely

---

### Step 3: Set Up Azure DevOps (15 min)

#### 3a. Create Project
1. Go to **dev.azure.com**
2. Create new project: `SQA-Management-System`
3. Import your repository

#### 3b. Create Service Connection
1. **Project Settings** → **Service connections**
2. **New service connection** → **Azure Resource Manager**
3. Name: `Azure-SQA-Connection`
4. Choose your subscription and resource group

#### 3c. Create Variable Group
1. **Pipelines** → **Library** → **Variable group**
2. Name: `sqa-backend-vars`
3. Add variables:
   ```
   AZURE_SQL_SERVER = sqaidealabs.database.windows.net
   AZURE_SQL_DATABASE = idealabs
   AZURE_SQL_USERNAME = sqaadmin
   AZURE_SQL_PASSWORD = admin@123 (mark as SECRET 🔒)
   AZURE_SQL_DRIVER = ODBC Driver 17 for SQL Server
   JWT_SECRET = your-secret-key (mark as SECRET 🔒)
   ENVIRONMENT = production
   ```

#### 3d. Upload Publish Profiles
1. **Pipelines** → **Library** → **Secure files**
2. Upload `backend-publish-profile.xml`
3. Upload `frontend-publish-profile.xml`

---

### Step 4: Create Pipeline (10 min)

1. **Pipelines** → **Create Pipeline**
2. Select **Azure Repos Git**
3. Choose your repository
4. Select **Existing Azure Pipelines YAML file**
5. Path: `azure-pipelines.yml`
6. Click **Save and run**

Pipeline automatically:
- ✅ Builds Backend (Python)
- ✅ Builds Frontend (React)
- ✅ Deploys to Azure
- ✅ Configures app settings
- ✅ Restarts apps

---

### Step 5: Verify Deployment (5 min)

#### Check Backend
```
https://sqa-backend-app-idealabs.azurewebsites.net/docs
```
Should show Swagger UI ✅

#### Check Frontend
```
https://sqa-frontend-app-idealabs.azurewebsites.net
```
Should show login page ✅

#### Test Signup
1. Go to frontend
2. Create account
3. Check database - new user should appear

---

## 📋 Quick Commands

### View Pipeline Status
```bash
az pipelines list --project SQA-Management-System
az pipelines runs list --pipeline-ids <id>
```

### Check App Settings
```bash
az webapp config appsettings list \
  --resource-group sqa-management-rg \
  --name sqa-backend-app-idealabs
```

### View Logs
```bash
# Backend logs
az webapp log tail \
  --resource-group sqa-management-rg \
  --name sqa-backend-app-idealabs

# Frontend logs
az webapp log tail \
  --resource-group sqa-management-rg \
  --name sqa-frontend-app-idealabs
```

### Restart App
```bash
az webapp restart \
  --resource-group sqa-management-rg \
  --name sqa-backend-app-idealabs
```

---

## 🔐 Security Checklist

- [ ] Change JWT_SECRET to strong random value in production
- [ ] Rotate SQL password every 90 days
- [ ] Mark all passwords as SECRET in DevOps
- [ ] Enable Azure SQL firewall
- [ ] Enable HTTPS (automatic with .azurewebsites.net)
- [ ] Configure IP whitelist if needed
- [ ] Enable Application Insights for monitoring

---

## 🆘 Troubleshooting

### Backend Won't Start
```bash
# Check logs
az webapp log tail --resource-group sqa-management-rg --name sqa-backend-app-idealabs

# Common issues:
# - Missing environment variables
# - SQL connection string incorrect
# - ODBC driver not installed
```

### Frontend Won't Load
- [ ] Check browser console (F12)
- [ ] Verify VITE_API_URL setting
- [ ] Check frontend app logs
- [ ] Clear browser cache

### Database Connection Failed
- [ ] Verify SQL firewall allows Azure services
- [ ] Check credentials in app settings
- [ ] Test with SSMS locally
- [ ] Check SQL server is running (may be paused)

---

## 📊 Cost Estimate

| Resource | SKU | Cost/Month |
|----------|-----|-----------|
| Backend Web App | B2 | ~$50 |
| Frontend Web App | B2 | ~$50 |
| Azure SQL | Standard | ~$40-100 |
| **Total** | | **~$140-200** |

💡 Start with B1 for development, upgrade to B2 for production

---

## 🎯 URLs Reference

| Service | URL |
|---------|-----|
| Frontend | `https://sqa-frontend-app-idealabs.azurewebsites.net` |
| Backend API | `https://sqa-backend-app-idealabs.azurewebsites.net` |
| API Docs | `https://sqa-backend-app-idealabs.azurewebsites.net/docs` |
| Health Check | `https://sqa-backend-app-idealabs.azurewebsites.net/health` |
| Azure Portal | `https://portal.azure.com` |
| DevOps | `https://dev.azure.com` |
| SQL Server | `sqaidealabs.database.windows.net` |

---

## 📚 Full Documentation

For detailed step-by-step instructions, see:
- **AZURE_DEPLOYMENT_GUIDE.md** - Complete guide
- **DEPLOYMENT_CHECKLIST.md** - Checkbox-based checklist
- **azure-pipelines.yml** - Pipeline configuration
- **DATA_FLOW_AZURE_SQL.md** - Data flow diagram

---

## ⏱️ Timeline

| Phase | Time |
|-------|------|
| Create resources | 10 min |
| Download profiles | 5 min |
| Set up DevOps | 15 min |
| Create pipeline | 10 min |
| Verify | 5 min |
| **Total** | **45 min** |

---

## ✅ Post-Deployment

After deployment:
- [ ] Test all API endpoints
- [ ] Test signup → database flow
- [ ] Monitor logs for errors
- [ ] Set up alerts
- [ ] Configure backups
- [ ] Document any changes
- [ ] Brief team on deployment

---

## 🔗 Useful Links

- [Azure Portal](https://portal.azure.com)
- [Azure DevOps](https://dev.azure.com)
- [Azure CLI Reference](https://learn.microsoft.com/cli/azure/)
- [FastAPI Deployment](https://fastapi.tiangolo.com/deployment/)
- [React Deployment](https://react.dev/learn/start-a-new-react-project)
- [Azure SQL Docs](https://learn.microsoft.com/en-us/azure/azure-sql/)

---

**Questions? Check the full guide or troubleshooting section!** 🚀
