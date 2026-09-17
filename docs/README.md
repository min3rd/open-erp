# Hệ Thống Tài Liệu Dự Án Open-ERP (Docs-driven Architecture)

Thư mục này là trung tâm giao tiếp và bàn giao công việc giữa các Agent trong dự án theo quy trình SDLC chuẩn mực 9 bước.

## Cấu Trúc Thư Mục

```
docs/
├── 01_requirements/                 # Giai đoạn 1: Thu thập & Phân tích yêu cầu (BA Agent)
│   ├── raw_notes/                   # 1. Ghi chú yêu cầu thô nhận qua truyền miệng/chat
│   ├── analysis/                    # 2. Phân tích nghiệp vụ chi tiết & User Stories
│   ├── benchmarks/                  # 3. Nghiên cứu giải pháp tương tự (Odoo, ERPNext...)
│   └── confirmations/               # 4. Biên bản xác nhận yêu cầu & nghiệm thu với khách hàng
├── 02_solutions/                    # Giai đoạn 2: Nghiên cứu giải pháp & công nghệ (Architect Agent)
├── 03_designs/                      # Giai đoạn 3: Thiết kế giải pháp chi tiết (Architect Agent)
│   ├── architecture/                # Kiến trúc tổng thể & Sequence Diagrams
│   ├── database/                    # ERD, cấu trúc bảng dữ liệu, khóa, chỉ mục
│   ├── api/                         # Đặc tả REST/GraphQL API (Request/Response)
│   └── ui_ux/                       # Cấu trúc Component & Luồng tương tác giao diện
├── 04_testing/                      # Giai đoạn 4: Đảm bảo chất lượng & Kiểm thử (QA/QC Agent)
│   ├── test_plans/                  # Kế hoạch kiểm thử tổng thể
│   ├── test_cases/                  # Danh sách kịch bản test chi tiết
│   └── test_reports/                # Báo cáo kết quả kiểm thử (Pass/Fail, Bugs)
└── 05_project_management/           # Giai đoạn 5: Quản lý tiến độ & Bàn giao (PM Agent)
    ├── task_board.md                # Bảng trạng thái công việc tổng quan
    ├── work_log.md                  # Nhật ký cập nhật công việc hàng ngày
    ├── changelog.md                 # Lịch sử phiên bản và thay đổi
    ├── templates/                   # Biểu mẫu chuẩn (Task, Bug, Feature, Refactor, Sprint)
    └── sprints/                     # Quản lý theo mô hình Agile Sprints
        ├── backlog/                 # Backlog chung chưa phân bổ vào Sprint
        └── sprint_XX/               # Thư mục riêng cho từng Sprint
            ├── sprint_plan.md       # Kế hoạch & mục tiêu Sprint
            ├── sprint_review.md     # Đánh giá & nghiệm thu đóng Sprint
            └── items/               # Từng file TASK, BUG, FEAT, REFACTOR riêng biệt
```

## Quy Định Bàn Giao & Quản Lý Agile
1. **Trước khi bắt đầu bất kỳ bước nào**, Agent phải kiểm tra tài liệu đầu ra của bước trước đó.
2. **Không tự ý code** khi chưa có biên bản xác nhận từ khách hàng tại `docs/01_requirements/confirmations/` và tài liệu thiết kế tại `docs/03_designs/`.
3. **Mỗi yêu cầu/lỗi là một file riêng**: Mọi task, bug, feature, refactor phát sinh phải được lập file độc lập trong thư mục `items/` của Sprint tương ứng để theo dõi trạng thái, tránh bỏ sót.
4. **Điều kiện đóng Sprint (Sprint DoD Gate)**: Một Sprint **chỉ được phép đóng** khi không còn bất kỳ task, bug nào có mức độ ưu tiên **lớn hơn Medium (`Critical`, `High`)** chưa hoàn tất. Mọi item mức `Critical` và `High` bắt buộc phải `Done`.
5. Mọi tài liệu mới cần được đặt tên theo quy ước: `<mã_tính_năng>_<tên_ngắn_gọn>.md` (Ví dụ: `FEAT-01_user_authentication.md`).
