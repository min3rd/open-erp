---
name: Feature request
about: Đây là mẫu để tạo 01 issue yêu cầu phát triển tính năng
title: ''
labels: enhancement
assignees: ''

---

Các yêu cầu bắt buộc phải tuân theo:
* FE workspace: open-erp-web
* BE workspace: open-erp-backend
* Mobile workspace: open-erp-mobile
* Khi thực hiện cần dựng môi trường phát triển.
* Khởi chạy môi trường backend:
  * Vào workspace open-erp-backend
  * Chạy lệnh `npm i` cài đặt dependencies
  * Chạy lệnh `npm run docker:dev:up` khởi tạo môi trường dữ liệu
  * Chạy lệnh `npm run db:seed:all -- --drop --confirm --org-count 100 --warehouse-count 100 --user-count 100 --seed-superadmin-password 123456aA@` để khởi tạo data mẫu
  * Chạy các backend service auth, user,...: `npm run [service-name]:dev`
* Khởi chạy giao diện web:
  * Vào workspace open-erp-web
  * Chạy lệnh `npm i` cài đặt dependencies
  * Chạy lệnh `npm start` để chạy ứng dụng angular và có thể truy cập tại `http://localhost:4200`
* Đăng nhập hệ thống với thông tin `superadmin@example.com/123456aA@`
* Giao diện cần tham khảo Fluent UI của Microsoft để nhỏ gọn, hiển thị được nhiều thông tin
---
