# Hệ Thống Tài Liệu Dự Án Open-ERP (Docs-driven Architecture)

Thư mục này là trung tâm giao tiếp và bàn giao công việc giữa các Agent và Khách Hàng trong dự án theo quy trình SDLC chuẩn mực 9 bước với **Mô hình Sprint-Pack Tuần Tự (00 - 09)**.

## Cấu Trúc Thư Mục Chuẩn Mực

```
docs/
├── sprints/                         # Quản lý trọn gói toàn bộ tài liệu theo từng Sprint
│   ├── sprint_01_core_iam/          # Gói Sprint 01 - Core Identity & Access Management (ĐÃ ĐÓNG)
│   ├── sprint_02_superadmin_rbac/   # Gói Sprint 02 - Super Admin, RBAC & Multi-Scope Data Access (ĐÃ ĐÓNG 2026-09-19)
│   │   ├── 00_READING_GUIDE.md      # BẢN ĐỒ ĐỌC BẮT ĐẦU: Lộ trình đọc tuần tự & Checklist Confirm
│   │   ├── 01_raw_notes/            # Bước 1: Tiếp nhận yêu cầu thô (BA Agent)
│   │   ├── 02_analysis/             # Bước 2: Phân tích nghiệp vụ & User Stories (BA Agent)
│   │   ├── 03_benchmarks/           # Bước 3: Nghiên cứu đối chuẩn hệ thống tương tự (BA Agent)
│   │   ├── 04_confirmation/         # Bước 4: BIÊN BẢN XÁC NHẬN VỚI KHÁCH HÀNG (CONFIRMATION GATE)
│   │   ├── 05_solutions/            # Bước 5: Nghiên cứu giải pháp kỹ thuật (Solution Architect)
│   │   ├── 06_designs/              # Bước 6: Thiết kế chi tiết DB, API, UI/UX (Solution Architect)
│   │   ├── 07_items/                # Bước 7: Phân rã nhiệm vụ dạng file (FEAT-10 -> FEAT-16)
│   │   ├── 08_testing/              # Bước 8: Kế hoạch & Báo cáo kiểm thử (QA/QC Agent)
│   │   └── 09_review/               # Bước 9: Biên bản nghiệm thu đóng Sprint (PM Agent)
│   ├── sprint_03_plugin_manager/    # Gói Sprint 03 - Plugin Manager, Plugin CLI & Phân phối plugin (ĐANG THỰC HIỆN BƯỚC 1-2 — CHỜ REVIEW)
│   └── sprint_XX_.../               # Các Sprint tiếp theo độc lập tương tự
├── system/                          # Tài liệu kiến trúc toàn cục dùng chung toàn hệ thống
│   ├── architecture/                # Kiến trúc tổng thể, SYSTEM_BLUEPRINT.md, Sequence Diagrams
│   ├── entity_registry/             # Danh bạ đăng ký thực thể dùng chung giữa các Plugin
│   └── templates/                   # Biểu mẫu thiết kế kỹ thuật & PLUGIN_SPEC_TEMPLATE.md
├── project_management/              # Quản lý tiến độ tổng quan toàn dự án (PM Agent)
│   ├── task_board.md                # Bảng trạng thái công việc tổng quan
│   ├── work_log.md                  # Nhật ký cập nhật công việc hàng ngày
│   └── changelog.md                 # Lịch sử phiên bản và thay đổi
├── 06_user_guides/                  # Hướng Dẫn Sử Dụng (Bắt buộc có hình ảnh trực quan)
│   ├── TEMPLATE.md                  # Mẫu hướng dẫn sử dụng chuẩn
│   ├── sprint_01_core_iam_user_guide.md          # UG-01: Core IAM (ĐÃ BAN HÀNH)
│   ├── sprint_02_superadmin_rbac_user_guide.md   # UG-02: Super Admin, RBAC & Data Scopes (ĐÃ BAN HÀNH)
│   └── assets/                      # Hình ảnh screenshots, diagrams minh họa (sprint_01_core_iam/, sprint_02_superadmin_rbac/)
├── 07_deployment_guides/            # Hướng Dẫn Cài Đặt & Triển Khai
│   ├── local_setup_guide.md         # Hướng dẫn chạy môi trường Local với Docker Compose
│   ├── docker_deployment_guide.md   # Hướng dẫn đóng gói Docker & triển khai Staging
│   └── k8s_production_guide.md      # Hướng dẫn triển khai Kubernetes Production
└── 08_developer_guides/             # Hướng Dẫn Phát Triển Phần Mềm
    ├── coding_standards.md          # Quy chuẩn lập trình Quarkus Java & Angular 22
    ├── create_new_plugin_guide.md   # Hướng dẫn phát triển một Plugin mới
    └── shared_ui_contribution_guide.md # Hướng dẫn đóng góp Component vào thư viện dùng chung
```

## Quy Định Bàn Giao, Kiến Trúc & Quản Lý Agile
1. **Trước khi bắt đầu bất kỳ bước nào**, Agent phải kiểm tra tài liệu đầu ra của bước trước đó.
2. **Không tự ý code** khi chưa có biên bản xác nhận từ khách hàng tại `docs/sprints/sprint_XX_<tên_sprint>/04_confirmation/` và tài liệu thiết kế tại `docs/sprints/sprint_XX_<tên_sprint>/06_designs/`.
3. **Tuân thủ Kiến trúc Cốt Lõi**: Tham chiếu [SYSTEM_BLUEPRINT.md](system/architecture/SYSTEM_BLUEPRINT.md). Core chỉ gồm Auth, Account, RBAC, Data RBAC, Plugin Manager, Entity Registry. Mọi nghiệp vụ khác phải xây dựng dạng Plugin độc lập.
4. **Chuẩn Công Nghệ Bắt Buộc**:
   - Backend: **Quarkus** (ngôn ngữ chuẩn: **Java**, phiên bản Java LTS 21+).
   - Frontend: **Angular >= 22** + **Tailwind CSS v4** (Web) và **Ionic 8 + Angular** (Mobile).
   - Data & Messaging: **PostgreSQL** (hỗ trợ Shared DB / Database-per-Tenant, cơ chế Master - Slave / Read-Replicas) + **MongoDB** (Replica-Set HA khi cần) + **Redis** (cache/session) + **Apache Kafka** (message broker).
5. **Quy Tắc Thư Viện Dùng Chung (Component-First Rule)**: Mọi component giao diện mới phải được đưa vào `shared-ui-lib` trước khi sử dụng trong Web hoặc Mobile. Hạn chế tối đa thư viện bên thứ 3.
6. **Phân Định Nền Tảng (Desktop vs. Mobile)**: Mọi Plugin phải phân tách rõ chức năng hỗ trợ trên Desktop (đầy đủ) và Mobile (tối giản).
7. **Đăng Ký Thực Thể (Entity Registry)**: Mọi entity CSDL của module/plugin bắt buộc phải đăng ký vào Entity Registry chung để các plugin khác có thể tham chiếu.
8. **Cô lập dữ liệu Tenant**: Tuyệt đối không để rò rỉ dữ liệu chéo giữa các Tenant. Mọi thao tác CSDL phải có điều kiện `tenant_id`.
9. **Quản lý Version & Data Migration**: Mỗi Plugin phải có phiên bản SemVer và kịch bản migration riêng biệt (`up`/`down`) cho từng Tenant khi cài đặt, nâng cấp hoặc gỡ bỏ.
10. **Mỗi yêu cầu/lỗi là một file riêng**: Mọi task, bug, feature, refactor phát sinh phải được lập file độc lập trong thư mục `07_items/` của Sprint tương ứng để theo dõi trạng thái, tránh bỏ sót.
11. **Điều kiện đóng Sprint (Sprint DoD Gate)**: Một Sprint **chỉ được phép đóng** khi không còn bất kỳ task, bug nào có mức độ ưu tiên **lớn hơn Medium (`Critical`, `High`)** chưa hoàn tất. Mọi item mức `Critical` và `High` bắt buộc phải `Done`.
12. Mọi tài liệu mới cần được đặt tên theo quy ước: `<mã_tính_năng>_<tên_ngắn_gọn>.md` (Ví dụ: `FEAT-01_user_authentication.md`).
13. **Tài liệu Hướng Dẫn Sử Dụng (User Guides)**: Phải đặt trong `docs/06_user_guides/` và **bắt buộc phải có hình ảnh trực quan** (screenshots, mockups, sơ đồ từ thư mục `assets/`). Nghiêm cấm hướng dẫn thuần văn bản thiếu minh họa. **Tên file bắt buộc có tiền tố thứ tự Sprint**: `sprint_XX_<tên_nghiệp_vụ>_user_guide.md` (ví dụ `sprint_01_core_iam_user_guide.md`) để người đọc biết thứ tự đọc.
14. **Tài liệu Triển Khai & Phát Triển**: Mọi thay đổi về kiến trúc, plugin, quy trình build/run/deploy bắt buộc phải cập nhật đồng bộ vào `docs/07_deployment_guides/` (Local Docker Compose, Staging/Prod K8s) và `docs/08_developer_guides/` (Coding standards, Plugin guide, Shared UI guide).
15. **Chính Sách Kiểm Thử Thực Dụng**: Unit Test chỉ viết cho logic nghiệp vụ backend (Quarkus Java). Tuyệt đối KHÔNG viết unit test cho frontend (Angular/Ionic). QA/QC bắt buộc thực hiện kiểm thử thủ công trực tiếp trên trình duyệt (Browser Manual Testing).
16. **Quy Chuẩn UI/UX ERP Nhỏ Gọn & Anti-Modal**: Giao diện thiết kế theo phong cách công nghiệp hiện đại, mật độ thông tin cao (font chữ nhỏ `text-xs`/`text-sm`, đệm hẹp `p-1`/`p-2`), vuông vắn (`rounded-none`/`rounded-sm`). Hạn chế tối đa Modal; thay thế bằng Angular Router, Drawer trượt từ cạnh phải (hỗ trợ xếp chồng đa tầng) và Chia màn hình đa phần (Split-Screen).
17. **Chuẩn Mực API Contract Đa Ngôn Ngữ (i18n Code-Driven)**: Mọi API response bắt buộc phải trả về thuộc tính `code` dạng `UPPER_SNAKE_CASE` đại diện cho kết quả/mã lỗi. Tuyệt đối không hardcode text tiếng Việt hay ngôn ngữ địa phương trong API contract làm message người dùng. Frontend tự quản lý từ điển đa ngôn ngữ (`i18n/{lang}.json`) để hiển thị theo `code` và `params`.
