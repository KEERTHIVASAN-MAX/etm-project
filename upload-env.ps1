# Read .env file and add variables to Vercel
Get-Content .env | ForEach-Object {
    # Skip empty lines or comments
    if ([string]::IsNullOrWhiteSpace($_) -or $_.StartsWith("#")) { return }

    # Parse Key=Value
    $parts = $_.Split('=', 2)
    if ($parts.Count -eq 2) {
        $key = $parts[0].Trim()
        $value = $parts[1].Trim()

        if ($key -and $value) {
            Write-Host "Adding $key to Vercel..."
            # Pipe the value to vercel env add
            # Syntax: vercel env add <name> [environment]
            # It reads value from stdin
            $value | vercel env add $key production --force
        }
    }
}
