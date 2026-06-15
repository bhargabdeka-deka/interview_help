@echo off
REM ================================================
REM  InterviewOS - Complete One-Click Startup
REM  Starts: Docker containers + Frontend + Electron
REM ================================================

setlocal enabledelayedexpansion

color 0A
cls

echo.
echo ============================================================
echo   INTERVIEWOS - COMPLETE STARTUP (All-in-One)
echo ============================================================
echo.
echo Starting:
echo   1. Docker services (backend, postgres, redis)
echo   2. Frontend dev server
echo   3. Electron desktop app
echo.

REM ===== CHECK DOCKER =====
echo [1/3] Checking Docker Desktop...
docker ps >nul 2>&1
if errorlevel 1 (
    color 0C
    echo.
    echo ERROR: Docker Desktop is not running!
    echo.
    echo Please:
    echo   1. Open Docker Desktop
    echo   2. Wait 30 seconds for it to start
    echo   3. Run this script again
    echo.
    color 0A
    pause
    exit /b 1
)
echo ✅ Docker is running

REM ===== START DOCKER CONTAINERS =====
echo.
echo [2/3] Starting Docker services...
echo   - Backend (Go/Fiber)
echo   - PostgreSQL database
echo   - Redis cache
echo.

docker compose -f docker-compose.prod.yml up --build -d >nul 2>&1

if errorlevel 1 (
    color 0C
    echo ❌ ERROR: Failed to start Docker containers
    color 0A
    pause
    exit /b 1
)

echo ✅ Docker services started
echo   - Frontend:  http://localhost:3000
echo   - Backend:   http://localhost:8080
echo.

REM ===== WAIT FOR SERVICES =====
echo Waiting for services to be ready...
timeout /t 5 /nobreak

REM ===== START FRONTEND DEV SERVER =====
echo.
echo [3/3] Starting frontend dev server...
start "InterviewOS Frontend" cmd /k "cd frontend && npm run dev"
timeout /t 8 /nobreak

REM ===== START ELECTRON APP =====
echo.
echo Starting Electron desktop app...
echo.

cd electron

if not exist "node_modules" (
    echo Installing Electron dependencies...
    call npm install >nul 2>&1
)

set ELECTRON_START_URL=http://localhost:3000

start "InterviewOS Desktop" cmd /k "npm start"

REM ===== COMPLETION =====
cls
color 0B
echo.
echo ============================================================
echo   ✅ INTERVIEWOS IS RUNNING!
echo ============================================================
echo.
echo 🌐 Frontend:  http://localhost:3000
echo 🔌 Backend:   http://localhost:8080
echo 🖥️  Electron:  Desktop window (should appear)
echo 🗄️  Database:  PostgreSQL (internal)
echo 💾 Cache:     Redis (internal)
echo.
echo ============================================================
echo   COMMANDS:
echo ============================================================
echo.
echo Stop everything:
echo   docker compose -f docker-compose.prod.yml down
echo.
echo View backend logs:
echo   docker compose -f docker-compose.prod.yml logs -f backend
echo.
echo View Docker containers:
echo   docker ps
echo.
echo ============================================================
echo.
color 0A
pause
