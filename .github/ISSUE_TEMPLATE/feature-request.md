---
name: Feature request
about: Đây là mẫu để tạo 01 issue yêu cầu phát triển tính năng
title: "[Feat]"
labels: enhancement
assignees: ''

---

Các yêu cầu bắt buộc phải tuân theo:
* FE repo: https://github.com/min3rd/open-erp-web
* BE repo: https://github.com/min3rd/open-erp-backend
* Mobile repo: https://github.com/min3rd/open-erp-mobile
* Khi thực hiện cần clone code ở tất cả các repo để dựng môi trường phát triển.
* Khởi chạy môi trường backend:
  * clone repo `open-erp-backend`
  * Chạy lệnh `npm i` cài đặt dependencies
  * Chạy lệnh `npm run docker:dev:up` khởi tạo môi trường dữ liệu
  * Chạy lệnh `npm run db:seed-all --drop --confirm --org-count 100 --warehouse-count 100 --user-count 100 --seed-superadmin-password 123456aA@` để khởi tạo data mẫu
  * Đăng nhập hệ thống với thông tin `superadmin@example.com/123456aA@`
* Giao diện cần tham khảo Fluent UI của Microsoft để nhỏ gọn, hiển thị được nhiều thông tin
---
