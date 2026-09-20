# BUG-109: Job `ImpersonationTimeoutJob` lỗi định kỳ mỗi 5 phút (nghi vấn hot-reload dev)

| Trường | Giá Trị |
| :--- | :--- |
| **Mã** | BUG-109 |
| **Mức độ** | Medium |
| **Phát hiện bởi** | QA/QC Agent — log backend khi chạy kiểm thử trình duyệt |
| **Ngày** | 2026-09-20 |
| **Trạng thái** | In Review (chờ xác nhận sau restart sạch) |
| **Liên quan** | Sprint 02 `ImpersonationTimeoutJob`, BUG-78/BUG-82 |

## Mô tả

Trong log backend dev mode, job nền chạy mỗi 5 phút báo lỗi lặp lại (không làm chết app):

```
ERROR ImpersonationTimeoutJob Impersonation timeout job failed:
Argument [STARTED] of type [com.vn9melody.openerp.core.enums.ImpersonationStatus]
did not match parameter type [com.vn9melody.openerp.core.enums.ImpersonationStatus (n/a)]
```

Nghi vấn: Hibernate 6 gặp enum class bị nạp lại (hot-reload) khác classloader với mapping đã đăng ký → tham số enum không khớp kiểu `(n/a)`.

## Ảnh hưởng

- Nếu đúng trên môi trường không hot-reload: phiên impersonation quá hạn **không được tự kết thúc** (job sweep fail). Token vẫn hết hạn theo TTL nhưng log `TIMEOUT` + audit SYSTEM không được ghi.
- Trên dev hiện tại: job fail lặp lại mỗi 5 phút, gây nhiễu log.

## Bằng chứng & bước xác minh

1. Log dev mode `qa-backend.log` (20:03–20:57) lặp lỗi 5 phút/lần.
2. Logic `closeExpiredSessions` có test trong `PlatformTenantApiTest` (full suite PASS) → nghi vấn môi trường hot-reload.
3. QA đã restart backend sạch (`qa-backend2.log`) và theo dõi tick 5 phút: nếu hết lỗi → xác nhận hot-reload artifact và hạ ưu tiên; nếu còn → chuyển **High** và cần sửa binding enum (`.setParameter` tường minh/cast).

## Hướng xử lý đề xuất (nếu còn lỗi sau restart)

- Thay `find("status = ?1 ...", ImpersonationStatus.STARTED, ...)` bằng query có cast/`setParameter` tường minh trên `EntityManager`, hoặc lưu status dạng String trong điều kiện JPQL (`status = :status` với `@Param`).
