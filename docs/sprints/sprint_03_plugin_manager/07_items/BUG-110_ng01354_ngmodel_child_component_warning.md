# BUG-110: Cảnh báo `NG01354` (ngModel trong child component) xuất hiện trên console

| Trường | Giá Trị |
| :--- | :--- |
| **Mã** | BUG-110 |
| **Mức độ** | Low |
| **Phát hiện bởi** | QA/QC Agent — log vite client trong khi chạy browser QA |
| **Ngày** | 2026-09-20 |
| **Trạng thái** | Resolved (2026-10-04 — chờ QA/Reviewer xác nhận) |
| **Liên quan** | Angular 22 template forms, các tab account (`account-detail-tab`, `account-security-tab`) |

## Fix (2026-10-04)

Thêm `[ngModelOptions]="{ standalone: true }"` cho control nội bộ của 3 shared component:
`SharpInputComponent`, `SharpSelectComponent`, `SharpTextareaComponent` — control không còn cố đăng ký
vào `NgForm` của component cha (nguồn NG01354), áp dụng chung cho Web + Mobile.
Build xác minh: `npm run build` Web PASS và Mobile PASS
(`08_testing/evidence/BUG-109_116_fix_verification_2026-10-04.txt`).

## Mô tả

Console (dev) xuất hiện cảnh báo lặp:

```
NG01354: ngModel on a form control inside a child component cannot register with the NgForm
in the parent component because @Host() stops injection at the component boundary.
```

- Đây là **warning**, không phải `console.error` → không vi phạm tiêu chí QA (0 console error).
- Nguồn: các template con dùng `[(ngModel)]` (ví dụ `account-detail-tab.component.html` dòng 44/56, `account-security-tab.component.html` dòng 49) khi được render trong ngữ cảnh có `<form>` ở component cha.

## Ảnh hưởng

Không chặn chức năng; chỉ có thể khiến control không đăng ký vào `NgForm` cha (validation `form.valid` không tính các control này). Các form hiện tại submit bằng handler riêng nên không lộ lỗi.

## Hướng xử lý đề xuất (Sprint 04)

1. Với control không cần thuộc form cha: thêm `[ngModelOptions]="{ standalone: true }"`.
2. Với control cần thuộc form: thêm `viewProviders: [{ provide: ControlContainer, useExisting: NgForm }]` vào component con.
3. Rà soát tương tự cho Mobile (`account-detail`, `register-business`, `roles`).
