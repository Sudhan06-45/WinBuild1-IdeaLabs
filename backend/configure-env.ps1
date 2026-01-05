# Configure Backend Environment Variables in Azure
# Run this script to set all required environment variables for the backend

$ResourceGroup = "RG-WinBuild1-IdeaLabs"
$BackendAppName = "SQA-Mangement-backend"

Write-Host "Configuring environment variables for $BackendAppName..." -ForegroundColor Cyan

# Set environment variables
az webapp config appsettings set `
    --resource-group $ResourceGroup `
    --name $BackendAppName `
    --settings `
        "SCM_DO_BUILD_DURING_DEPLOYMENT=true" `
        "ENABLE_ORYX_BUILD=true" `
        "DEBUG=False" `
        "JWT_ALGORITHM=HS256" `
        "JWT_EXPIRATION_HOURS=24" `
        "AZURE_OPENAI_DEPLOYMENT=gpt-4"

Write-Host "`nEnvironment variables configured!" -ForegroundColor Green
Write-Host "`nIMPORTANT: You still need to set these sensitive values manually in Azure Portal:" -ForegroundColor Yellow
Write-Host "  - SECRET_KEY" -ForegroundColor Gray
Write-Host "  - JWT_SECRET_KEY" -ForegroundColor Gray
Write-Host "  - AZURE_OPENAI_API_KEY" -ForegroundColor Gray
Write-Host "  - AZURE_OPENAI_ENDPOINT" -ForegroundColor Gray
Write-Host "  - AZURE_SQL_SERVER" -ForegroundColor Gray
Write-Host "  - AZURE_SQL_DATABASE" -ForegroundColor Gray
Write-Host "  - AZURE_SQL_USERNAME" -ForegroundColor Gray
Write-Host "  - AZURE_SQL_PASSWORD" -ForegroundColor Gray
Write-Host "  - AZURE_SQL_DRIVER" -ForegroundColor Gray
Write-Host "`nGo to: https://portal.azure.com" -ForegroundColor Cyan
Write-Host "Navigate to: $BackendAppName > Configuration > Application settings" -ForegroundColor Cyan
