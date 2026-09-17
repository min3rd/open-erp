@echo off
echo ==> Khoi chay Backend Quarkus Java trong che do Dev (Live-Coding)...
if exist src\backend (
    cd src\backend
)

if exist gradlew.bat (
    gradlew.bat quarkusDev
) else if exist mvnw.cmd (
    mvnw.cmd quarkus:dev
) else (
    mvn quarkus:dev
)
