@echo off
echo ========================================
echo Starting Segment Art with Roboflow
echo ========================================
echo.

REM Check if .env file exists
if not exist "python-backend\.env" (
    echo WARNING: python-backend\.env not found!
    echo Copy python-backend\.env.example to .env and add your ROBOFLOW_API_KEY
    echo.
)

echo Starting Python backend (port 5000)...
start "Segment Art - Python Backend" cmd /k "cd python-backend && python app.py"

timeout /t 3 /nobreak >nul

echo Starting React frontend (port 3000)...
start "Segment Art - React Frontend" cmd /k "cd demo-app && npm run dev"

timeout /t 3 /nobreak >nul

echo.
echo ========================================
echo Both servers are starting!
echo.
echo Frontend: http://localhost:3000
echo Backend:  http://localhost:5000
echo.
echo Two command windows have opened.
echo Close them to stop the servers.
echo ========================================
echo.
pause
