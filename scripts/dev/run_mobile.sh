#!/usr/bin/env bash
set -e

echo "==> Khởi chạy Mobile App Ionic 8 + Angular Dev Server (Port 8100)..."
if [ -d "src/frontend/mobile" ]; then
    cd src/frontend/mobile
fi

if [ -f "package.json" ]; then
    npx ionic serve --port 8100
else
    echo "Lưu ý: Thư mục Mobile frontend chưa khởi tạo."
fi
