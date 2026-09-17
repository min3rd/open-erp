#!/usr/bin/env bash
set -e

echo "==> Khởi chạy Backend Quarkus Java trong chế độ Dev (Live-Coding)..."
cd src/backend || { echo "Chưa tìm thấy thư mục src/backend, đang chạy từ thư mục hiện tại..."; }

if command -v ./mvnw &> /dev/null; then
    ./mvnw quarkus:dev
elif command -v mvn &> /dev/null; then
    mvn quarkus:dev
else
    echo "Lỗi: Không tìm thấy Maven hoặc ./mvnw. Vui lòng cài đặt Java 21+ và Maven!"
    exit 1
fi
