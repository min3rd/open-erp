# [RAW-01] Ghi Chú Yêu Cầu Thô: Quản Lý Plugin Của Hệ Thống & Của Từng Tenant

- **Ngày tiếp nhận**: 2026-09-19
- **Người cung cấp**: Khách hàng (Product Owner / Founder)
- **Người ghi nhận**: BA Agent
- **Phương thức tiếp nhận**: Yêu cầu trực tiếp từ khách hàng (phiên làm việc lập kế hoạch Sprint 03)
- **Cập nhật gần nhất**: 2026-09-19 — bổ sung phản hồi làm rõ của khách hàng (Mục 4).

---

## 1. Nội Dung Yêu Cầu Nguyên Bản Từ Khách Hàng

> "Sprint 3 cần làm phần **quản lý các plugin của hệ thống, tenant**.
>
> - Tôi (chủ nền tảng) phải quản lý được **danh mục plugin của hệ thống**: plugin nào đang có, phiên bản nào, plugin đó hỗ trợ nền tảng nào (Web/Mobile), tương thích với phiên bản Core nào, phụ thuộc plugin nào khác.
> - Với **từng tenant**: tenant đã cài plugin nào, phiên bản gì, đang bật hay tắt, có cập nhật mới không; và tôi phải cài/gỡ/bật/tắt/nâng cấp được plugin cho tenant đó khi cần hỗ trợ.
> - Tenant Admin cũng phải tự vào được một màn hình **chợ plugin (Marketplace)** để cài/gỡ/bật/tắt các plugin mà gói dịch vụ của họ được phép dùng, không cần liên hệ kỹ thuật.
>
> Hiện tại Sprint 2 mới chỉ có danh sách plugin cấu hình cứng trong file cấu hình và trường `allowed_plugins` của tenant. Cần biến nó thành **Plugin Manager thực thụ** theo đúng Kiến trúc hệ thống đã định."

---

## 2. Bối Cảnh & Các Ràng Buộc Kèm Theo

1. **Kế thừa nền tảng Sprint 02**:
   - Đã có danh mục plugin tĩnh (`openerp.platform.plugin-catalog`) + API `GET /api/v1/platform/plugins`.
   - Đã có cơ chế allowlist theo tenant (`tenants.allowed_plugins`) và chốt chặn `TenantPluginAllowlistService` trả `PLATFORM_PLUGIN_NOT_ALLOWED`.
   - Sprint 03 phải **kế thừa và nâng cấp** hai thành phần trên, không làm phá vỡ hợp đồng API hiện có nếu chưa cần thiết.
2. **Tuân thủ SYSTEM_BLUEPRINT.md mục 2.1.5 (Plugin Engine & Registry)**:
   - Danh mục Plugin có sẵn (Catalog).
   - Quản lý trạng thái cài đặt của từng Tenant: `installed`, `active`, `inactive`, `uninstalled`.
   - Điều phối thực thi migration dữ liệu khi cài đặt, cập nhật hoặc gỡ bỏ.
3. **Cô lập dữ liệu tuyệt đối**: mọi bảng dữ liệu nghiệp vụ của plugin bắt buộc gắn `tenant_id`; migration cài/gỡ plugin phải chạy theo từng Tenant.
4. **Entity Registry**: mọi entity do plugin công bố phải đăng ký vào `sys_entity_registry` (đã có từ Sprint 01/02).
5. **An toàn vận hành**: gỡ plugin không được làm mất dữ liệu của tenant một cách âm thầm; cài plugin lỗi phải tự động rollback.
6. **Phân quyền**: chỉ Super Admin được quản lý danh mục plugin cấp hệ thống; Tenant Admin chỉ được cài/gỡ trong danh mục được cấp phép (theo gói dịch vụ / allowlist).
7. **Giao diện**: tuân thủ quy chuẩn ERP nhỏ gọn, vuông vắn, Anti-Modal (Drawer trượt + Split-Screen); toàn bộ văn bản qua i18n.

---

## 3. Các Từ Khóa Nghiệp Vụ Chính

- Plugin Catalog (Danh mục plugin), Plugin Version (SemVer), Core Compatibility.
- Tenant Plugin Installation (Cài đặt theo tenant), Enable/Disable, Upgrade, Uninstall.
- Plugin Marketplace (Chợ plugin của Tenant).
- Migration theo tenant (plugin tự chạy), Soft Uninstall (giữ dữ liệu).
- Entitlement (Quyền được cài theo gói/allowlist), Dependency (Phụ thuộc giữa các plugin).
- Entity Registry, Permission Seeding, Menu/Route Injection.
- Cài mặc định cấp hệ thống (Platform Default Install), Đa phiên bản song song (Multi-version per Tenant).
- Container-per-Tenant, Thông báo tenant bị ảnh hưởng.
- Schema-per-Tenant / Database-per-Tenant, Tenant Datasource Router, DB role least privilege.
- Audit Log vòng đời plugin.

---

## 4. Phản Hồi Làm Rõ Của Khách Hàng (2026-09-19)

> Toàn bộ câu hỏi mở đã được khách hàng trả lời trong phiên review Bước 1-2 ngày 2026-09-19. Phản hồi dưới đây được ghi nhận trung thực và đã được phản ánh vào tài liệu phân tích (ANL-01 v1.1).

- [x] **Q1 (Nguồn entitlement)**: **Dùng chung 1 bảng duy nhất** cho tường minh — gộp quyền được cài (entitlement) và trạng thái cài đặt vào cùng một bảng.
- [x] **Q2 (Gỡ plugin & dữ liệu)**: **Chỉ gỡ plugin, giữ nguyên dữ liệu**; bắt buộc đảm bảo dữ liệu do plugin sinh ra **không làm hỏng hệ thống**. Không đặt cơ chế purge trong Sprint 03.
- [x] **Q3 (Khóa plugin)**: **Cưỡng chế gỡ khỏi toàn bộ tenant đã/đang cài** + **gửi thông báo đến các tenant bị ảnh hưởng**.
- [x] **Q4 (Core & module nền tảng)**: **Tách riêng biệt** khỏi cơ chế plugin để dễ quản lý và nâng cấp.
- [x] **Q5 (Cài cấp hệ thống)**: **Có** — nhiều plugin được cài mặc định ở cấp hệ thống; tenant đăng ký mới sẽ được áp dụng tự động.
- [x] **Q6 (Marketplace)**: **Chỉ hiển thị plugin đã được cấp phép**.
- [x] **Q7 (Dùng thử plugin)**: **Không có cơ chế dùng thử**; nếu khách muốn dùng thử thì đơn vị phát triển plugin tự triển khai.
- [x] **Q8 (Phụ thuộc khi gỡ)**: **Có chặn gỡ** và đưa ra **lộ trình thứ tự gỡ** nếu người dùng mong muốn tiếp tục.
- [x] **Q9 (Bổ sung làm rõ 2026-09-19 — quyền đăng ký custom plugin)**: **Không chỉ Super Admin** — **Tenant Admin cũng có thể đăng ký/cài custom plugin cho tenant của họ** (plugin riêng, `visibility = TENANT_PRIVATE`, chỉ áp dụng cho tenant sở hữu).
- [x] **Q10 (Bổ sung làm rõ 2026-09-19 — cô lập dữ liệu)**: Rủi ro khách hàng nêu: nếu các tenant dùng chung schema/CSDL thì custom plugin migrate sẽ ảnh hưởng tenant khác. Yêu cầu: **có cơ chế để dữ liệu riêng của các tenant nằm ở schema và database khác nhau** (mô hình `DEDICATED_SCHEMA` mặc định, `DEDICATED_DATABASE` cho Enterprise; DB role least privilege).
