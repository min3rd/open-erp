# Chi tiết vai trò SDLC

## PM (Project Manager / Product Owner)

**Mục tiêu:** Đảm bảo đúng việc, đúng thời điểm, đúng priority.

**Trách nhiệm:**
- Thu thập yêu cầu từ stakeholder; phân loại Epic / Feature / Story
- Ưu tiên backlog (P0–P3); lập sprint goal và capacity
- Theo dõi dependency giữa sprint; cập nhật trạng thái trên sprint README
- Chốt scope MVP vs out-of-scope

**Không làm:** viết chi tiết API, thiết kế UI pixel-perfect, code.

**Output:** `product_backlog.md`, sprint `README.md`, quyết định go/no-go phase.

---

## BA (Business Analyst)

**Mục tiêu:** Chuyển nhu cầu kinh doanh thành spec có thể implement và test.

**Trách nhiệm:**
- Cập nhật PRD (vision, goals, personas) khi cần
- Viết/cập nhật URS: luồng nghiệp vụ, màn hình, entity, business rules
- Viết SRS: yêu cầu chức năng/phi chức năng kỹ thuật, validation, integration
- User Stories dạng: *Là [persona], tôi muốn [action] để [benefit]*
- Acceptance Criteria: kịch bản Given/When/Then hoặc checklist đo được

**Gate checklist:**
- [ ] Mỗi story có ID (US-XXX)
- [ ] AC không chứa từ mơ hồ ("nhanh", "đẹp", "dễ dùng" — phải quantifiable)
- [ ] Business rules có xử lý lỗi tương ứng

---

## UI/UX Designer

**Mục tiêu:** Trải nghiệm nhất quán, accessible, đúng brand.

**Trách nhiệm:**
- Sitemap: vị trí màn hình trong IA
- Wireframe/mockup: layout, component, flow chuyển màn hình
- Trạng thái UI: default, loading, empty, error, success, disabled
- Responsive: desktop / tablet / mobile
- Design tokens: Rose Gold `#B76E79`, shared-ui components

**Gate checklist:**
- [ ] Mọi màn hình trong URS có wireframe
- [ ] Form có validation message placement
- [ ] Dark/Light mode được mô tả

---

## Tech Lead

**Mục tiêu:** Giải pháp kỹ thuật khả thi, an toàn, maintainable.

**Trách nhiệm:**
- Thiết kế/cập nhật schema, API, kiến trúc module
- Chia Task: BE, FE Web, FE Mobile, DevOps (nếu cần)
- Định nghĩa DoD kỹ thuật, local dev steps
- Review impact: RLS multi-tenant, auth, i18n, performance

**Gate checklist:**
- [ ] API endpoint + request/response + error codes
- [ ] Entity/field mapping với URS
- [ ] Dependency sprint/task đã liệt kê
- [ ] Security: tenant isolation, input validation

**Stack open-erp:**
- Backend: NestJS, PostgreSQL, Redis, TypeORM
- Web: Angular + Tailwind + Transloco
- Mobile: Ionic + shared-ui
- UI lib: `@open-erp/shared-ui`

---

## Programmer

**Mục tiêu:** Implement đúng spec, test được, dễ review.

**Trách nhiệm:**
- Đọc Task + mockup + API spec trước khi code
- Tuân thủ ESLint/Prettier, cấu trúc module hiện có
- Unit test cho logic nghiệp vụ quan trọng
- Cập nhật i18n keys; không hardcode string UI
- Ghi deliverables vào Task khi hoàn thành

**Không làm:** đổi scope không qua PM/BA; bỏ qua test vì "nhỏ".

---

## QA (Quality Assurance)

**Mục tiêu:** Xác minh sản phẩm đáp ứng AC trước khi coi là Done.

**Trách nhiệm:**
- Testcase từ AC: functional, regression, edge, basic security (XSS/SQLi input)
- Manual test Web + Mobile khi có UI
- Bug report đầy đủ: steps, expected, actual, severity, screenshots
- Manual test report cho feature phức tạp
- Xác nhận DoD trước khi đóng Task

**Severity:**
- 🔴 Critical — blocker, data loss, security
- 🟠 High — feature chính không dùng được
- 🟡 Medium — workaround tồn tại
- 🟢 Low — cosmetic

**Gate checklist:**
- [ ] 100% AC có ít nhất 1 testcase
- [ ] Critical/High bug = 0 trước Done
- [ ] Regression pass cho module liên quan
