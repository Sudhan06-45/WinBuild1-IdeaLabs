#!/bin/bash
set -e

echo "Starting SQA Management System Backend..."
echo "Python version: $(python --version)"
echo "Current directory: $(pwd)"

# Ensure pip is up to date
python -m pip install --upgrade pip --quiet

# Install dependencies if not already installed
echo "Installing dependencies..."
pip install -r requirements.txt --quiet --no-cache-dir

echo "Dependencies installed. Starting application..."

# Start the FastAPI server with Uvicorn
python -m uvicorn main:app --host 0.0.0.0 --port 8000
