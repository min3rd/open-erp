# [BUG-125] Chế độ bo tròn làm mọi thứ biến dạng (nút thành viên thuốc, toggle méo)

| Trường | Giá trị |
| :--- | :--- |
| ID / loại / sprint | BUG-125 / Bug / Sprint 04 |
| Severity / trạng thái | High / **In Review** (đã sửa, đo lại PASS) |
| Owner/agent / reviewer | Developer (agent) / Chưa phân công |
| Cập nhật / input version | 2026-10-05 / phản hồi chủ dự án: "ở chế độ bo tròn thì nhìn cái gì cũng xấu" (kèm ảnh) |
| depends_on / blocks / parent | TASK-373, TASK-374 / — / [FEAT-24](FEAT-24_theme_system_and_design_tokens.md) |

## 1. Hiện tượng và nguyên nhân

Thang bo góc của shape `rounded` là `control 12px / container 16px` — quá lớn với UI mật độ cao:

- Nút cao ~28px với bán kính 12px ⇒ gần thành viên thuốc (kiểu consumer, vi phạm quy chuẩn UI/UX).
- Các phần tử nhỏ (track toggle 16px, badge ~16px, select switcher ~20px, ô pagination) dùng chung `rounded-control` nên bị bo quá nửa chiều cao ⇒ méo; thêm nữa knob của toggle lại vuông nên **lệch kiểu** với track.

## 2. Cách sửa

- Hạ thang: **control/container/inline = sharp 0/0/0 · soft 4/8/2 · rounded 8/12/4**.
- Thêm token `--op-radius-inline` (utility `rounded-inline`) cho phần tử nhỏ, áp cho: track + knob `sharp-toggle`, `badge`, nút `pagination`, select/nút/segment trong `theme-switcher`, select `language-switcher`.
- Knob toggle dùng cùng token với track nên hai phần đồng bộ ở mọi shape.

## 3. Kiểm chứng (computed style, trình duyệt)

| Phần tử | sharp | soft | rounded |
| :--- | :--- | :--- | :--- |
| Nút (`sharp-button`) | 0px | 4px | **8px** |
| Input (`sharp-input`) | 0px | 4px | **8px** |
| Badge | 0px | 2px | **4px** |
| Panel/bảng (`rounded-container`) | 0px | 8px | **12px** |

Ảnh: `%TEMP%/opencode/fix3/roles-{sharp,soft,rounded}.png`. Commit `0add952`.
