#!/bin/bash
set -e

echo "🚀 Starting SQA Management System Backend..."

# Install dependencies if needed
if [ -f requirements.txt ]; then
    pip install -r requirements.txt --quiet
fi

# Start the FastAPI server with Gunicorn and Uvicorn workers
# Port 8000 is the default for Azure App Service Linux
gunicorn main:app \
    --workers 4 \
    --worker-class uvicorn.workers.UvicornWorker \
    --bind 0.0.0.0:8000 \
    --timeout 120 \
    --access-logfile - \
    --error-logfile -
