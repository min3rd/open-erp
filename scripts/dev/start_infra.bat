@echo off
set PROFILE=%1
if "%PROFILE%"=="" set PROFILE=minimal

if "%PROFILE%"=="full" (
    echo ==> Khoi dong TOAN BO ha tang (Full Profile - yeu cau RAM >= 8GB)...
    docker compose --profile full up -d
) else if "%PROFILE%"=="kafka" (
    echo ==> Khoi dong ha tang Toi thieu + Apache Kafka ^& Kafka UI...
    docker compose --profile kafka up -d
) else if "%PROFILE%"=="mongo" (
    echo ==> Khoi dong ha tang Toi thieu + MongoDB Replica-Set...
    docker compose --profile mongo up -d
) else if "%PROFILE%"=="storage" (
    echo ==> Khoi dong ha tang Toi thieu + MinIO S3 Storage...
    docker compose --profile storage up -d
) else if "%PROFILE%"=="mail" (
    echo ==> Khoi dong ha tang Toi thieu + Mailpit SMTP...
    docker compose --profile mail up -d
) else (
    echo ==> Khoi dong ha tang TOI THIEU (PostgreSQL Primary + Redis, ~300MB RAM)...
    docker compose up -d
)

echo ==> Kiem tra trang thai containers dang chay...
docker compose ps

echo ==========================================================
echo Dich vu toi thieu mac dinh:
echo - PostgreSQL Primary:    localhost:5432 (user: openerp, db: openerp_dev)
echo - Redis:                 localhost:6379 (pass: openerp_redis_password)
echo.
echo Meo: De bat them cac service nang theo nhu cau:
echo   scripts\dev\start_infra.bat kafka    (Bat them Kafka ^& Kafka UI)
echo   scripts\dev\start_infra.bat mongo    (Bat them MongoDB)
echo   scripts\dev\start_infra.bat storage  (Bat them MinIO)
echo   scripts\dev\start_infra.bat full     (Bat toan bo)
echo ==========================================================
