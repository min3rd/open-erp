@echo off
setlocal
set PROFILE=%1
if "%PROFILE%"=="" set PROFILE=minimal

if "%PROFILE%"=="full" (
    echo [Infra] Khoi dong TOAN BO ha tang - Full Profile, RAM 8GB+...
    docker compose --profile full up -d
) else if "%PROFILE%"=="kafka" (
    echo [Infra] Khoi dong ha tang Toi thieu + Apache Kafka va Kafka UI...
    docker compose --profile kafka up -d
) else if "%PROFILE%"=="mongo" (
    echo [Infra] Khoi dong ha tang Toi thieu + MongoDB Replica-Set...
    docker compose --profile mongo up -d
) else if "%PROFILE%"=="storage" (
    echo [Infra] Khoi dong ha tang Toi thieu + MinIO S3 Storage...
    docker compose --profile storage up -d
) else if "%PROFILE%"=="mail" (
    echo [Infra] Khoi dong ha tang Toi thieu + Mailpit SMTP...
    docker compose --profile mail up -d
) else (
    echo [Infra] Khoi dong ha tang TOI THIEU - PostgreSQL Primary + Redis, ~300MB RAM...
    docker compose up -d
)

echo.
echo [Infra] Dam bao database test 'openerp_test' ton tai - test khong dung chung DB dev...
docker exec openerp-postgres-primary psql -U openerp -d openerp_dev -tAc "SELECT 1 FROM pg_database WHERE datname='openerp_test'" | findstr "1" >nul
if errorlevel 1 (
    docker exec openerp-postgres-primary psql -U openerp -d openerp_dev -c "CREATE DATABASE openerp_test OWNER openerp"
    echo [Infra] Da tao database 'openerp_test'.
) else (
    echo [Infra] Database 'openerp_test' da ton tai.
)

echo.
echo [Infra] Kiem tra trang thai containers dang chay...
docker compose ps

echo ==========================================================
echo Dich vu toi thieu mac dinh:
echo - PostgreSQL Primary:    localhost:5432 - user: openerp, db: openerp_dev
echo - PostgreSQL Test DB:    openerp_test - dung rieng cho mvn test
echo - Redis:                 localhost:6379 - pass: openerp_redis_password
echo.
echo Meo: De bat them cac service nang theo nhu cau:
echo   scripts\dev\start_infra.bat mail     - Bat them Mailpit SMTP
echo   scripts\dev\start_infra.bat kafka    - Bat them Kafka va Kafka UI
echo   scripts\dev\start_infra.bat mongo    - Bat them MongoDB
echo   scripts\dev\start_infra.bat storage  - Bat them MinIO
echo   scripts\dev\start_infra.bat full     - Bat toan bo
echo ==========================================================
