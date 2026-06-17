#!/usr/bin/env pwsh

# ================================================
# InterviewOS - Complete One-Click Startup
# ================================================

Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "   INTERVIEWOS - COMPLETE STARTUP (All-in-One)" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Starting:" -ForegroundColor Yellow
Write-Host "   1. Docker services (backend, postgres, redis)" -ForegroundColor Yellow
Write-Host "   2. Frontend dev server" -ForegroundColor Yellow
Write-Host "   3. Electron desktop app" -ForegroundColor Yellow
Write-Host ""

# ===== CHECK DOCKER =====
Write-Host "[1/3] Checking Docker Desktop..." -ForegroundColor Green
$dockerRunning = $false
try {
    docker ps > $null 2>&1
    $dockerRunning = $?
} catch {
    $dockerRunning = $false
}

if (-not $dockerRunning) {
    Write-Host ""
    Write-Host "ERROR: Docker Desktop is not running!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please:" -ForegroundColor Yellow
    Write-Host "   1. Open Docker Desktop" -ForegroundColor Yellow
    Write-Host "   2. Wait 30 seconds for it to start" -ForegroundColor Yellow
    Write-Host "   3. Run this script again" -ForegroundColor Yellow
    Write-Host ""
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host "[OK] Docker is running" -ForegroundColor Green

# ===== START DOCKER CONTAINERS =====
Write-Host ""
Write-Host "[2/3] Starting Docker services..." -ForegroundColor Green
Write-Host "   - Backend (Go/Fiber)" -ForegroundColor Yellow
Write-Host "   - PostgreSQL database" -ForegroundColor Yellow
Write-Host "   - Redis cache" -ForegroundColor Yellow
Write-Host ""

docker compose -f docker-compose.prod.yml up --build -d

if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERROR] Failed to start Docker containers" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host "[OK] Docker services started" -ForegroundColor Green
Write-Host "   - Frontend:  http://localhost:3000" -ForegroundColor Cyan
Write-Host "   - Backend:   http://localhost:8080" -ForegroundColor Cyan
Write-Host ""

# ===== WAIT FOR SERVICES =====
Write-Host "Waiting for services to be ready..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

# ===== START FRONTEND DEV SERVER =====
Write-Host ""
Write-Host "[3/3] Starting frontend dev server..." -ForegroundColor Green
$frontendJob = Start-Process -FilePath "powershell" -ArgumentList "-NoExit", "-Command", "cd frontend; npm run dev" -PassThru -WindowStyle Normal
Write-Host "   Frontend window started (PID: $($frontendJob.Id))" -ForegroundColor Green
Start-Sleep -Seconds 8

# ===== START ELECTRON APP =====
Write-Host ""
Write-Host "Starting Electron desktop app..." -ForegroundColor Green
Write-Host ""

Set-Location "electron"

if (-not (Test-Path "node_modules")) {
    Write-Host "Installing Electron dependencies..." -ForegroundColor Yellow
    npm install | Out-Null
}

$env:ELECTRON_START_URL = "http://localhost:3000"

$electronJob = Start-Process -FilePath "powershell" -ArgumentList "-NoExit", "-Command", "npm start" -PassThru -WindowStyle Normal
Write-Host "   Electron window started (PID: $($electronJob.Id))" -ForegroundColor Green

# ===== COMPLETION =====
Clear-Host
Write-Host ""
Write-Host "============================================================" -ForegroundColor Green
Write-Host "   [OK] INTERVIEWOS IS RUNNING!" -ForegroundColor Green
Write-Host "============================================================" -ForegroundColor Green
Write-Host ""
Write-Host "[Frontend]  http://localhost:3000" -ForegroundColor Cyan
Write-Host "[Backend]   http://localhost:8080" -ForegroundColor Cyan
Write-Host "[Electron]  Desktop window (should appear)" -ForegroundColor Cyan
Write-Host "[Database]  PostgreSQL (internal)" -ForegroundColor Cyan
Write-Host "[Cache]     Redis (internal)" -ForegroundColor Cyan
Write-Host ""
Write-Host "============================================================" -ForegroundColor Green
Write-Host "   COMMANDS:" -ForegroundColor Yellow
Write-Host "============================================================" -ForegroundColor Green
Write-Host ""
Write-Host "Stop everything:" -ForegroundColor Yellow
Write-Host "   docker compose -f docker-compose.prod.yml down" -ForegroundColor Gray
Write-Host ""
Write-Host "View backend logs:" -ForegroundColor Yellow
Write-Host "   docker compose -f docker-compose.prod.yml logs -f backend" -ForegroundColor Gray
Write-Host ""
Write-Host "View Docker containers:" -ForegroundColor Yellow
Write-Host "   docker ps" -ForegroundColor Gray
Write-Host ""
Write-Host "============================================================" -ForegroundColor Green
Write-Host ""

Read-Host "Press Enter to exit"
