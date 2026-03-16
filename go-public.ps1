# ZeroDeploy AI - Public Mode Launcher
# This script makes your local platform instance public via SSH tunnels.

Write-Host "🚀 Starting ZeroDeploy AI in Public Mode..." -ForegroundColor Cyan

# 1. Start Backend in background
Write-Host "📡 Starting Backend..." -ForegroundColor Yellow
Start-Process -NoNewWindow -FilePath "npm" -ArgumentList "run dev" -WorkingDirectory "$PSScriptRoot\server"

# 2. Start Backend Tunnel
Write-Host "🌐 Creating Public HTTPS Tunnel for Backend..." -ForegroundColor Yellow
$backendTunnel = Start-Process -PassThru -NoNewWindow -FilePath "ssh" -ArgumentList "-o StrictHostKeyChecking=no -R 80:127.0.0.1:4010 nokey@localhost.run" -RedirectStandardOutput "$PSScriptRoot\backend_tunnel.log"

# Wait for tunnel URL
Write-Host "⏳ Waiting for Backend URL..." -ForegroundColor Gray
$backendUrl = ""
for ($i=0; $i -lt 15; $i++) {
    Start-Sleep -Seconds 1
    if (Test-Path "$PSScriptRoot\backend_tunnel.log") {
        $log = Get-Content "$PSScriptRoot\backend_tunnel.log" -Raw
        if ($log -match "https://[^\s]+\.lhr\.life") {
            $backendUrl = $matches[0]
            break
        }
    }
}

if (-not $backendUrl) {
    Write-Host "❌ Failed to get Backend Tunnel URL. Check backend_tunnel.log" -ForegroundColor Red
    exit
}

$apiUrl = "$backendUrl/api"
Write-Host "✨ Backend is Public: $apiUrl" -ForegroundColor Green

# 3. Start Frontend with Public API URL
Write-Host "🎨 Starting Frontend..." -ForegroundColor Yellow
$env:NEXT_PUBLIC_API_URL = $apiUrl
Start-Process -NoNewWindow -FilePath "npm" -ArgumentList "run dev -- -p 3000" -WorkingDirectory "$PSScriptRoot\client"

# 4. Start Frontend Tunnel
Write-Host "🌐 Creating Public HTTPS Tunnel for Frontend..." -ForegroundColor Yellow
$frontendTunnel = Start-Process -PassThru -NoNewWindow -FilePath "ssh" -ArgumentList "-o StrictHostKeyChecking=no -R 80:127.0.0.1:3000 nokey@localhost.run" -RedirectStandardOutput "$PSScriptRoot\frontend_tunnel.log"

# Wait for tunnel URL
Write-Host "⏳ Waiting for Frontend URL..." -ForegroundColor Gray
$frontendUrl = ""
for ($i=0; $i -lt 15; $i++) {
    Start-Sleep -Seconds 1
    if (Test-Path "$PSScriptRoot\frontend_tunnel.log") {
        $log = Get-Content "$PSScriptRoot\frontend_tunnel.log" -Raw
        if ($log -match "https://[^\s]+\.lhr\.life") {
            $frontendUrl = $matches[0]
            break
        }
    }
}

if ($frontendUrl) {
    Write-Host "`n🔥 ZERO DEPLOY IS LIVE!" -ForegroundColor Cyan
    Write-Host "👉 URL: $frontendUrl" -ForegroundColor Green
    Write-Host "----------------------------------"
    Write-Host "Press Ctrl+C to stop (Close the terminal windows to kill processes)"
} else {
    Write-Host "❌ Failed to get Frontend Tunnel URL. Check frontend_tunnel.log" -ForegroundColor Red
}

# Keep script running
while($true) { Start-Sleep -Seconds 10 }
