# 🔧 Azure DevOps Deployment - Complete Setup Guide

## Getting Started with Azure Deployment

This guide walks you through every single step to deploy your SQA Management System to Azure using DevOps.

---

## 📋 What You Need Before Starting

1. **Azure Account** - Create free at [azure.microsoft.com](https://azure.microsoft.com/en-us/free/)
2. **Azure CLI** - Install from [Microsoft Learn](https://learn.microsoft.com/cli/azure/install-azure-cli)
3. **Azure DevOps Account** - Create free at [dev.azure.com](https://dev.azure.com)
4. **Git** - Your code repository (GitHub or Azure Repos)
5. **Code Editor** - VS Code or similar

---

## 🎯 Choose Your Path

### Path A: Fast Track (Automated)
→ Use automation scripts for quickest setup
→ Takes about 30-40 minutes total
→ See: **DEPLOYMENT_QUICK_REFERENCE.md**

### Path B: Step-by-Step (Manual)
→ Learn each component in detail
→ Takes about 60-90 minutes
→ See: **AZURE_DEPLOYMENT_GUIDE.md**

### Path C: Guided Checklist
→ checkbox-based step-by-step
→ Best for following along
→ See: **DEPLOYMENT_CHECKLIST.md**

---

## 🚀 Recommended: Fast Track (Automated)

### 1. Run Setup Script (10 minutes)

**Windows (PowerShell):**
```powershell
# Open PowerShell as Administrator
cd "c:\Users\SudhanSuresh\OneDrive - WinWire\Desktop\sqa-management-system\deployment"
.\setup-azure-resources.ps1
```

**Mac/Linux (Bash):**
```bash
cd sqa-management-system/deployment
chmod +x setup-azure-resources.sh
./setup-azure-resources.sh
```

**This script automatically creates:**
- ✅ Azure Resource Group
- ✅ Backend Web App (Python 3.11)
- ✅ Frontend Web App (Node.js 20)
- ✅ App Service Plans
- ✅ SQL Firewall Rules
- ✅ Application Settings

### 2. Download Publish Profiles (5 minutes)

1. Open Azure Portal: https://portal.azure.com
2. Search for: `sqa-backend-app-idealabs`
3. Click **Download publish profile** (top right corner)
4. Save as: `C:\Temp\backend-publish-profile.xml`

Repeat for frontend:
1. Search for: `sqa-frontend-app-idealabs`
2. Download and save: `C:\Temp\frontend-publish-profile.xml`

**⚠️ Keep these files secure!** They contain credentials.

### 3. Set Up Azure DevOps (20 minutes)

#### Step 3.1: Create Project
```
1. Go to dev.azure.com
2. Click "Create project"
3. Name: SQA-Management-System
4. Description: "SQA Management System - CI/CD Pipeline"
5. Visibility: Private
6. Version Control: Git
7. Click "Create"
```

#### Step 3.2: Connect Repository
```
Option A: Import from GitHub
1. Go to "Repos"
2. Click "Import"
3. Enter your GitHub repository URL
4. Click "Import"

Option B: Azure Repos
1. Clone the new repo
2. Add your code files
3. Commit and push to main branch
```

#### Step 3.3: Create Service Connection
```
1. Go to "Project Settings" (⚙️ icon)
2. Click "Service connections"
3. Click "New service connection"
4. Select "Azure Resource Manager"
5. Select "Service principal (automatic)"
6. Subscription: Choose your subscription
7. Resource group: sqa-management-rg
8. Connection name: Azure-SQA-Connection
9. Click "Save"
```

#### Step 3.4: Create Variable Group
```
1. Go to "Pipelines" → "Library"
2. Click "+ Variable group"
3. Name: sqa-backend-vars
4. Click "Add"

For each variable:
- Click "+ Add variable"
- Enter Name and Value
- If it's a PASSWORD or SECRET: Click lock icon 🔒
- Continue adding all variables

Variables to add:
Name: AZURE_SQL_SERVER
Value: sqaidealabs.database.windows.net

Name: AZURE_SQL_DATABASE
Value: idealabs

Name: AZURE_SQL_USERNAME
Value: sqaadmin

Name: AZURE_SQL_PASSWORD
Value: admin@123
🔒 MARK AS SECRET!

Name: AZURE_SQL_DRIVER
Value: ODBC Driver 17 for SQL Server

Name: JWT_SECRET
Value: your-super-secret-key-here
🔒 MARK AS SECRET!

Name: ENVIRONMENT
Value: production

5. Click "Save"
```

#### Step 3.5: Upload Secure Files
```
1. Go to "Pipelines" → "Library"
2. Click "Secure files"
3. Click "+ Secure file"
4. Select "backend-publish-profile.xml"
5. Click "Upload"
6. Repeat for "frontend-publish-profile.xml"
```

### 4. Create and Run Pipeline (10 minutes)

#### Step 4.1: Add Pipeline File to Repository
```
Your repository structure should look like:
sqa-management-system/
├── azure-pipelines.yml        ← Pipeline file
├── backend/
├── frontend/
├── deployment/
└── ...other files
```

If you don't have `azure-pipelines.yml`, copy it from the `deployment` folder to root.

#### Step 4.2: Commit Pipeline File
```bash
cd sqa-management-system
git add azure-pipelines.yml
git commit -m "Add Azure DevOps pipeline configuration"
git push origin main
```

#### Step 4.3: Create Pipeline in DevOps
```
1. Go to "Pipelines"
2. Click "Create Pipeline"
3. Select "Azure Repos Git"
4. Select your repository
5. Select "Existing Azure Pipelines YAML file"
6. Path: azure-pipelines.yml
7. Click "Continue"
8. Review the YAML (should show your pipeline)
9. Click "Save and run"
```

#### Step 4.4: Monitor Pipeline Execution
```
You'll see the pipeline running:

Build Stage:
- BuildBackend
  ✓ Use Python 3.11
  ✓ Install dependencies
  ✓ Run tests
  ✓ Archive backend

- BuildFrontend
  ✓ Use Node.js 20
  ✓ npm install
  ✓ npm run build
  ✓ Archive frontend

Deploy Stage:
- DeployBackend
  ✓ Download artifacts
  ✓ Deploy to App Service
  ✓ Configure settings
  ✓ Restart app

- DeployFrontend
  ✓ Download artifacts
  ✓ Deploy to App Service
  ✓ Configure settings
  ✓ Restart app

Verification:
✓ Health checks
✓ URL checks
```

### 5. Verify Deployment (5 minutes)

#### Test Backend API
```
Open in browser:
https://sqa-backend-app-idealabs.azurewebsites.net/docs

You should see Swagger UI with API documentation.
This means backend is running! ✅
```

#### Test Frontend
```
Open in browser:
https://sqa-frontend-app-idealabs.azurewebsites.net

You should see the login page.
This means frontend is running! ✅
```

#### Test Database Connection
```
1. Open Azure Portal
2. Go to SQL Server: sqaidealabs
3. Click "Query editor"
4. Run query:
   SELECT COUNT(*) FROM dbo.users;
5. Should return a number without errors ✅
```

#### Test Full Signup Flow
```
1. Go to frontend: https://sqa-frontend-app-idealabs.azurewebsites.net
2. Click "Sign Up"
3. Fill in:
   - Full Name: Test User
   - Email: test@example.com
   - Password: TestPass123
   - Confirm: TestPass123
4. Click "Create Account"

Expected result:
- ✓ Account created successfully
- ✓ Redirected to dashboard
- ✓ New user appears in database

Check database:
1. Go to Query editor
2. Run:
   SELECT * FROM dbo.users WHERE email = 'test@example.com';
3. Should show your user! ✅
```

---

## 🔄 Continuous Deployment Setup

### Automatic Deployment on Push

The pipeline is already configured to auto-deploy when you push to `main` branch.

To test:
```bash
# Make a small change
echo "# Updated" >> README.md

# Commit and push
git add README.md
git commit -m "Test auto-deployment"
git push origin main

# Watch DevOps → Pipelines
# New run should appear automatically
# Pipeline builds and deploys your changes
```

### Manual Redeployment

To redeploy without code changes:
```
1. Go to "Pipelines" → "SQA-Management-CI-CD"
2. Click "Run pipeline"
3. Select branch: main
4. Click "Run"
```

---

## 🐛 Troubleshooting

### Issue: "Service connection not found"
```
Solution:
1. Go to Project Settings
2. Check service connection exists: "Azure-SQA-Connection"
3. Click it → "Verify" button
4. Update pipeline YAML with correct name
```

### Issue: "Variable group not found"
```
Solution:
1. Go to Pipelines → Library
2. Ensure variable group exists: "sqa-backend-vars"
3. Verify all variables are set
4. Pipeline must reference group name exactly
```

### Issue: "Backend won't start"
```
Check logs:
1. Azure Portal → sqa-backend-app-idealabs
2. Click "Log stream"
3. Look for errors:
   - Missing environment variables → Check app settings
   - SQL connection failed → Check firewall rules
   - Module not found → Requirements.txt incomplete
```

### Issue: "Frontend won't load"
```
Check:
1. Browser console (F12)
2. Error messages about API
3. Check VITE_API_URL in frontend app settings
4. Should be: https://sqa-backend-app-idealabs.azurewebsites.net/api
```

### Issue: "Database connection failed"
```
Check:
1. Firewall rules in Azure SQL
2. Add rule: Name=AllowAzure, Start=0.0.0.0, End=0.0.0.0
3. Verify credentials in app settings
4. Test connection with SSMS locally
```

---

## 📊 What Gets Deployed

### Backend Deployment
```
Your backend code:
- main.py (FastAPI app)
- api/ (API routes)
- database/ (Database models)
- config/ (Settings)
- utils/ (Utilities)
- requirements.txt (Dependencies)

Gets deployed to:
- Azure Web App: sqa-backend-app-idealabs
- Runtime: Python 3.11
- Server: Gunicorn + Uvicorn
- Port: 8000 (internal) → 80/443 (external)
```

### Frontend Deployment
```
Your React app:
- src/ (React components)
- package.json (Dependencies)
- vite.config.ts (Build config)

Gets compiled to:
- dist/ (Production build)

Gets deployed to:
- Azure Web App: sqa-frontend-app-idealabs
- Runtime: Node.js 20
- Server: Serve (static file server)
- Port: 3000 (internal) → 80/443 (external)
```

### Database
```
Your Azure SQL:
- Server: sqaidealabs.database.windows.net
- Database: idealabs
- Tables: users, user_sessions, documents, etc.

Connected from:
- Backend via connection string
- SSMS or Query Editor for management
```

---

## 📈 Monitoring After Deployment

### View Application Logs
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

### Monitor Performance
```
Azure Portal:
1. Go to sqa-backend-app-idealabs
2. Click "Application Insights"
3. View:
   - Request rates
   - Response times
   - Error rates
   - Exceptions
```

### Set Up Alerts
```
Azure Portal:
1. Go to sqa-backend-app-idealabs
2. Click "Alerts"
3. Create alert for:
   - HTTP 5xx errors > 5 per 5 min
   - Response time > 2 seconds
   - Memory usage > 80%
```

---

## 🔐 Security Considerations

### Secrets Management
```
DO:
✓ Mark all passwords as SECRET in DevOps
✓ Use strong JWT secret (32+ characters)
✓ Rotate secrets every 90 days
✓ Enable HTTPS (automatic)

DON'T:
✗ Commit secrets to Git
✗ Share publish profiles
✗ Use weak passwords
✗ Disable firewall
```

### Firewall Rules
```
Your SQL Server has firewall rules:
- Allow Azure Services (0.0.0.0 → 0.0.0.0)
- This lets your web apps connect
- Blocks outside access automatically
```

### Network Security
```
Web Apps:
- Use HTTPS by default
- .azurewebsites.net domain included
- Automatic SSL certificates
```

---

## 💰 Cost Management

### Estimate
```
B2 Backend App: ~$50/month
B2 Frontend App: ~$50/month
Azure SQL (Standard): ~$40-100/month
Total: ~$140-200/month

Tips to reduce costs:
- Use B1 for dev/staging
- Scale down during off-hours
- Monitor usage regularly
- Delete unused resources
```

### Budget Alert
```
Azure Portal:
1. Go to Cost Management + Billing
2. Click "Budgets"
3. Create budget: $200/month
4. Get alerts at 50%, 75%, 100%
```

---

## ✨ Success Checklist

After following this guide, you should have:

- [ ] Azure resources created
- [ ] DevOps project set up
- [ ] Variable group configured
- [ ] Publish profiles uploaded
- [ ] Pipeline created
- [ ] Pipeline run successfully
- [ ] Backend responding at API endpoint
- [ ] Frontend loading in browser
- [ ] Database connection working
- [ ] Signup flow functional
- [ ] Auto-deployment configured
- [ ] Monitoring set up

---

## 🎓 Learning Resources

### More About DevOps Pipelines
- [Azure Pipelines Documentation](https://learn.microsoft.com/azure/devops/pipelines/)
- [YAML Schema Reference](https://learn.microsoft.com/azure/devops/pipelines/yaml-schema/)

### More About Azure Web Apps
- [App Service Documentation](https://learn.microsoft.com/azure/app-service/)
- [Deployment Best Practices](https://learn.microsoft.com/azure/app-service/deploy-best-practices)

### FastAPI Deployment
- [FastAPI Deployment Guide](https://fastapi.tiangolo.com/deployment/)
- [Uvicorn Documentation](https://www.uvicorn.org/)

### React Deployment
- [Vite Deployment](https://vitejs.dev/guide/static-deploy.html)
- [Azure Static Web Apps](https://learn.microsoft.com/azure/static-web-apps/)

---

## 📞 Getting Help

If you get stuck:

1. **Check logs:**
   - Azure Portal → App Service → Log stream
   - DevOps → Pipeline → Build/Deploy logs

2. **Use troubleshooting guide:**
   - See "Troubleshooting" section above

3. **Ask for help:**
   - Check Azure documentation
   - Review pipeline YAML syntax
   - Test components individually

---

**You're all set! Your application is now deployed to Azure! 🚀**

For questions or issues, refer back to the specific documentation files.

---

**Related Documentation:**
- 📖 AZURE_DEPLOYMENT_GUIDE.md - Detailed guide
- ✅ DEPLOYMENT_CHECKLIST.md - Checkbox version
- ⚡ DEPLOYMENT_QUICK_REFERENCE.md - Quick lookup
- 🔄 DATA_FLOW_AZURE_SQL.md - Data flow explanation
