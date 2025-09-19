# Supabase Setup Helper Script
# This script helps you set up Supabase connection

Write-Host "🚀 Supabase Setup Helper" -ForegroundColor Green
Write-Host "=========================" -ForegroundColor Green
Write-Host ""

# Check if .env file exists
if (Test-Path ".env") {
    Write-Host "✅ Found .env file" -ForegroundColor Green
} else {
    Write-Host "📋 Creating .env file from template..." -ForegroundColor Yellow
    Copy-Item "supabase.env" ".env"
    Write-Host "✅ .env file created" -ForegroundColor Green
}

Write-Host ""
Write-Host "📝 Current environment configuration:" -ForegroundColor Cyan
if (Test-Path ".env") {
    $envContent = Get-Content ".env"
    foreach ($line in $envContent) {
        if ($line -match "VITE_SUPABASE_URL=(.*)") {
            $url = $matches[1]
            if ($url -like "*127.0.0.1*" -or $url -like "*localhost*") {
                Write-Host "   📍 Supabase URL: $url (LOCAL - needs updating)" -ForegroundColor Yellow
            } else {
                Write-Host "   📍 Supabase URL: $url (CONFIGURED)" -ForegroundColor Green
            }
        }
        if ($line -match "VITE_SUPABASE_ANON_KEY=(.*)") {
            $key = $matches[1]
            if ($key -like "*demo*") {
                Write-Host "   🔑 Anon Key: Demo key (needs updating)" -ForegroundColor Yellow
            } else {
                Write-Host "   🔑 Anon Key: Configured" -ForegroundColor Green
            }
        }
    }
} else {
    Write-Host "   ⚠️ No .env file found" -ForegroundColor Red
}

Write-Host ""
Write-Host "🔧 Next Steps:" -ForegroundColor Cyan
Write-Host "1. Go to https://supabase.com and create a new project" -ForegroundColor White
Write-Host "2. Get your Project URL and API keys from Settings > API" -ForegroundColor White
Write-Host "3. Update your .env file with real credentials" -ForegroundColor White
Write-Host "4. Run the database migration in Supabase SQL Editor" -ForegroundColor White
Write-Host "5. Restart your development server: npm run dev" -ForegroundColor White

Write-Host ""
Write-Host "📚 Detailed instructions: SUPABASE-SETUP-GUIDE.md" -ForegroundColor Cyan
Write-Host "🔗 SQL Migration file: supabase/migrations/20240918000001_initial_schema.sql" -ForegroundColor Cyan

Write-Host ""
Write-Host "✨ Once configured, your app will be fully functional!" -ForegroundColor Green
