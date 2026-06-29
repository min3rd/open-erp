# Testcase: TC-2.10 - Giao diện Form Builder (Web UI)
## Liên kết: TSK-2.10 | US-FORM-001 | US-FORM-002

| Môi trường | Dev local — `http://localhost:4200/admin/form-builder` |
|------------|--------------------------------------------------------|
| Auth | Tenant admin JWT |
| Tester | QA |
| Ngày | 2026-06-29 |

---

## Kịch bản kiểm thử

### TC-2.10-001: Tải trang Form Builder — Happy path
| # | Bước | Kết quả mong đợi |
|---|------|------------------|
| 1 | Navigate `/admin/form-builder` | Tiêu đề "Trình Thiết Kế Form Động" (Transloco) |
| 2 | Kiểm tra layout | Palette trái, canvas giữa, properties phải |
| 3 | Kiểm tra theme | Rose Gold accent, Feather Icons, Light/Dark toggle |

**Kết quả:** [ ] PASS / [ ] FAIL  
**Tham chiếu:** [task_10_manual_test_report.md](../tasks/task_10_manual_test_report.md) — đã PASS 2026-06-29

---

### TC-2.10-002: Thêm Panel và Field vào Canvas
| # | Bước | Kết quả mong đợi |
|---|------|------------------|
| 1 | Click panel "Toàn chiều rộng" | Panel render trên canvas |
| 2 | Thêm "Văn bản ngắn" + "Trường số" | Fields nằm trong panel |
| 3 | Chọn field | Viền Rose Gold, properties panel mở 3 tab |

**Kết quả:** [ ] PASS / [ ] FAIL

---

### TC-2.10-003: Preview mode — Responsive
| # | Bước | Kết quả mong đợi |
|---|------|------------------|
| 1 | Click "Xem thử" Desktop | Form render đầy đủ input |
| 2 | Chuyển Tablet | Canvas thu width tablet |
| 3 | Chuyển Mobile | Cột xếp chồng responsive |

**Kết quả:** [ ] PASS / [ ] FAIL

---

### TC-2.10-004: Lưu form — API integration
| # | Bước | Dữ liệu | Kết quả mong đợi |
|---|------|---------|------------------|
| 1 | Thiết kế form, bấm Lưu | `formKey: test-leave-form` | POST `/dynamic-forms` → `201`, version 1 |
| 2 | Sửa schema, Lưu lại | Cùng formKey | version 2, `isLatest: true` |
| 3 | GET `/dynamic-forms/key/:key/versions` | test-leave-form | ≥2 versions |

**Kết quả:** [ ] PASS / [ ] FAIL

---

### TC-2.10-005: Load form theo key
| # | Bước | Kết quả mong đợi |
|---|------|------------------|
| 1 | Mở Form Builder, nhập formKey đã lưu, Load | Schema hiển thị lại trên canvas |

**Kết quả:** [ ] PASS / [ ] FAIL  
**Gap audit:** UI gọi `GET /dynamic-forms/key/:key` nhưng backend chưa có endpoint — dùng `/versions` + chọn latest thay thế cho đến khi fix.

---

### TC-2.10-006: GRID field — cấu hình cột
| # | Bước | Kết quả mong đợi |
|---|------|------------------|
| 1 | Thêm linh kiện Grid/Table | Grid xuất hiện trên canvas |
| 2 | Tab GRID trong properties | Cấu hình ≥2 cột (Text, Number) |
| 3 | Preview + nhập dữ liệu | Inline edit hoạt động |
| 4 | POST validate với grid data | PASS hoặc lỗi field-level đúng schema |

**Kết quả:** [ ] PASS / [ ] FAIL

---

### TC-2.10-007: Validate schema — edge case
| # | Bước | Kết quả mong đợi |
|---|------|------------------|
| 1 | Field required, Preview submit trống | Hiển thị lỗi validation |
| 2 | POST `/dynamic-forms/:id/validate` thiếu field | `success: false`, `errors[]` có field name |

**Kết quả:** [ ] PASS / [ ] FAIL

---

### TC-2.10-008: i18n vi/en
| # | Bước | Kết quả mong đợi |
|---|------|------------------|
| 1 | Chuyển ngôn ngữ EN → VI | Labels palette/canvas đổi theo Transloco |
| 2 | Không có hardcode string tiếng Việt cố định khi EN active | |

**Kết quả:** [ ] PASS / [ ] FAIL

---

## Tổng hợp

| TC ID | Mô tả | Kết quả |
|-------|-------|---------|
| TC-2.10-001 | Tải trang | PASS (manual report) |
| TC-2.10-002 | Thêm panel/field | PASS (manual report) |
| TC-2.10-003 | Preview responsive | PASS (manual report) |
| TC-2.10-004 | Lưu form API | |
| TC-2.10-005 | Load form by key | BLOCKED (API gap) |
| TC-2.10-006 | GRID field | |
| TC-2.10-007 | Validate edge | |
| TC-2.10-008 | i18n | |
| **Tổng** | | **3/8 PASS** (3 từ manual report) |

## Code evidence
- UI: `open-erp-web/src/app/features/dynamic-form-builder/`
- Route: `app.routes.ts` → `admin/form-builder`
- Shared lib: `@open-erp/shared-ui` FormRenderer, DragPalette (TSK-2.18, TSK-2.19)
- Backend: `dynamic-form.controller.ts`
