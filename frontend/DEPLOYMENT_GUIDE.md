# Frontend Deployment Guide for SQA-FE

## ✅ Build Completed
Your frontend is built and ready to deploy:
- **Build folder**: `dist/`
- **Deployment package**: `frontend-deploy.zip` (ready to deploy)
- **Backend API URL**: `https://sqa-be-g4bthxdncyhncags.uksouth-01.azurewebsites.net/api`

---

## Option 1: Deploy via Azure Portal (Easiest)

1. **Open Azure Portal**: https://portal.azure.com
2. **Navigate to your Web App**:
   - Go to Resource Groups → `RG-WinBuild1-IdeaLabs` → `SQA-FE`
3. **Go to Deployment Center** (left menu)
4. **Click "FTPS credentials" tab**
5. **Download the publish profile**:
   - Click "Download publish profile" button at the top
   - Save it as `SQA-FE.PublishSettings`
6. **Deploy using Kudu**:
   - Go to: https://sqa-fe.scm.azurewebsites.net/ZipDeployUI
   - Drag and drop `frontend-deploy.zip` to the browser window
   - Wait for deployment to complete

---

## Option 2: Get Deployment Credentials

### Step 1: Get Username and Password

1. **Open Azure Portal**: https://portal.azure.com
2. **Navigate to**: Resource Groups → `RG-WinBuild1-IdeaLabs` → `SQA-FE`
3. **Click "Deployment Center"** (left sidebar)
4. **Click "FTPS credentials"** tab at the top
5. **You'll see two types of credentials**:

   **Application Scope (Recommended)**:
   - Username: Starts with `$SQA-FE` (e.g., `$SQA-FE`)
   - Password: Click "Show password" and copy it
   
   **User Scope** (if you set it up):
   - Username: Your custom username
   - Password: Your custom password

6. **Copy both username and password**

### Step 2: Run Deployment Script

Open PowerShell in the frontend folder and run:
```powershell
cd "c:\Users\SudhanSuresh\OneDrive - WinWire\Desktop\sqa-management-system\frontend"
.\deploy.ps1
```

When prompted:
- **Username**: Paste the username (e.g., `$SQA-FE`)
- **Password**: Paste the password (it won't show on screen - that's normal)

---

## Option 3: Manual PowerShell Command

If you have the credentials, run this directly:

```powershell
cd "c:\Users\SudhanSuresh\OneDrive - WinWire\Desktop\sqa-management-system\frontend"

# Replace YOUR_USERNAME and YOUR_PASSWORD
$username = "$SQA-FE"  # Replace with actual username
$password = "YourPasswordHere"  # Replace with actual password

$base64AuthInfo = [Convert]::ToBase64String([Text.Encoding]::ASCII.GetBytes("$username`:$password"))
$headers = @{ Authorization = "Basic $base64AuthInfo" }

Invoke-RestMethod -Uri "https://sqa-fe.scm.azurewebsites.net/api/zipdeploy" `
    -Method POST `
    -InFile "frontend-deploy.zip" `
    -ContentType "application/zip" `
    -Headers $headers `
    -TimeoutSec 300

Write-Host "Deployment completed!"
Write-Host "Visit: https://sqa-fe.azurewebsites.net"
```

---

## Important Environment Variables

After deployment, make sure these are configured in Azure:

**Option A: Using Azure Portal**
1. Go to: `SQA-FE` → Configuration → Application settings
2. Add (if not exists):
   - Name: `VITE_API_URL`
   - Value: `https://sqa-be-g4bthxdncyhncags.uksouth-01.azurewebsites.net/api`
3. Click "Save"

**Note**: Since we built with the `.env` file already, the API URL is already baked into the build. You don't need to set it in Azure unless you want to change it later.

---

## Verify Deployment

After deployment, visit:
- **Frontend**: https://sqa-fe.azurewebsites.net
- **Backend API**: https://sqa-be-g4bthxdncyhncags.uksouth-01.azurewebsites.net/api/health

---

## Troubleshooting

### Issue: Can't find credentials
- Download the publish profile instead and use Option 1 (Kudu ZipDeploy UI)

### Issue: Authentication failed
- Make sure you copied the full username including `$` symbol
- Try resetting deployment credentials in Azure Portal

### Issue: App shows blank page
- Check browser console for errors
- Verify CORS is enabled on backend for frontend URL
- Check that backend API URL is correct

### Issue: Can't connect to backend
- Verify backend is running: https://sqa-be-g4bthxdncyhncags.uksouth-01.azurewebsites.net/api/health
- Check backend CORS settings include: `https://sqa-fe.azurewebsites.net`
