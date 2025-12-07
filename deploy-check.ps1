# Deployment Readiness Checker
Write-Host "🚀 Checking Deployment Readiness..." -ForegroundColor Cyan
Write-Host ""

# Check if .env exists
if (Test-Path ".env") {
    Write-Host "✅ .env file found" -ForegroundColor Green
    
    # Check for required Firebase variables
    $envContent = Get-Content .env -Raw
    $requiredVars = @(
        "NEXT_PUBLIC_FIREBASE_API_KEY",
        "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN",
        "NEXT_PUBLIC_FIREBASE_PROJECT_ID",
        "NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET",
        "NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID",
        "NEXT_PUBLIC_FIREBASE_APP_ID"
    )
    
    Write-Host "`n📋 Firebase Environment Variables:" -ForegroundColor Yellow
    foreach ($var in $requiredVars) {
        if ($envContent -match $var) {
            Write-Host "   ✅ $var" -ForegroundColor Green
        } else {
            Write-Host "   ❌ $var MISSING!" -ForegroundColor Red
        }
    }
} else {
    Write-Host "❌ .env file not found!" -ForegroundColor Red
    Write-Host "   Create a .env file with Firebase credentials" -ForegroundColor Yellow
}

Write-Host ""

# Run build test
Write-Host "🔨 Testing build..." -ForegroundColor Cyan
$buildOutput = npm run build 2>&1
$buildSuccess = $LASTEXITCODE -eq 0

if ($buildSuccess) {
    Write-Host "✅ Build successful!" -ForegroundColor Green
} else {
    Write-Host "❌ Build failed!" -ForegroundColor Red
    Write-Host "   Check the error messages above" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray

if ($buildSuccess) {
    Write-Host "🎉 DEPLOYMENT READY!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Cyan
    Write-Host "1. Go to https://vercel.com/new" -ForegroundColor White
    Write-Host "2. Choose 'Deploy without Git' or import from GitHub" -ForegroundColor White
    Write-Host "3. Add Firebase environment variables in Vercel" -ForegroundColor White
    Write-Host "4. Click Deploy!" -ForegroundColor White
    Write-Host ""
    Write-Host "See DEPLOYMENT_FIXED.md for detailed instructions" -ForegroundColor Yellow
} else {
    Write-Host "⚠️  Fix build errors before deploying" -ForegroundColor Red
}

Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray
