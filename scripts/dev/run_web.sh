#!/usr/bin/env bash
set -e

echo "==> Khởi chạy Frontend Web Angular 22 Dev Server (Port 4200)..."
if [ -d "src/frontend/web" ]; then
    cd src/frontend/web
fi

if [ -f "package.json" ]; then
    npm run start || npx ng serve
else
    echo "Lưu ý: Thư mục Web frontend chưa có package.json. Chạy npx ng serve..."
    npx ng serve --port 4200
fi
