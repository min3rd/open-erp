# TASK-478: QA Dual-Mode, Ảnh Minh chứng & Bộ Tài liệu Người dùng/Dev/Deploy Sprint 12

| Trường | Giá trị |
| :--- | :--- |
| **ID** | `TASK-478` |
| **Thuộc Feature** | [FEAT-51](./FEAT-51_pdf_viewer_mobile_ionic_viewer_e2e_docs.md) |
| **Loại** | QA Verification & Documentation |
| **Ưu tiên** | High |
| **Trạng thái** | `Open` — đặc tả chi tiết 0.2, chờ chủ dự án review |
| **Phụ thuộc** | `TASK-474`, `TASK-475`, `TASK-476`, `TASK-477` |
| **Owner** | Developer Agent (soạn) / QA Agent (thực thi) |
| **Tài liệu nguồn** | [CONF-S12-001](../04_confirmation/01_CONF-S12-001_sprint_12_scope_and_ac.md), [DES-UI-S12-001](../06_designs/ui/01_DES-UI-S12-001_office_webapp_ui.md), [BENCH-S12-002](../03_benchmarks/02_BENCH-S12-002_m365_live_ui_verification.md), [BENCH-S12-003](../03_benchmarks/03_BENCH-S12-003_m365_feature_matrix.md) |

---

## 0. Kết quả bàn giao

1. `08_testing/` có Test Plan + Test Report có baseline, ảnh chụp, số đo; 100% AC-01…AC-08 được đối chiếu.
2. Bộ ảnh Desktop (≥1280) + Mobile (390×844) cho 4 định dạng, kèm log 0 `console.error`.
3. `docs/06_user_guides/`, `docs/07_deployment_guides/`, `docs/08_developer_guides/` có mục Office WebApp; `check-docs.mjs` 0 lỗi.

## 1. Phạm vi file

| Đường dẫn | Nội dung |
| :--- | :--- |
| `08_testing/01_TP-S12-001_test_plan.md` | Kế hoạch test, ma trận AC, môi trường, dữ liệu |
| `08_testing/02_TR-S12-001_test_report.md` | Kết quả thực thi, bug, bằng chứng |
| `08_testing/evidence/` | Ảnh + JSON đo + log |
| `08_testing/bugs/BUG-*.md` | Bug report theo mức độ |
| `docs/06_user_guides/office-webapp/*.md` + `screenshots/` | Hướng dẫn người dùng |
| `docs/07_deployment_guides/office-webapp.md` | Cài đặt plugin, migration, cấu hình storage |
| `docs/08_developer_guides/office-webapp/*.md` | Kiến trúc, build, test, debug |

## 2. Ma trận kiểm thử (bắt buộc)

| Nhóm | Ca kiểm thử | Nguồn AC |
| :--- | :--- | :--- |
| Cài đặt | Cài plugin mới, bật/tắt, gỡ; migration chạy; quyền hiển thị đúng | AC-01 |
| Local-only | Mở/sửa/lưu 4 định dạng; Network 0 request chứa file | AC-02 |
| ERP Storage | Mở danh sách, tìm/lọc/phân trang; lưu version; xung đột; xóa mềm; tenant B không thấy | AC-03 |
| Shell | Đo token 48/31/36/76/136/32/24; menu File **9 mục**; Share nội bộ ERP (cấp/thu hồi quyền); Single/Classic; Drawer; theme; i18n vi/en; 0 emoji | AC-04, AC-09, AC-10 |
| Word | Mở/sửa bảng/ảnh/find-replace/undo-redo/comment/**track changes/header-footer/footnote/citation/TOC/equation/ink/online video**/export docx-md/print | AC-05, AC-11, AC-13 |
| Excel | **Toàn bộ catalogue hàm**; format/merge/sort/filter/freeze; **CF 5 nhóm + DV 3 tab + Pivot/Table/Slicer/full chart/Name Manager/protection**; export xlsx/csv; 10.000 ô | AC-06, AC-13 |
| PowerPoint | Thumbnail/stage/overlay/slideshow/slide ops/**SmartArt/Icons/Chart/media/Cameo/theme/master**/**transition 6 + Morph + animation 3**/comments/ink/export | AC-07, AC-12, AC-13 |
| Legacy & PDF | `.doc/.xls/.ppt` read-only; PDF render/search/**annotation/rotate/thumbnail**; draft recovery; mã lỗi đúng | AC-08, AC-14 |
| Mobile | 4 định dạng, overflow 0, touch ≥ 40px, xoay ngang, tải xuống | AC-08 |
| Regression | Menu, URL state, draft, i18n sau khi sửa bug | Tất cả |

## 3. Quy trình thực thi

| Mã | Yêu cầu |
| :--- | :--- |
| 478-F01 | Dựng môi trường thật: `npm run infra` (PostgreSQL + Redis), MinIO profile khi test ERP Storage; không H2/mock. |
| 478-F02 | Seed 2 tenant + user mỗi tenant; 3 file Office mỗi định dạng (nhỏ/vừa/phức tạp). |
| 478-F03 | Desktop viewport `1440×900` và `1280×800`; Mobile emulation `390×844` và `844×390`. |
| 478-F04 | Mỗi ca ghi: ID, bước, kết quả mong đợi, thực tế, PASS/FAIL, ảnh, console count. |
| 478-F05 | Bắt `console.error` bằng DevTools; bất kỳ error nào = FAIL ca đó (trừ lỗi mạng do môi trường, phải chứng minh). |
| 478-F06 | Kiểm 0-upload: mở file local → ghi lại toàn bộ request; chỉ cho phép request tĩnh (`/assets`, plugin bundle). |
| 478-F07 | Đo `scrollWidth`, `innerWidth`, kích thước touch target bằng script, lưu JSON. |
| 478-F08 | Bug severity: `Critical` (mất dữ liệu/bảo mật), `High` (AC fail), `Medium` (UX lệch), `Low` (text/layout). |
| 478-F09 | Bug `Critical/High` phải có bước tái lập + ảnh/video; sửa xong phải chạy lại ca gốc + regression. |
| 478-F10 | Test Report ghi baseline commit hash, phiên bản plugin, ngày, người chạy. |

## 4. Tài liệu bàn giao

| Mã | Yêu cầu |
| :--- | :--- |
| 478-F11 | User Guide: cài/bật plugin, mở file local, mở ERP, sửa, lưu, export, khôi phục nháp, mobile; mỗi bước có ảnh. |
| 478-F12 | Deployment Guide: biến `office.document.*`, migration, quyền, backup/rollback, giới hạn 25MB. |
| 478-F13 | Developer Guide: cấu trúc module, worker protocol, cách chạy `office:roundtrip`, cách thêm hàm Excel, cách debug canvas. |
| 478-F14 | Ảnh trong guide phải là ảnh chụp thật từ build Sprint 12, không dùng ảnh Microsoft. |
| 478-F15 | `node .agents/skills/sdlc-workflow/scripts/check-docs.mjs docs/sprints/sprint_12_office_webapp` → 0 lỗi. |
| 478-F16 | Đối chiếu [AUDIT-S12-001](../03_benchmarks/04_AUDIT-S12-001_m365_web_command_coverage.md): 78 nhóm `CLIENT` phải có ≥1 ca test + bằng chứng; 13 nhóm `SERVICE` ghi rõ "không test theo yêu cầu"; 2 nhóm ERP test qua API. |

## 5. Acceptance checklist

- [ ] AC-478-01 Test Plan + Report tồn tại, có baseline và đủ 10 nhóm ca.
- [ ] AC-478-02 100% AC-01…AC-08 có ít nhất 1 ca PASS và ảnh/JSON kèm theo.
- [ ] AC-478-03 0 bug `Critical`/`High` còn mở tại thời điểm báo cáo.
- [ ] AC-478-04 Ảnh Desktop 1440/1280 + Mobile 390/844 cho Word/Excel/PPT/PDF (≥ 8 ảnh).
- [ ] AC-478-05 Log console: 0 `console.error` trên luồng chính cả 2 chế độ.
- [ ] AC-478-06 Network local: 0 request chứa nội dung file (có ảnh/log).
- [ ] AC-478-07 Mobile: `scrollWidth <= innerWidth` cho 4 định dạng, ghi số đo.
- [ ] AC-478-08 User Guide có ảnh; Deployment Guide có rollback; Developer Guide có lệnh chạy test.
- [ ] AC-478-09 `check-docs.mjs` 0 lỗi.
- [ ] AC-478-10 Report ghi rõ 13 nhóm `SERVICE` loại trừ theo `AUDIT-S12-001`; không có nhóm client nào bị cắt.
- [ ] AC-478-11 4 khu vực mới (Share ACL, Word Comment, Excel **toàn bộ catalogue hàm** + Pivot/CF/DV, PPT transition/animation/Morph) có ca PASS + bằng chứng riêng, không gộp chung "đã kiểm tra".
- [ ] AC-478-12 Audit coverage: 78/78 nhóm `CLIENT` có ca test tương ứng; 13 nhóm `SERVICE` được liệt kê loại trừ; 0 nhóm client bị bỏ sót.

## 6. Bằng chứng bàn giao

| File | Nội dung |
| :--- | :--- |
| `08_testing/01_TP-S12-001_test_plan.md` | Kế hoạch |
| `08_testing/02_TR-S12-001_test_report.md` | Kết quả + bug |
| `08_testing/evidence/` | Ảnh + `measure.json` + `network-local.json` + console log |
| `docs/06_user_guides/office-webapp/` | Guide + screenshots |
| `docs/07_deployment_guides/office-webapp.md` | Deploy/rollback |
| `docs/08_developer_guides/office-webapp/` | Dev guide |

## 7. Ngoài phạm vi

- Kiểm thử tự động E2E bằng framework (dự án không dùng cho frontend); chỉ manual + script đo.
- Load test > 1.000 user đồng thời.
- Kiểm thử trên Safari/Firefox ngoài phạm vi Chromium/Edge (ghi rõ nếu có chạy).

## 8. Rủi ro & cách xử lý

| Rủi ro | Cách xử lý |
| :--- | :--- |
| Ảnh chụp không tái lập được | Ghi viewport, theme, file fixture, commit hash trong report |
| Lỗi mạng giả `console.error` | Ghi rõ request lỗi + chứng minh môi trường, không bỏ qua mù |
| Bug High phát sinh muộn | Freeze scope; chỉ giãn tiến độ/chia sub-sprint, không cắt client; nhóm service giữ disabled + tooltip |

## 9. Lịch sử

| Phiên bản | Ngày | Thay đổi | Nguồn |
| :--- | :--- | :--- | :--- |
| 0.1 | 2026-11-15 | Phân rã task | Developer/QA |
| 0.2 | 2026-11-15 | Đặc tả 15 FR, ma trận 10 nhóm, 10 AC, bằng chứng | QA; BENCH-S12-003 |
| 0.3 | 2026-11-15 | Thêm nhóm Share ACL, Word Comment, Excel 60/CF/DV, PPT effects; `AC-11` theo 8 quyết định review | Chủ dự án; 8 câu hỏi tương tác |
| 0.4 | 2026-11-15 | Thêm đối chiếu AUDIT-S12-001 (`F16`, `AC-12`): 78 nhóm client phải có ca test, 13 nhóm service loại trừ | Chủ dự án; yêu cầu phủ sóng đầy đủ |
