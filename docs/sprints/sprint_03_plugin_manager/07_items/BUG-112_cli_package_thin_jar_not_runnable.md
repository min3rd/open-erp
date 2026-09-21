# BUG-112: CLI `package` copy JAR thin (không chạy được) thay vì artifact runnable

| Trường | Giá Trị |
| :--- | :--- |
| **Mã** | BUG-112 |
| **Mức độ** | High |
| **Trạng thái** | To Do (Sprint 04 — hoặc hotfix ngay) |
| **Liên quan** | FEAT-22 TASK-327, `tools/open-erp-cli/src/commands/package.js` |

## Mô tả

Sau khi build Quarkus, `open-erp package` copy **`target/plugin-<id>-1.0.0-SNAPSHOT.jar` (thin jar 9.4KB)** thành `dist/plugin-backend.jar`. Jar này **không có dependency**, `java -jar` không chạy được → image build từ bundle (TASK-334) tạo container crash ngay → không thể ACTIVE thật.

## Hướng sửa đề xuất

- Build `-Dquarkus.package.type=uber-jar` (đã kiểm chứng: runner jar 43.7MB chạy được) hoặc copy `quarkus-app/quarkus-run.jar` + `lib/` + `app/`.
- Tạo luôn `dist/bundle.zip` đúng layout cho ImageBuilder: `app.jar` là entry `.jar` **đầu tiên**, sau đó `lib/**`, `app/**`, `static/**` (vì ImageBuilder map jar đầu tiên → `app.jar`).
- Cập nhật `release-manifest.json` + checksums theo artifact runnable.

## Bằng chứng

`08_testing/evidence/TASK-344_cli_bundle_channel_e2e.txt` (STEP1: bản gốc 792B → sau workaround uber-jar 37.6MB).
