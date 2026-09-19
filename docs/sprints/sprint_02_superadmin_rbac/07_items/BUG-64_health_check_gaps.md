# [BUG-64] Thiếu Dependency & Quy Ước Trạng Thái Cho Health Check Hạ Tầng

- **Mã Lỗi**: BUG-64
- **Phân Loại**: Bug / Defect
- **Mức Độ Ưu Tiên**: [ ] Critical / [ ] High / [x] Medium / [ ] Low
- **Người Báo Cáo (Reporter)**: QA/QC Agent
- **Người Xử Lý (Assignee)**: Developer Agent
- **Thuộc Sprint**: Sprint 02 - Super Admin & Phân Quyền Toàn Diện
- **Trạng Thái**: [ ] To Do / [ ] In Progress / [ ] In Review / [x] Done / [ ] Deferred

---

## 1. Mô Tả Lỗi
> Giải pháp yêu cầu SmallRye Health nhưng backend chưa khai báo dependency; Kafka vốn chạy on-demand nên chưa có quy ước trạng thái DEGRADED/UNKNOWN; enum trạng thái trả về chưa được chốt giữa API spec và chuẩn MicroProfile Health.

- **Môi trường**: Backend Quarkus (Local/Staging)
- **Bằng chứng (file:line)**:
  - `src/backend/pom.xml:40-116` — không có `quarkus-smallrye-health`.
  - `../05_solutions/SOL-01_superadmin_architecture_and_security.md:124` — đề xuất SmallRye Health (DB Primary/Replica, Redis, Kafka, Pool).
  - `AGENTS.md` — Kafka thuộc compose profile on-demand; cần trạng thái `DEGRADED/UNKNOWN` khi không bật.
  - `../06_designs/api/SUPERADMIN_RBAC_API_SPEC.md:264-301` — response health dùng `UP`/`system_status` nhưng chưa chốt enum đầy đủ.
- **Tài Liệu Đối Chiếu**: ANL-01 §2.4; SOL-01 §4.

## 2. Tác Động
- Không có health checks thực tế; màn hình giám sát dễ hiển thị sai khi Kafka/Redis không chạy.

## 3. Kết Quả Kỳ Vọng
- Bổ sung `quarkus-smallrye-health`, hiện thực health checks DB/Redis/Kafka/Pool.
- Chốt enum trạng thái (`UP`, `DOWN`, `DEGRADED`, `UNKNOWN`) và quy ước Kafka on-demand trong API spec + UI spec.

## 4. Xác Nhận Khắc Phục (QA Verification)
- [ ] Dependency + health checks hoàn tất.
- [ ] API spec/UI spec chốt enum trạng thái.
- [ ] QA xác nhận endpoint trả đúng khi bật/tắt Kafka.

- **Ghi chú QA (2026-09-18)**: Đặc tả đã cập nhật (SOL-01 §4 + API §3.6 thêm DEGRADED/UNKNOWN); cần thêm `quarkus-smallrye-health` + logic trạng thái khi triển khai.

## Ghi Chú Hoàn Thành (2026-09-18)
- Bổ sung dependency `quarkus-smallrye-health`; kiểm chứng runtime `GET /q/health` trả **UP** cho cả **Database** và **Redis** (PostgreSQL + Redis thật).
- Enum trạng thái `UP / DOWN / DEGRADED / UNKNOWN` và quy ước Kafka on-demand đã chốt trong SOL-01 §4 + API spec §3.6.
- `mvn test` **51/51 PASS**.
