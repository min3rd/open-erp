# TASK-SPRINT-02-FRONTEND-004: Thư viện UI dùng chung cho Web + Mobile

## Thông tin

| Thuộc tính       | Giá trị                                                                 |
|------------------|-------------------------------------------------------------------------|
| Task ID          | TASK-SPRINT-02-FRONTEND-004                                             |
| Sprint           | Sprint 02                                                               |
| Cluster          | frontend                                                                |
| Loại             | Frontend                                                                |
| Người phụ trách  | Frontend                                                                |
| Story Points     | 8                                                                       |
| Trạng thái       | ⬜ TODO                                                                 |
| Phụ thuộc        | TASK-SPRINT-01-FRONTEND-001, TASK-SPRINT-02-MOBILE-001                 |

## Mô tả

Thiết lập thư viện giao diện dùng chung giữa Angular Web (`open-erp-web`) và Ionic Mobile (`open-erp-mobile`) theo kiến trúc micro-frontend. Chuẩn hóa design tokens bằng CSS variables, tách component primitives tái sử dụng, và đảm bảo khả năng đóng gói theo workspace library.

## Phạm vi kỹ thuật

### Frontend Shared Library

**Cấu trúc đề xuất:**
```
libs/
└── ui-shared/
    ├── src/
    │   ├── lib/
    │   │   ├── components/
    │   │   │   ├── erp-button/
    │   │   │   ├── erp-input/
    │   │   │   ├── erp-modal/
    │   │   │   ├── erp-status-badge/
    │   │   │   └── erp-theme-toggle/
    │   │   ├── directives/
    │   │   ├── tokens/
    │   │   │   ├── color.tokens.css
    │   │   │   ├── typography.tokens.css
    │   │   │   └── spacing.tokens.css
    │   │   └── theme/
    │   │       └── theme.css
    │   └── public-api.ts
    └── README.md
```

### Quy ước styling

- Web dùng CSS thay vì SCSS.
- Shared UI chỉ publish file `.css` và CSS variables cho cả web/mobile.
- Không đưa business style theo từng màn hình vào shared library.
- Token naming thống nhất: `--erp-color-primary`, `--erp-space-4`, `--erp-font-body`.

### Danh sách component ưu tiên Sprint 02

- `erp-button`: variant primary/secondary/ghost + size + loading state.
- `erp-input`: state default/error/disabled, hỗ trợ helper text.
- `erp-modal`: header/body/footer slots, keyboard escape, focus trap.
- `erp-status-badge`: semantic status (`success`, `warning`, `error`, `info`).
- `erp-theme-toggle`: chuyển light/dark, tương thích localStorage và Capacitor Preferences.

### Tích hợp micro-frontend/multi-app

- Angular Web Shell import qua workspace path alias.
- Ionic Mobile import lại cùng package UI, chỉ override adapter phần native behavior khi cần.
- Đảm bảo tree-shaking để giảm kích thước bundle.

## API Endpoints sử dụng

Task này không thêm endpoint backend mới. Chỉ tiêu thụ endpoint hiện có của từng màn hình.

## Acceptance Criteria

- [ ] Tạo thành công thư viện `ui-shared` và dùng được từ cả web + mobile.
- [ ] Tất cả component trong thư viện dùng CSS (không dùng SCSS).
- [ ] Có tối thiểu 5 component primitives sẵn sàng tái sử dụng.
- [ ] Theme tokens (light/dark) dùng chung và không trùng lặp giữa web/mobile.
- [ ] `erp-theme-toggle` hoạt động nhất quán trên web và mobile.
- [ ] Tài liệu hướng dẫn sử dụng component được tạo trong README của library.
- [ ] Unit test coverage cho thư viện >= 80%.

## Ghi chú kỹ thuật

- Ưu tiên dùng standalone components để đồng nhất Angular 21.
- Tránh phụ thuộc chéo ngược từ shared library sang feature modules.
- Mọi text label trong component phải hỗ trợ đầu vào key để tích hợp Transloco.
