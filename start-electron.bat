@echo off
REM Start Electron Desktop App

echo.
echo ===============================================
echo   InterviewOS Desktop App
echo ===============================================
echo.

echo Starting frontend dev server on port 3001...
start cmd /c "cd frontend && npm run dev"
timeout /t 5

echo Starting Electron app...
cd electron

REM Install dependencies if needed
if not exist "node_modules" (
    echo Installing Electron dependencies...
    call npm install
)

REM Set environment variable for dev URL
set ELECTRON_START_URL=http://localhost:3001

REM Start Electron
call npm start

echo.
echo Electron closed.
pause
