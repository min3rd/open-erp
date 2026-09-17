@echo off
echo ==> Khoi chay Mobile App Ionic 8 + Angular Dev Server (Port 8100)...
if exist src\frontend\mobile (
    cd src\frontend\mobile
)

if exist package.json (
    npx ionic serve --port 8100
) else (
    echo Luu y: Thu muc Mobile frontend chua khoi tao.
)
