@echo off
setlocal
set "ROOT=%~dp0..\.."
echo [Open-ERP] Khoi chay Frontend Web Angular 22 Dev Server - port 4200...
echo.

cd /d "%ROOT%\src\frontend\web"
if errorlevel 1 (
    echo [LOI] Khong tim thay thu muc src\frontend\web.
    exit /b 1
)

if exist package.json (
    call npm run start -- --port 4200
) else (
    call npx ng serve --port 4200
)
