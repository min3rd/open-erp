@echo off
setlocal
cd /d "%~dp0"

echo ==========================================================
echo  Open-ERP - Khoi dong moi truong Local Dev
echo ==========================================================
echo.

echo [1/4] Khoi dong ha tang Docker (PostgreSQL + Redis + Mailpit)...
call docker compose --profile mail up -d
if errorlevel 1 (
    echo [LOI] Khong khoi dong duoc Docker. Hay chac chan Docker Desktop dang chay.
    exit /b 1
)

echo.
echo [2/4] Mo cua so Backend Quarkus  (http://localhost:8088)...
start "openerp-backend" cmd /k "%~dp0scripts\dev\run_backend.bat"

echo [3/4] Mo cua so Web Angular 22  (http://localhost:4200)...
start "openerp-web" cmd /k "%~dp0scripts\dev\run_web.bat"

echo [4/4] Mo cua so Mobile Ionic 8  (http://localhost:8100)...
start "openerp-mobile" cmd /k "%~dp0scripts\dev\run_mobile.bat"

echo.
echo ==========================================================
echo  Da mo 3 cua so dev. Doi 30-90 giay de build xong:
echo   - Backend Quarkus:  http://localhost:8088
echo   - Swagger UI:       http://localhost:8088/q/swagger-ui
echo   - Web Angular:      http://localhost:4200
echo   - Mobile Ionic:     http://localhost:8100
echo   - Mailpit (email):  http://localhost:8025
echo.
echo  Dung moi thu:  stop-dev.bat
echo ==========================================================
endlocal
