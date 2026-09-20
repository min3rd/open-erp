# TASK-347: Hoàn thiện lệnh CLI `publish` (đẩy image/bundle lên registry nội bộ)

| Trường | Giá Trị |
| :--- | :--- |
| **Mã** | TASK-347 |
| **Mức độ** | Medium |
| **Phát hiện bởi** | QA/QC Agent (Bước 8) |
| **Ngày** | 2026-09-20 |
| **Trạng thái** | Deferred → Sprint 04 |
| **Liên quan** | FEAT-22 TASK-329 (In Progress), TASK-334/335 (image builder + MinIO) |

## Mô tả tồn dư

SOL-03 thiết kế CLI có 10 lệnh gồm `publish`. Hiện `tools/open-erp-cli` triển khai: `create`, `generate entity|menu|ui-contribution`, `validate`, `package`, `link`, `inspect`, `dev`; **`publish` chưa có**, FEAT-22 TASK-329 ghi chú "chưa triển khai — cần cấu hình registry/credentials".

Với Sprint 03, backend đã có registry nội bộ (`openerp.plugin.internal-registry`), credential đa phạm vi và upload API (P4/T14) → đã đủ nền để hoàn thiện.

## Đề xuất (Sprint 04)

1. `open-erp publish --registry <url> --credential <id|env> --source bundle|image`:
   - `bundle`: gọi P4/T14 upload (multipart) → trả `artifact_ref` + checksum.
   - `image`: `docker push` image vào registry nội bộ (tái dùng logic TASK-334).
2. In ra payload đăng ký phiên bản (JSON) để dán vào UI/API P5/T15 (kèm `credential_id`).
3. Smoke test mở rộng + cập nhật `create_new_plugin_guide.md`.

## Lý do hoãn

Không chặn luồng phát triển plugin hiện tại (dev dùng `package` + upload trên UI); phụ thuộc hạ tầng registry nội bộ thực tế của staging nên gom Sprint 04.
