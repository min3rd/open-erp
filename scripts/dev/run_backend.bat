@echo off
setlocal
set "ROOT=%~dp0..\.."
echo [Open-ERP] Khoi chay Backend Quarkus Dev Mode - Live-Coding, port 8088...
echo.

rem Java 25 can co flag experimental cho ByteBuddy (Hibernate proxy generation).
rem pom.xml da cau hinh jvm.args; dat them bien nay de an toan khi goi truc tiep.
set "JAVA_TOOL_OPTIONS=-Dnet.bytebuddy.experimental=true"

if not exist "%ROOT%\src\backend\src\main\resources\privateKey.pem" (
    echo [Open-ERP] Chua co khoa JWT - dang sinh khoa RSA dev...
    node "%ROOT%\scripts\dev\generate_jwt_keys.js"
)

cd /d "%ROOT%\src\backend"
if errorlevel 1 (
    echo [LOI] Khong tim thay thu muc src\backend.
    exit /b 1
)

if exist mvnw.cmd (
    call mvnw.cmd quarkus:dev
) else (
    call mvn quarkus:dev
)
