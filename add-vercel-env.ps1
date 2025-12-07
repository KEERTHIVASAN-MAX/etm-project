# Automatically add environment variables to Vercel
Write-Host "🔧 Adding Firebase Environment Variables to Vercel..." -ForegroundColor Cyan
Write-Host ""

# Check if .env exists
if (-not (Test-Path ".env")) {
    Write-Host "❌ .env file not found!" -ForegroundColor Red
    Write-Host "   Please create a .env file with your Firebase credentials" -ForegroundColor Yellow
    exit 1
}

# Read .env file
$envVars = @()
Get-Content .env | ForEach-Object {
    # Skip empty lines or comments
    if ([string]::IsNullOrWhiteSpace($_) -or $_.StartsWith("#")) { return }
    
    # Parse Key=Value
    $parts = $_.Split('=', 2)
    if ($parts.Count -eq 2) {
        $key = $parts[0].Trim()
        $value = $parts[1].Trim()
        
        # Only process NEXT_PUBLIC_ variables
        if ($key -like "NEXT_PUBLIC_*") {
            $envVars += @{Key=$key; Value=$value}
        }
    }
}

if ($envVars.Count -eq 0) {
    Write-Host "⚠️  No NEXT_PUBLIC_ variables found in .env" -ForegroundColor Yellow
    exit 1
}

Write-Host "Found $($envVars.Count) Firebase variables to add:" -ForegroundColor Green
foreach ($var in $envVars) {
    Write-Host "  • $($var.Key)" -ForegroundColor Cyan
}
Write-Host ""

# Add each variable to Vercel
$successCount = 0
$errorCount = 0

foreach ($var in $envVars) {
    Write-Host "Adding $($var.Key)..." -ForegroundColor Yellow
    
    try {
        # Use vercel env add command
        $var.Value | vercel env add $var.Key production --force 2>&1 | Out-Null
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "  ✅ $($var.Key) added successfully" -ForegroundColor Green
            $successCount++
        } else {
            Write-Host "  ❌ Failed to add $($var.Key)" -ForegroundColor Red
            $errorCount++
        }
    } catch {
        Write-Host "  ❌ Error adding $($var.Key): $_" -ForegroundColor Red
        $errorCount++
    }
}

Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray
Write-Host "Summary: $successCount added, $errorCount failed" -ForegroundColor Cyan

if ($successCount -gt 0) {
    Write-Host ""
    Write-Host "🎉 Environment variables added!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Cyan
    Write-Host "1. Redeploy your app: vercel --prod" -ForegroundColor White
    Write-Host "2. Wait for deployment to complete" -ForegroundColor White
    Write-Host "3. Test login at your production URL" -ForegroundColor White
} else {
    Write-Host ""
    Write-Host "⚠️  No variables were added. You may need to add them manually." -ForegroundColor Yellow
    Write-Host "Go to: https://vercel.com/spinzbeverage-3152s-projects/spinz-soda-etm/settings/environment-variables" -ForegroundColor Cyan
}

Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray
