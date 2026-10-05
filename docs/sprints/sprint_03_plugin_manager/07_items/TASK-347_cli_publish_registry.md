# TASK-347: Hoàn thiện lệnh CLI `publish` (đẩy image/bundle lên registry nội bộ)

| Trường | Giá Trị |
| :--- | :--- |
| **Mã** | TASK-347 |
| **Mức độ** | Medium |
| **Phát hiện bởi** | QA/QC Agent (Bước 8) |
| **Ngày** | 2026-09-20 |
| **Trạng thái** | Done (2026-10-05 — code + test CLI 6/6 PASS) |
| **Liên quan** | FEAT-22 TASK-329, TASK-334/335 (image builder + MinIO) |

## Kết quả triển khai (2026-10-05)

Rút khỏi danh sách hoãn; làm luôn trong Sprint 03 (`tools/open-erp-cli`).

- Lệnh mới `open-erp publish` (`src/commands/publish.js`), đăng ký trong `cli.js` + HELP.
- `--source bundle`: tải `dist/bundle.zip` (hoặc `--artifact`) lên
  `POST {registry}/api/v1/tenant/plugins/artifacts/upload` (multipart, `Authorization: Bearer`),
  nhận `artifact_ref` + `checksum`.
- `--source image`: `docker tag` + `docker push` vào registry nội bộ.
- In ra payload JSON đăng ký phiên bản (kèm `credential_id`) để dán vào UI/API register.
- Registry mặc định `--registry` → `OPENERP_REGISTRY` → `http://localhost:8088`; token từ
  `--credential <tên-env|token>` → `OPENERP_TOKEN`.
- Không thêm dependency ngoài (chỉ Node built-ins + fetch/FormData/Blob).
- Kiểm chứng: `node --test test/cli.test.mjs` → **6/6 PASS** (có test dựng HTTP server cục bộ xác nhận
  method/path/Authorization/body).
- Cập nhật README (bảng lệnh + ví dụ).

## Ghi nhận

- `publish` **không** tự gọi endpoint register (chỉ in payload), đúng theo thiết kế SOL-03.
- Chưa publish image lên registry token-auth thật (Harbor) — giống TASK-331, cần hạ tầng staging.

## Mô tả tồn dư

SOL-03 thiết kế CLI có 10 lệnh gồm `publish`. Hiện `tools/open-erp-cli` triển khai: `create`, `generate entity|menu|ui-contribution`, `validate`, `package`, `link`, `inspect`, `dev`; **`publish` chưa có**, FEAT-22 TASK-329 ghi chú "chưa triển khai — cần cấu hình registry/credentials".

Với Sprint 03, backend đã có registry nội bộ (`openerp.plugin.internal-registry`), credential đa phạm vi và upload API (P4/T14) → đã đủ nền để hoàn thiện.

## Đề xuất (Sprint 04)

1. `open-erp publish --registry <url> --credential <id|env> --source bundle|image`:
   - `bundle`: gọi P4/T14 upload (multipart) → trả `artifact_ref` + checksum.
   - `image`: `docker push` image vào registry nội bộ (tái dùng logic TASK-334).
2. In ra payload đăng ký phiên bản (JSON) để dán vào UI/API P5/T15 (kèm `credential_id`).
3. Smoke test mở rộng + cập nhật `create_new_plugin_guide.md`.

## Lý do từng hoãn (đã huỷ — đã làm trong Sprint 03)

Trước đây ghi nhận phụ thuộc hạ tầng registry nội bộ staging nên gom Sprint 04. Ngày 2026-10-05
chủ dự án yêu cầu làm luôn; lệnh `publish` đã triển khai và test PASS (xem mục trên). Phần push
image lên registry token-auth thật vẫn cần môi trường staging để nghiệm thu cuối.
