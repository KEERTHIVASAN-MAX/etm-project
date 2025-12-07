# Automatically add environment variables to Vercel
Write-Host "Adding Firebase Environment Variables to Vercel..." -ForegroundColor Cyan
Write-Host ""

# Check if .env exists
if (-not (Test-Path ".env")) {
    Write-Host "ERROR: .env file not found!" -ForegroundColor Red
    exit 1
}

# Read .env file
$envVars = @()
Get-Content .env | ForEach-Object {
    if ([string]::IsNullOrWhiteSpace($_) -or $_.StartsWith("#")) { return }
    
    $parts = $_.Split('=', 2)
    if ($parts.Count -eq 2) {
        $key = $parts[0].Trim()
        $value = $parts[1].Trim()
        
        if ($key -like "NEXT_PUBLIC_*") {
            $envVars += @{Key=$key; Value=$value}
        }
    }
}

if ($envVars.Count -eq 0) {
    Write-Host "WARNING: No NEXT_PUBLIC_ variables found in .env" -ForegroundColor Yellow
    exit 1
}

Write-Host "Found $($envVars.Count) Firebase variables:" -ForegroundColor Green
foreach ($var in $envVars) {
    Write-Host "  $($var.Key)" -ForegroundColor Cyan
}
Write-Host ""

# Add each variable to Vercel
foreach ($var in $envVars) {
    Write-Host "Adding $($var.Key)..." -ForegroundColor Yellow
    $var.Value | vercel env add $var.Key production --force
}

Write-Host ""
Write-Host "Done! Now redeploy: vercel --prod" -ForegroundColor Green
