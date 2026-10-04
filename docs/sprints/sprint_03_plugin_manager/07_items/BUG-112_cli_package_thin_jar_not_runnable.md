# BUG-112: CLI `package` copy JAR thin (không chạy được) thay vì artifact runnable

| Trường | Giá Trị |
| :--- | :--- |
| **Mã** | BUG-112 |
| **Mức độ** | High |
| **Trạng thái** | Resolved (2026-10-04 — chờ QA/Reviewer xác nhận) |
| **Liên quan** | FEAT-22 TASK-327, `tools/open-erp-cli/src/commands/package.js` |

## Fix (2026-10-04)

- `package` build uber-jar (`-Dquarkus.package.type=uber-jar`), copy `target/*-runner.jar` →
  `dist/plugin-backend.jar` (runnable, self-contained).
- Sinh `dist/bundle.zip` đúng layout ImageBuilder: entry `.jar` đầu tiên = `app.jar`, sau đó `static/**`
  (ZIP writer nội bộ `src/lib/zip.js`, không thêm dependency).
- E2E: jar 43,743,546 bytes; `java -jar` → HEALTH 200, `GET /api/v1/plugins/sample-items` → `[]`;
  `tar -tf bundle.zip` → `app.jar`, `static/**`.
- Sửa kèm khi E2E: down-migration tách sang `db/plugin-migration-down/` (Flyway "Found more than one
  migration with version 1.0.0"); Hibernate dùng `quarkus.hibernate-orm.database.default-schema`.

Bằng chứng: `08_testing/evidence/BUG-109_116_fix_verification_2026-10-04.txt`; smoke test CLI
`test/cli.test.mjs` (5 PASS) có case `bundle.zip` với `app.jar` đầu tiên.

## Mô tả

Sau khi build Quarkus, `open-erp package` copy **`target/plugin-<id>-1.0.0-SNAPSHOT.jar` (thin jar 9.4KB)** thành `dist/plugin-backend.jar`. Jar này **không có dependency**, `java -jar` không chạy được → image build từ bundle (TASK-334) tạo container crash ngay → không thể ACTIVE thật.

## Hướng sửa đề xuất

- Build `-Dquarkus.package.type=uber-jar` (đã kiểm chứng: runner jar 43.7MB chạy được) hoặc copy `quarkus-app/quarkus-run.jar` + `lib/` + `app/`.
- Tạo luôn `dist/bundle.zip` đúng layout cho ImageBuilder: `app.jar` là entry `.jar` **đầu tiên**, sau đó `lib/**`, `app/**`, `static/**` (vì ImageBuilder map jar đầu tiên → `app.jar`).
- Cập nhật `release-manifest.json` + checksums theo artifact runnable.

## Bằng chứng

`08_testing/evidence/TASK-344_cli_bundle_channel_e2e.txt` (STEP1: bản gốc 792B → sau workaround uber-jar 37.6MB).
