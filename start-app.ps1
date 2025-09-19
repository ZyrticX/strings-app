# Base44 App Startup Script
# This script sets up and starts the Base44 app with Supabase

Write-Host "🚀 Starting Base44 App with Supabase..." -ForegroundColor Green

# Copy environment variables
Write-Host "📋 Setting up environment variables..." -ForegroundColor Yellow
Copy-Item "supabase.env" ".env" -Force

# Install dependencies if needed
if (!(Test-Path "node_modules")) {
    Write-Host "📦 Installing dependencies..." -ForegroundColor Yellow
    npm install
}

# Start the development server
Write-Host "🌐 Starting development server..." -ForegroundColor Yellow
Write-Host "Application will be available at: http://localhost:5173" -ForegroundColor Cyan

# Start the server
npm run dev
