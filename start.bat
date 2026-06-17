@echo off
echo Starting Budget70 System...
echo ====================================
echo Starting Backend...
start "Budget70 - Backend" cmd /k "cd /d %~dp0backend && node server.js"

echo Starting Frontend...
start "Budget70 - Frontend" cmd /k "cd /d %~dp0frontend && npm.cmd run dev"

echo ====================================
echo Both servers are starting in new windows.
echo Frontend will be available at http://localhost:5173/
echo To access from another computer, find this computer's IPv4 address.
echo Example: http://192.168.1.10:5173/
echo ====================================
pause
