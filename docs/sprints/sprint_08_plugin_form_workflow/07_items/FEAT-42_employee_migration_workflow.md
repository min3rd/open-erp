# [FEAT-42] Migration luồng duyệt employee sang workflow engine (phương án C)

| Trường | Giá trị |
| :--- | :--- |
| ID / loại / sprint | FEAT-42 / FEAT / Sprint 08 |
| Trạng thái / phiên bản / cập nhật | To Do / 0.1 / 2026-11-02 |
| Owner | Developer Agent |
| Đầu vào | [ADR-S08-004](../05_solutions/05_ADR-S08-004_employee_migration_cutover.md), [CONF-S08-001](../04_confirmation/01_CONF-S08-001_sprint_08_scope_and_ac.md) Q3 + §5, [DES-ARCH-S08-001](../06_designs/arch/01_DES-ARCH-S08-001_components_and_flows.md) §2.4, [DES-UI-S08-001](../06_designs/ui/01_DES-UI-S08-001_form_workflow_ui.md) §5 |
| Phụ thuộc | FEAT-40 (engine), FEAT-41 (event hub); release phối hợp employee 1.2.0 + workflow ≥ 1.0.0 |

## Phạm vi

- Employee 1.2.0: thêm cột `workflow_instance_id` (V1.2.0); `openChangeRequest` → mở instance workflow qua internal API; approve/reject → proxy task action (engine enforce identity); UI giữ nguyên shape, tab config read-only + link workflow; `applyChangeRequest` kích hoạt bởi event `workflow.instance.completed`.
- Import data: `plg_employee_approval_config` + đề xuất đang mở → workflow definition + instance đúng `current_step`; đánh dấu deprecated 2 bảng cũ (drop ở phiên bản sau).
- Cutover theo ADR-S08-004 §2.4: regression E2E tenant QA, suite Core 254 + employee mới PASS, rollback drill snapshot.

## Checklist

- [ ] Employee V1.2.0 migration + service đổi runtime sang internal workflow API
- [ ] Import config/open requests → definition/instance (script + verify)
- [ ] UI: tab config read-only + link; drawer steps từ workflow; i18n
- [ ] Regression: E2E đề xuất mới/đề xuất import/từ chối/rút lui/đổi người duyệt; rollback drill

## AC truy vết

AC-W13, AC-W05, AC-W07, AC-W09, AC-W11 ([CONF-S08-001 §4](../04_confirmation/01_CONF-S08-001_sprint_08_scope_and_ac.md)).
