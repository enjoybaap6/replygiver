@echo off
title ReplyGiver

echo.
echo   ╔══════════════════════════════════╗
echo   ║        ReplyGiver v1.0           ║
echo   ║   Self-hosted support chat       ║
echo   ╚══════════════════════════════════╝
echo.

:: Check Docker
docker info >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Docker is not running. Please start Docker Desktop.
    pause
    exit /b 1
)
echo [OK] Docker is running

:: Check .env
if not exist .env (
    copy .env.example .env >nul 2>&1
)

echo.
echo [INFO] Building and starting services...
docker compose up --build -d

echo.
echo [INFO] Waiting for backend...
:wait
curl -sf http://localhost:8000/health >nul 2>&1
if %errorlevel% neq 0 (
    timeout /t 2 /nobreak >nul
    goto wait
)

echo.
echo ==========================================
echo   ReplyGiver is running!
echo ==========================================
echo.
echo   Dashboard:  http://localhost:3000
echo   API:        http://localhost:8000
echo   API docs:   http://localhost:8000/docs
echo.
echo   Admin key:  replygiver123
echo.
echo   To stop:    docker compose down
echo.
start http://localhost:3000
pause
