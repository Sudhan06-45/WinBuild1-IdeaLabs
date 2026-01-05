# Backend Deployment Package

## 📦 Package Created: backend-deploy.zip (34.27 KB)

### What's Inside:
- ✅ All API routes (auth, agents, documents, health)
- ✅ Database models and connection
- ✅ Agent implementations (code, test, requirements, documentation)
- ✅ Utilities (JWT, LLM, security)
- ✅ Configuration with environment settings
- ✅ Requirements.txt with all dependencies
- ✅ Startup.sh for Azure Web App
- ✅ CORS configured for https://sqa-fe.azurewebsites.net

### Backend App Name
**SQA-BE** (or whatever your backend web app is named)

---

## 🚀 Deploy to Azure

### Method 1: Browser (Kudu ZipDeploy UI)
1. Open: `https://sqa-be-g4bthxdncyhncags.uksouth-01.azurewebsites.net/ZipDeployUI`
2. Drag & drop: `backend-deploy.zip`
3. Wait for deployment to complete

### Method 2: PowerShell (Kudu API)
```powershell
cd "c:\Users\SudhanSuresh\OneDrive - WinWire\Desktop\sqa-management-system\backend"

# You'll need deployment credentials from Azure Portal
# Portal > your backend app > Deployment Center > FTPS credentials

$username = Read-Host "Username (e.g., `$your-backend-app)"
$password = Read-Host "Password" -AsSecureString
$BSTR = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($password)
$plainPassword = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($BSTR)

$base64AuthInfo = [Convert]::ToBase64String([Text.Encoding]::ASCII.GetBytes("$username`:$plainPassword"))
$headers = @{ Authorization = "Basic $base64AuthInfo" }

Invoke-RestMethod -Uri "https://sqa-be-g4bthxdncyhncags.uksouth-01.azurewebsites.net/ZipDeployUI" `
    -Method POST `
    -InFile "backend-deploy.zip" `
    -ContentType "application/zip" `
    -Headers $headers `
    -TimeoutSec 600

Write-Host "Deployment completed!"
```

---

## ⚙️ Required Environment Variables in Azure

After deployment, configure these in Azure Portal:
**Portal > your backend app > Configuration > Application settings**

### Required Settings:

```env
# Database
AZURE_SQL_SERVER=your-server.database.windows.net
AZURE_SQL_DATABASE=your-database-name
AZURE_SQL_USERNAME=your-username
AZURE_SQL_PASSWORD=your-password
AZURE_SQL_DRIVER=ODBC Driver 18 for SQL Server

# Security
SECRET_KEY=your-secret-key-for-app
JWT_SECRET_KEY=your-jwt-secret-key-for-tokens
JWT_ALGORITHM=HS256
JWT_EXPIRATION_HOURS=24

# Azure OpenAI
AZURE_OPENAI_API_KEY=your-azure-openai-key
AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com/
AZURE_OPENAI_DEPLOYMENT=gpt-4

# App Settings
DEBUG=False
```

### Startup Command
Set the startup command in Azure:
**Portal > your backend app > Configuration > General settings > Startup Command**

```bash
bash startup.sh
```

Or use:
```bash
gunicorn main:app --workers 4 --worker-class uvicorn.workers.UvicornWorker --bind=0.0.0.0:8000 --timeout 600
```

---

## ✅ Verify Deployment

After deployment, test these endpoints:

1. **Health Check**: 
   `https://sqa-be-g4bthxdncyhncags.uksouth-01.azurewebsites.net/api/health`
   
2. **API Docs**: 
   `https://sqa-be-g4bthxdncyhncags.uksouth-01.azurewebsites.net/docs`

---

## 🔗 Frontend Integration

The frontend at `https://sqa-fe.azurewebsites.net` is already configured to use this backend.

CORS is configured to allow:
- https://sqa-fe.azurewebsites.net
- http://localhost:5173 (for local development)

---

## 📝 Important Notes

1. **Database Connection**: Make sure your Azure SQL database firewall allows Azure services
2. **ODBC Driver**: Azure Web App (Linux) has ODBC Driver 18 pre-installed
3. **Gunicorn**: Required for production Python apps on Azure Web App
4. **Environment Variables**: Must be set in Azure Portal, not in .env files

---

## Troubleshooting

### App won't start
- Check Application Insights or Log Stream in Azure Portal
- Verify startup command is set correctly
- Check that all required environment variables are set

### Database connection fails
- Verify Azure SQL firewall rules
- Check connection string format
- Ensure ODBC Driver 18 is specified

### CORS errors
- Verify frontend URL in CORS_ORIGINS setting
- Check that both http and https versions are listed if needed
