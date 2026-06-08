# Generate package-lock.json for frontend
Write-Host "Generating package-lock.json for SMP_Novels frontend..." -ForegroundColor Cyan

Set-Location "C:\Users\rwill\OneDrive\Desktop\SMP_Novels\frontend"

Write-Host "`nRunning: npm install --package-lock-only" -ForegroundColor Yellow
npm install --package-lock-only

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n✅ package-lock.json generated successfully!" -ForegroundColor Green
} else {
    Write-Host "`n⚠️  Could not generate package-lock.json. Using npm install in Docker instead." -ForegroundColor Yellow
}

Set-Location "C:\Users\rwill\OneDrive\Desktop\SMP_Novels"
