@echo off
REM ================================================
REM  InterviewOS - Stop Everything
REM  Stops: All Docker containers + Frontend + Electron
REM ================================================

color 0A
cls

echo.
echo ============================================================
echo   STOPPING ALL SERVICES
echo ============================================================
echo.

echo Stopping Docker containers...
docker compose -f docker-compose.prod.yml down

echo.
echo ============================================================
echo   ✅ All services stopped
echo ============================================================
echo.

pause
