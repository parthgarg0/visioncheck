@echo off
echo ========================================================
echo Starting VisionCheck on Localhost...
echo Backend API:  http://localhost:8000
echo Swagger UI:   http://localhost:8000/docs
echo Frontend App: http://localhost:5173
echo ========================================================

REM Start FastAPI Backend
start "VisionCheck Backend (FastAPI)" cmd /k "cd /d %~dp0backend && .venv\Scripts\python.exe -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload"

REM Start Vite React Frontend
start "VisionCheck Frontend (Vite)" cmd /k "cd /d %~dp0frontend && npm run dev"

REM Wait 3 seconds and launch browser
timeout /t 3 >nul
start http://localhost:5173
echo Application launched!
