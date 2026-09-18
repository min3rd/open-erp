@echo off
setlocal
set "ROOT=%~dp0..\.."
echo [Open-ERP] Khoi chay Mobile Ionic 8 + Angular Dev Server - port 8100...
echo.

cd /d "%ROOT%\src\frontend\mobile"
if errorlevel 1 (
    echo [LOI] Khong tim thay thu muc src\frontend\mobile.
    exit /b 1
)

if exist package.json (
    call npm run serve
) else (
    echo Luu y: Thu muc Mobile frontend chua khoi tao.
)
