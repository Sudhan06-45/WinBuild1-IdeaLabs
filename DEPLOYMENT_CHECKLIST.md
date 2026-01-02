# 📋 Azure Deployment Checklist - Step by Step

## Complete Checklist for Deploying SQA Management System to Azure

---

## PHASE 1️⃣: Prepare Azure Resources

### A. Create Azure Resources (Auto or Manual)

#### Option 1: Automated Setup (Recommended)

**Windows (PowerShell):**
```powershell
# Open PowerShell
cd "c:\Users\SudhanSuresh\OneDrive - WinWire\Desktop\sqa-management-system\deployment"
.\setup-azure-resources.ps1
```

**Mac/Linux (Bash):**
```bash
cd sqa-management-system/deployment
chmod +x setup-azure-resources.sh
./setup-azure-resources.sh
```

✅ When complete, you'll have:
- ✓ Resource Group: `sqa-management-rg`
- ✓ Backend Plan: `sqa-backend-plan`
- ✓ Frontend Plan: `sqa-frontend-plan`
- ✓ Backend App: `sqa-backend-app-idealabs`
- ✓ Frontend App: `sqa-frontend-app-idealabs`
- ✓ SQL Firewall Rules: Configured

#### Option 2: Manual Setup via Azure Portal

1. **Create Resource Group**
   - [ ] Go to https://portal.azure.com
   - [ ] Click "Resource Groups"
   - [ ] Click "Create"
   - [ ] Name: `sqa-management-rg`
   - [ ] Region: East US
   - [ ] Click "Review + Create" → "Create"

2. **Create App Service Plans**
   - [ ] Create > App Service Plan
   - [ ] Name: `sqa-backend-plan`
   - [ ] Resource Group: `sqa-management-rg`
   - [ ] SKU: B2
   - [ ] Operating System: Linux
   
   - [ ] Repeat for Frontend: `sqa-frontend-plan`

3. **Create Web Apps**
   - [ ] Create > Web App
   - [ ] Name: `sqa-backend-app-idealabs`
   - [ ] Runtime: Python 3.11
   - [ ] Plan: `sqa-backend-plan`
   
   - [ ] Repeat for Frontend: `sqa-frontend-app-idealabs` (Runtime: Node.js 20)

4. **Configure SQL Firewall**
   - [ ] SQL Servers > sqaidealabs
   - [ ] Firewalls and virtual networks
   - [ ] Add rule: AllowAzureServices (0.0.0.0 to 0.0.0.0)

---

### B. Download Publish Profiles

**Backend Publish Profile:**
- [ ] Go to Azure Portal
- [ ] Search: `sqa-backend-app-idealabs`
- [ ] Click on it
- [ ] Click **"Download publish profile"** (top right)
- [ ] Save as: `backend-publish-profile.xml`
- [ ] Store securely!

**Frontend Publish Profile:**
- [ ] Go to Azure Portal
- [ ] Search: `sqa-frontend-app-idealabs`
- [ ] Click on it
- [ ] Click **"Download publish profile"** (top right)
- [ ] Save as: `frontend-publish-profile.xml`
- [ ] Store securely!

**Checklist:**
- [ ] Backend publish profile downloaded
- [ ] Frontend publish profile downloaded
- [ ] Both files saved in safe location

---

## PHASE 2️⃣: Set Up Azure DevOps

### A. Create Azure DevOps Project

- [ ] Go to https://dev.azure.com
- [ ] Click "New project"
- [ ] Name: `SQA-Management-System`
- [ ] Visibility: Private
- [ ] Version control: Git
- [ ] Click "Create"

### B. Set Up Git Repository

**Option 1: Import from GitHub (if applicable)**
- [ ] In DevOps → **Repos**
- [ ] Click "Import repository"
- [ ] Clone URL: (your GitHub URL)
- [ ] Click "Import"

**Option 2: Push to Azure Repos**
```bash
git remote add azure <your-azure-repos-url>
git push -u azure main
```

**Checklist:**
- [ ] Code is in Azure DevOps repository
- [ ] Main branch is set as default

### C. Create Service Connection

- [ ] Go to **Project Settings** (⚙️ bottom left)
- [ ] Click **"Service connections"**
- [ ] Click **"New service connection"**
- [ ] Select: **Azure Resource Manager**
- [ ] Authentication method: **Service principal (automatic)**
- [ ] Subscription: Your Azure subscription
- [ ] Resource group: `sqa-management-rg` (or leave empty)
- [ ] Connection name: `Azure-SQA-Connection`
- [ ] Click "Save"

**Verify:**
- [ ] Service connection shows "Verified" ✅

---

## PHASE 3️⃣: Configure Azure DevOps Pipeline

### A. Create Variable Group

- [ ] Go to **Pipelines** → **Library**
- [ ] Click **"+ Variable group"**
- [ ] Name: `sqa-backend-vars`
- [ ] Description: Backend configuration for SQA Management System

**Add Variables:**

| Variable | Value | Secret? |
|----------|-------|---------|
| `AZURE_SQL_SERVER` | `sqaidealabs.database.windows.net` | ❌ |
| `AZURE_SQL_DATABASE` | `idealabs` | ❌ |
| `AZURE_SQL_USERNAME` | `sqaadmin` | ❌ |
| `AZURE_SQL_PASSWORD` | `admin@123` | ✅ (lock icon) |
| `AZURE_SQL_DRIVER` | `ODBC Driver 17 for SQL Server` | ❌ |
| `JWT_SECRET` | `your-secret-key-change-me-production` | ✅ (lock icon) |
| `ENVIRONMENT` | `production` | ❌ |

**For each variable:**
- [ ] Click **"+ Add"**
- [ ] Enter name and value
- [ ] For PASSWORD and JWT_SECRET: **Click lock icon** 🔒
- [ ] Click "Save"

**Checklist:**
- [ ] Variable group `sqa-backend-vars` created
- [ ] 7 variables added
- [ ] Sensitive variables marked as secret (locked)
- [ ] Click "Save" at top right

### B. Upload Secure Files (Publish Profiles)

- [ ] Go to **Pipelines** → **Library**
- [ ] Click **"Secure files"**
- [ ] Click **"+ Secure file"**
- [ ] Select `backend-publish-profile.xml`
- [ ] Click "Upload"

- [ ] Repeat for `frontend-publish-profile.xml`

**Checklist:**
- [ ] `backend-publish-profile.xml` uploaded
- [ ] `frontend-publish-profile.xml` uploaded

### C. Configure Pipeline YAML

- [ ] Copy `azure-pipelines.yml` to root of repository:
  ```
  sqa-management-system/
  ├── azure-pipelines.yml  ← File should be here
  ├── backend/
  ├── frontend/
  └── deployment/
  ```

- [ ] Commit and push:
  ```bash
  git add azure-pipelines.yml
  git commit -m "Add Azure DevOps pipeline"
  git push origin main
  ```

**Checklist:**
- [ ] `azure-pipelines.yml` in repository root
- [ ] File committed and pushed to main branch

---

## PHASE 4️⃣: Create and Run Pipeline

### A. Create New Pipeline

- [ ] Go to **Pipelines** → **Create Pipeline**
- [ ] Select: **Azure Repos Git**
- [ ] Select your repository: `SQA-Management-System`
- [ ] Configure: **Existing Azure Pipelines YAML file**
- [ ] Path: `azure-pipelines.yml`
- [ ] Click **"Continue"**
- [ ] Review YAML (should show your pipeline)
- [ ] Click **"Save and run"**

### B. Run Initial Pipeline

- [ ] Pipeline will run automatically
- [ ] Watch the build progress:
  - [ ] **Build stage** starts
  - [ ] Backend build completes
  - [ ] Frontend build completes
  - [ ] **Deploy stage** starts (if on main branch)
  - [ ] Backend deployment completes
  - [ ] Frontend deployment completes

**View Pipeline Output:**
- [ ] Click on the running pipeline
- [ ] Click **"Build"** job to see details
- [ ] Look for success messages:
  ```
  ✅ Backend Build completed successfully
  ✅ Frontend Build completed successfully
  ```

**Checklist:**
- [ ] Pipeline created successfully
- [ ] Build stage passes
- [ ] Deploy stage runs (if on main)
- [ ] No errors in logs

---

## PHASE 5️⃣: Verify Deployment

### A. Check Backend

**Test Backend Health:**
- [ ] Open: `https://sqa-backend-app-idealabs.azurewebsites.net/health`
- [ ] Should return: `{"status": "healthy"}`

**View API Documentation:**
- [ ] Open: `https://sqa-backend-app-idealabs.azurewebsites.net/docs`
- [ ] Should show: Swagger UI with API endpoints
- [ ] Backend is running ✅

**Check Application Settings:**
- [ ] Azure Portal → `sqa-backend-app-idealabs`
- [ ] Go to **Configuration** → **Application settings**
- [ ] Verify these are set:
  - [ ] `AZURE_SQL_SERVER`
  - [ ] `AZURE_SQL_DATABASE`
  - [ ] `AZURE_SQL_USERNAME`
  - [ ] `AZURE_SQL_PASSWORD`
  - [ ] `JWT_SECRET`
  - [ ] `ENVIRONMENT` = `production`

**View Backend Logs:**
- [ ] Azure Portal → `sqa-backend-app-idealabs`
- [ ] Go to **Log stream**
- [ ] Should show:
  ```
  ☁️ Using Azure SQL database (production)
  ✅ Database connection established
  INFO: Uvicorn running on http://0.0.0.0:8000
  ```

### B. Check Frontend

**Test Frontend:**
- [ ] Open: `https://sqa-frontend-app-idealabs.azurewebsites.net`
- [ ] Should show: Login page
- [ ] Frontend is running ✅

**Check Console for Errors:**
- [ ] Open browser DevTools (F12)
- [ ] Go to **Console** tab
- [ ] Should NOT see errors about API connection
- [ ] If error about API: Check VITE_API_URL setting

**View Frontend Logs:**
- [ ] Azure Portal → `sqa-frontend-app-idealabs`
- [ ] Go to **Log stream**
- [ ] Should see Node.js startup messages

### C. Check Database Connection

**Using Azure Portal:**
- [ ] Go to SQL Server: `sqaidealabs`
- [ ] Open **Query editor**
- [ ] Query:
  ```sql
  SELECT COUNT(*) FROM dbo.users;
  ```
- [ ] Should return: A number (0 or more)
- [ ] Database connection works ✅

**Using SSMS (SQL Server Management Studio):**
```
Server: sqaidealabs.database.windows.net
Database: idealabs
Username: sqaadmin
Password: admin@123
Encrypt: true
```

**Checklist:**
- [ ] Backend responds to health check
- [ ] Swagger docs load
- [ ] Frontend page loads
- [ ] No console errors in browser
- [ ] Database query executes

---

## PHASE 6️⃣: Test End-to-End

### A. Test Signup Flow

1. **Open Frontend:**
   - [ ] Go to `https://sqa-frontend-app-idealabs.azurewebsites.net`

2. **Create Account:**
   - [ ] Click "Sign Up"
   - [ ] Fill in:
     - Full Name: `Test User`
     - Email: `test@example.com`
     - Password: `TestPass123`
     - Confirm: `TestPass123`
   - [ ] Click "Create Account"

3. **Verify Success:**
   - [ ] Should redirect to Dashboard
   - [ ] Token stored in localStorage
   - [ ] User data displayed (if profile visible)

4. **Check Database:**
   - [ ] Open Azure Query Editor
   - [ ] Query:
     ```sql
     SELECT TOP 5 email, full_name, created_at 
     FROM dbo.users 
     ORDER BY created_at DESC;
     ```
   - [ ] Should show: `test@example.com` in results ✅

**Checklist:**
- [ ] Signup form works
- [ ] No errors on submission
- [ ] Redirects to dashboard
- [ ] User appears in database
- [ ] End-to-end flow works ✅

---

## PHASE 7️⃣: Configure Continuous Deployment

### A. Set Up Auto-Deploy

- [ ] Go to **Pipelines** → **SQA-Management-CI-CD**
- [ ] Click **"Edit"**
- [ ] Verify trigger is set to main branch:
  ```yaml
  trigger:
    branches:
      include:
        - main
  ```

### B. Test Auto-Deploy

**Make a small change and push:**
```bash
# Make any small change to code
git add .
git commit -m "Test auto-deployment"
git push origin main
```

**Pipeline should run automatically:**
- [ ] Go to **Pipelines**
- [ ] New run should appear automatically
- [ ] Monitor pipeline execution
- [ ] Should complete and deploy

**Checklist:**
- [ ] Trigger configured for main branch
- [ ] Push to main triggers pipeline
- [ ] Deployment happens automatically

---

## PHASE 8️⃣: Monitoring and Maintenance

### A. Monitor Application

**Weekly Checks:**
- [ ] Check application health: `https://<app>.azurewebsites.net/health`
- [ ] Review error logs in Azure Portal
- [ ] Check Azure SQL performance in Azure Portal
- [ ] Verify backups are running

**Monthly Tasks:**
- [ ] Review application metrics
- [ ] Check costs in Azure Portal
- [ ] Update dependencies (npm, pip)
- [ ] Run security scans

### B. Troubleshooting

**If backend not starting:**
1. [ ] Check logs in Azure Portal → Log stream
2. [ ] Verify environment variables are set
3. [ ] Check SQL connection string format
4. [ ] Restart web app (Restart button)

**If frontend not loading:**
1. [ ] Check browser console for errors
2. [ ] Verify VITE_API_URL setting
3. [ ] Check frontend logs in Azure Portal
4. [ ] Clear browser cache

**If database connection fails:**
1. [ ] Check SQL firewall rules
2. [ ] Verify credentials in app settings
3. [ ] Test connection with SSMS
4. [ ] Check if SQL server is running

---

## 📊 Summary Checklist

### Resources Created
- [ ] Resource Group: `sqa-management-rg`
- [ ] Backend Web App: `sqa-backend-app-idealabs`
- [ ] Frontend Web App: `sqa-frontend-app-idealabs`
- [ ] App Service Plans (Backend + Frontend)
- [ ] SQL Firewall Rules Configured

### Azure DevOps Configured
- [ ] Project created
- [ ] Repository connected
- [ ] Service connection created
- [ ] Variable group created
- [ ] Secure files uploaded
- [ ] Pipeline YAML added
- [ ] Pipeline created and ran

### Verified & Tested
- [ ] Backend is running
- [ ] Frontend is running
- [ ] Database connection works
- [ ] Signup flow works end-to-end
- [ ] Auto-deployment configured

### Ready for Production
- [ ] Environment variables set
- [ ] Secrets marked as private
- [ ] Logs monitored
- [ ] Backup configured
- [ ] SSL certificate active (automatic with .azurewebsites.net)

---

## 🎯 You Are Now Deployed! 🚀

**Your application is live at:**
- 🔗 Frontend: `https://sqa-frontend-app-idealabs.azurewebsites.net`
- 🔗 Backend API: `https://sqa-backend-app-idealabs.azurewebsites.net`
- 📚 API Docs: `https://sqa-backend-app-idealabs.azurewebsites.net/docs`
- 💾 Database: `sqaidealabs.database.windows.net`

---

## 📞 Support

If you encounter issues:
1. Check the troubleshooting section
2. Review Azure Portal logs
3. Check Azure DevOps pipeline logs
4. Verify all settings match this guide

---

## ⏱️ Time Estimates

| Phase | Duration |
|-------|----------|
| 1. Create Resources | 10-15 min |
| 2. Set Up DevOps | 10 min |
| 3. Configure Pipeline | 10 min |
| 4. Create & Run Pipeline | 10-15 min |
| 5. Verify | 5 min |
| 6. Test End-to-End | 5 min |
| **Total** | **50-60 minutes** |

---

**Good luck with your deployment! 🚀**
