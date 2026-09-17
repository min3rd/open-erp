@echo off
echo ==> Khoi chay Frontend Web Angular 22 Dev Server (Port 4200)...
if exist src\frontend\web (
    cd src\frontend\web
)

if exist package.json (
    npm run start
) else (
    npx ng serve --port 4200
)
