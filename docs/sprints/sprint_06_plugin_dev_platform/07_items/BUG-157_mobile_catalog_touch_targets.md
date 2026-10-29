# [BUG-157] Mobile catalog: touch target nhỏ hơn 40px (`API`, `Cây`)

| Trường | Giá trị |
| :--- | :--- |
| ID / loại / sprint | BUG-157 / Bug UI/UX / Sprint 06 |
| Mức độ / trạng thái | **Low** / **Resolved (QA)** 2026-10-29 |
| Phát hiện bởi / ngày | QA/QC Agent / 2026-10-29 |
| Owner / reviewer | Developer / QA |
| Liên quan | [AC-19](../04_confirmation/01_CONF-S06-001_sprint_06_scope_and_questions.md), [TASK-420](TASK-420_catalog_web_component_migration.md), quy chuẩn QA mobile ≥40px |

## 1. Mô tả

Trên catalog mobile 390×844, hai nút trong thanh chế độ xem có kích thước nhỏ hơn ngưỡng 40px:

- `API`: 29×40px
- `Cây`: 30×40px

Các nút còn lại đạt ≥40px. Vi phạm quy chuẩn touch target mobile trong [agent_qa.md](../../../../.agents/rules/agent_qa.md).

## 2. Các bước tái hiện

1. Ionic 390×844 → `/settings/catalog`.
2. Đo `getBoundingClientRect()` của các nút `API`, `Cây`.

**Mong muốn:** mọi touch target ≥40×40px.
**Thực tế:** width 29–30px.

## 3. Bằng chứng

- [Ảnh mobile catalog](../08_testing/evidence/sprint_06/13_mobile_catalog_readonly_390.png)
- [Số đo runtime](../08_testing/evidence/sprint_06/mobile-catalog-measure.json): `[{"text":"API","w":29,"h":40},{"text":"Cây","w":30,"h":40}]`.

## 4. Hướng sửa đề xuất

- Thêm `min-w-10` (40px) cho các nút chế độ xem trong catalog mobile/read-only.

## 5. Cách sửa & kiểm chứng

- Thêm `min-h-10 min-w-10` cho nút `API`, chế độ xem và phân trang shared.
- **Kiểm chứng:** mobile catalog không còn target < 40px (`small=[]`); ảnh `evidence/sprint_06_retest/14_mobile_catalog_fixed.png`.

## 6. Lịch sử

| Phiên bản | Ngày | Thay đổi | Nguồn |
| :--- | :--- | :--- | :--- |
| 0.1 | 2026-10-29 | Tạo bug từ QA browser 390×844 | TR-S06-001 / TASK-423 |
| 0.2 | 2026-10-29 | Tăng touch target; QA re-test PASS | Developer/QA |
