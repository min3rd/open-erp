@echo off
setlocal
echo [Open-ERP] Dung cac cua so dev - backend / web / mobile...

taskkill /FI "WINDOWTITLE eq openerp-backend*" /T /F >nul 2>&1
taskkill /FI "WINDOWTITLE eq openerp-web*" /T /F >nul 2>&1
taskkill /FI "WINDOWTITLE eq openerp-mobile*" /T /F >nul 2>&1

echo [Open-ERP] Da dung Backend, Web, Mobile.
echo.
set /p STOPDOCKER="Dung luon Docker infra (PostgreSQL/Redis/Mailpit)? [y/N]: "
if /i "%STOPDOCKER%"=="y" (
    docker compose down
    echo [Open-ERP] Da dung Docker infra.
) else (
    echo [Open-ERP] Giu nguyen Docker infra dang chay.
)
endlocal
