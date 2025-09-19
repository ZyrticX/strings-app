# Google Auth Setup Helper
Write-Host "🔐 Google Authentication Setup Helper" -ForegroundColor Green
Write-Host "====================================" -ForegroundColor Green
Write-Host ""

Write-Host "📋 Step-by-Step Setup:" -ForegroundColor Cyan
Write-Host ""

Write-Host "1. 🌐 Google Cloud Console Setup:" -ForegroundColor Yellow
Write-Host "   • Go to: https://console.cloud.google.com" -ForegroundColor White
Write-Host "   • Create new project or select existing" -ForegroundColor White
Write-Host "   • Enable Google+ API" -ForegroundColor White
Write-Host "   • Create OAuth 2.0 Client ID" -ForegroundColor White
Write-Host "   • Add these redirect URIs:" -ForegroundColor White
Write-Host "     - https://jipyufhgjsuqqblzhvzo.supabase.co/auth/v1/callback" -ForegroundColor Gray
Write-Host "     - http://localhost:5173" -ForegroundColor Gray
Write-Host ""

Write-Host "2. 🔧 Supabase Configuration:" -ForegroundColor Yellow
Write-Host "   • Go to: https://supabase.com/dashboard/projects" -ForegroundColor White
Write-Host "   • Click your project: jipyufhgjsuqqblzhvzo" -ForegroundColor White
Write-Host "   • Authentication → Providers → Enable Google" -ForegroundColor White
Write-Host "   • Add your Google Client ID and Secret" -ForegroundColor White
Write-Host ""

Write-Host "3. 🧪 Test Authentication:" -ForegroundColor Yellow
Write-Host "   • Open: http://localhost:5173" -ForegroundColor White
Write-Host "   • Click 'התחברות מנהלים עם Google'" -ForegroundColor White
Write-Host "   • Should redirect to Google login" -ForegroundColor White
Write-Host ""

Write-Host "📚 Detailed Guide: GOOGLE-AUTH-SETUP.md" -ForegroundColor Cyan
Write-Host ""

Write-Host "✨ Current Status:" -ForegroundColor Green
Write-Host "   ✅ Google Auth code already implemented" -ForegroundColor Green
Write-Host "   ✅ Supabase OAuth configured in app" -ForegroundColor Green
Write-Host "   ⏳ Waiting for Google Cloud Console setup" -ForegroundColor Yellow
Write-Host "   ⏳ Waiting for Supabase provider configuration" -ForegroundColor Yellow
Write-Host ""

Write-Host "🎯 Once configured, users can sign in with Google!" -ForegroundColor Green
