@echo off
title Psyche Mirror - App Starter
color 0A

echo ========================================
echo       PSYCHE MIRROR - Starting App
echo ========================================
echo.

:: Start Backend Server
echo [1/2] Starting Backend Server...
cd /d "%~dp0backend"
start "Psyche Mirror - Backend" cmd /k "npm run dev"

:: Wait a moment for backend to initialize
timeout /t 3 /nobreak > nul

:: Start Frontend Server
echo [2/2] Starting Frontend Server...
cd /d "%~dp0frontend"
start "Psyche Mirror - Frontend" cmd /k "npm start"

echo.
echo ========================================
echo   Both servers are starting...
echo   Backend: http://localhost:5000
echo   Frontend: http://localhost:3000
echo ========================================
echo.
echo You can close this window now.
pause

