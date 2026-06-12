# Danh sách Product Backlog & Câu chuyện người dùng (Product Backlog & User Stories)
## Dự án: Nền tảng SaaS quản trị doanh nghiệp hợp nhất - Enterprise SaaS Platform

---

### 1. Bảng Product Backlog mẫu (Đại diện các Epic chính)

| ID | Epic | Feature | User Story | Priority | Business Value | Complexity (SP) | Dependencies | Suggested Sprint |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **US-001** | Hệ thống lõi | Đăng ký Tenant | Đăng ký doanh nghiệp và kích hoạt Workspace. | P0 | High | 5 | None | Sprint 1 |
| **US-002** | Hệ thống lõi | Authentication | Đăng nhập tài khoản bằng email & mật khẩu. | P0 | High | 3 | US-001 | Sprint 1 |
| **US-003** | Quy trình duyệt | Cấu hình luồng | Thiết lập quy trình phê duyệt động. | P0 | High | 8 | US-002 | Sprint 2 |
| **US-004** | Công việc | Giao việc | Tạo mới và giao công việc cho nhân sự. | P0 | High | 5 | US-002 | Sprint 3 |
| **US-005** | Công việc | Kanban board | Theo dõi trạng thái công việc dạng Kanban. | P0 | Medium | 5 | US-004 | Sprint 3 |
| **US-006** | CRM / Sales | Quản lý Lead | Tiếp nhận và cập nhật trạng thái Lead. | P0 | High | 5 | US-002 | Sprint 4 |
| **US-007** | CRM / Sales | Báo giá | Tạo và xuất file PDF báo giá khách hàng. | P0 | Medium | 8 | US-006 | Sprint 4 |
| **US-008** | HRM | Chấm công | Đăng ký check-in/out hằng ngày trên hệ thống. | P0 | High | 5 | US-002 | Sprint 5 |
| **US-009** | Kế toán nội bộ| Phiếu chi tiền | Lập phiếu chi tiền mặt từ đề xuất thanh toán. | P1 | High | 5 | US-003 | Sprint 7 |
| **US-ACC-VN-001** | Kế toán nội bộ | Lập hóa đơn | Tạo hóa đơn GTGT bán ra từ Đơn bán hàng. | P0 | High | 5 | US-007 | Sprint 7 |
| **US-ACC-VN-002** | Kế toán nội bộ | Phát hành hóa đơn | Gửi hóa đơn nháp sang TVAN để ký phát hành. | P0 | High | 8 | US-ACC-VN-001 | Sprint 7 |
| **US-ACC-VN-003** | Kế toán nội bộ | Cấp mã thuế | Đồng bộ mã cơ quan Thuế cấp về hệ thống. | P0 | High | 5 | US-ACC-VN-002 | Sprint 7 |
| **US-ACC-VN-004** | Kế toán nội bộ | Hóa đơn đầu vào | Upload và giải mã XML/PDF hóa đơn mua vào. | P0 | High | 5 | None | Sprint 7 |
| **US-ACC-VN-005** | Kế toán nội bộ | Trùng hóa đơn | Cảnh báo khi upload trùng hóa đơn đầu vào. | P0 | Medium | 3 | US-ACC-VN-004 | Sprint 7 |
| **US-ACC-VN-006** | Kế toán nội bộ | Báo cáo thuế | Xuất bảng kê mua vào/bán ra GTGT chuẩn HTKK. | P1 | High | 5 | US-ACC-VN-003 | Sprint 7 |
| **US-ACC-VN-007** | Kế toán nội bộ | Chốt kỳ | Chốt kỳ kê khai thuế và khóa cứng chứng từ. | P0 | High | 5 | US-ACC-VN-003 | Sprint 7 |
| **US-010** | Mua hàng | Tạo PO | Lập đơn mua hàng (PO) gửi nhà cung cấp. | P1 | Medium | 8 | US-009 | Sprint 8 |
| **US-011** | Kho vật tư | Nhập kho | Lập phiếu nhập kho dựa trên PO đã duyệt. | P1 | Medium | 5 | US-010 | Sprint 9 |
| **US-012** | Văn bản | Trình ký | Trình ký văn bản đi nội bộ. | P1 | High | 8 | US-003 | Sprint 10 |

---

### 2. Chi tiết đặc tả các Câu chuyện người dùng (User Stories Detail)

#### [US-001] Đăng ký doanh nghiệp & Kích hoạt Tenant
* **Đặc tả:**
  Là một Chủ doanh nghiệp mới,  
  Tôi muốn đăng ký tài khoản doanh nghiệp trực tuyến và khởi tạo workspace riêng của tôi,  
  Để tôi có thể bắt đầu cấu hình cơ cấu tổ chức và mời nhân viên làm việc.
* **Tiêu chí nghiệm thu (Acceptance Criteria):**
  - Hệ thống kiểm tra tính hợp lệ của Subdomain (chỉ chữ và số, không khoảng trắng, không trùng lặp).
  - Sau khi đăng ký thành công, hệ thống tự động chạy script seed dữ liệu mẫu (các vai trò mặc định, phòng ban nháp).
  - Gửi email kích hoạt tài khoản kèm token có hiệu lực trong 24 giờ.

#### [US-003] Thiết lập quy trình phê duyệt động (Approval Workflow Configuration)
* **Đặc tả:**
  Là một Quản trị viên doanh nghiệp (Tenant Admin),  
  Tôi muốn cấu hình các bước phê duyệt và người phê duyệt tương ứng cho từng loại chứng từ,  
  Để các đề xuất của nhân viên tự động chuyển đúng cấp có thẩm quyền phê duyệt.
* **Tiêu chí nghiệm thu (Acceptance Criteria):**
  - Cho phép cấu hình tối đa 5 cấp phê duyệt.
  - Mỗi cấp duyệt hỗ trợ chọn duyệt theo Vai trò (e.g. Trưởng phòng) hoặc chọn trực tiếp một User cụ thể.
  - Cho phép chọn chế độ duyệt: Duyệt tuần tự (lần lượt từng người) hoặc Duyệt song song (chỉ cần một trong các người duyệt đồng ý).

#### [US-004] Tạo và giao công việc (Task Assignment)
* **Đặc tả:**
  Là một Quản lý phòng ban,  
  Tôi muốn tạo công việc mới, gán cho nhân viên và thiết lập deadline rõ ràng,  
  Để nhân viên biết nhiệm vụ cần làm và tôi có thể theo dõi tiến độ thực hiện.
* **Tiêu chí nghiệm thu (Acceptance Criteria):**
  - Cho phép đính kèm tệp tin tài liệu dưới 10MB vào công việc.
  - Trường "Hạn hoàn thành" (Due date) bắt buộc phải lớn hơn thời gian hiện tại.
  - Hệ thống tự động tạo một hoạt động lịch sử: `[Người giao] đã tạo công việc và gán cho [Người nhận]`.

#### [US-008] Chấm công trực tuyến (Self-Service Timekeeping)
* **Đặc tả:**
  Là một Nhân viên văn phòng,  
  Tôi muốn thực hiện check-in và check-out trực tiếp trên trình duyệt hoặc điện thoại di động,  
  Để ghi nhận ngày công làm việc của tôi chính xác trong hệ thống.
* **Tiêu chí nghiệm thu (Acceptance Criteria):**
  - Ghi nhận thời gian check-in/out thực tế theo múi giờ máy chủ và so sánh với ca làm việc được cấu hình để xác định đi trễ/về sớm.
  - Hỗ trợ lưu trữ thông tin địa chỉ IP mạng nội bộ của văn phòng để xác thực nhân viên chấm công tại đúng công ty (IP Whitelisting).

#### [US-009] Ghi nhận phiếu chi tiền tự động
* **Đặc tả:**
  Là một Nhân viên kế toán nội bộ,  
  Tôi muốn hệ thống tự động tạo một bản ghi Phiếu chi nháp ngay khi có Đề xuất thanh toán được duyệt hoàn thành,  
  Để tôi đối soát chứng từ và thực hiện chi tiền nhanh chóng mà không cần nhập lại thông tin.
* **Tiêu chí nghiệm thu (Acceptance Criteria):**
  - Phiếu chi nháp tự động kế thừa các thông tin: Người nhận tiền, Số tiền chi, Nội dung thanh toán và Mã đề xuất tham chiếu.
  - Kế toán có quyền sửa lại tài khoản nguồn (Tiền mặt/Ngân hàng) trước khi bấm "Xác nhận đã chi".

#### [US-ACC-VN-001] Phát hành hóa đơn từ đơn hàng
* **Đặc tả:**
  Là một Kế toán bán hàng,  
  Tôi muốn tạo hóa đơn điện tử nháp từ đơn hàng bán (Sales Order) đã được duyệt,  
  Để giảm nhập liệu thủ công và đảm bảo dữ liệu hóa đơn khớp với giao dịch bán hàng thực tế.
* **Tiêu chí nghiệm thu (Acceptance Criteria):**
  - **Given** đơn hàng đã được duyệt thành công.
  - **When** chọn tác vụ "Lập hóa đơn".
  - **Then** hệ thống tự động lấy thông tin khách hàng, MST, địa chỉ, danh sách sản phẩm, số lượng, đơn giá, chiết khấu và thuế suất GTGT từ đơn hàng đưa sang hóa đơn nháp.

#### [US-ACC-VN-002] Gửi hóa đơn sang nhà cung cấp hóa đơn điện tử (TVAN)
* **Đặc tả:**
  Là một Kế toán bán hàng,  
  Tôi muốn gửi dữ liệu hóa đơn điện tử nháp sang đối tác truyền nhận đã cấu hình (ví dụ MISA meInvoice),  
  Để ký số và phát hành hóa đơn hợp lệ gửi cho khách hàng.
* **Tiêu chí nghiệm thu (Acceptance Criteria):**
  - **Given** hóa đơn nháp đã điền đầy đủ MST người bán/người mua, ngày hóa đơn, danh sách dòng hàng.
  - **When** chọn "Phát hành hóa đơn".
  - **Then** hệ thống chuyển trạng thái sang "Chờ phát hành", mã hóa payload JSON và gửi sang API đối tác TVAN, ghi nhận log tích hợp.

#### [US-ACC-VN-003] Đồng bộ kết quả cấp mã cơ quan Thuế
* **Đặc tả:**
  Là một Kế toán bán hàng,  
  Tôi muốn hệ thống tự động đồng bộ kết quả cấp mã hóa đơn từ Tổng cục Thuế,  
  Để biết hóa đơn của tôi đã phát hành hợp lệ hay bị từ chối cấp mã.
* **Tiêu chí nghiệm thu (Acceptance Criteria):**
  - **When** nhận được callback Webhook hoặc cronjob truy vấn trả về kết quả cấp mã từ TVAN.
  - **Then** cập nhật trạng thái hóa đơn là "Đã cấp mã cơ quan thuế" kèm theo lưu mã cơ quan thuế (`gdt_code`) và tải file XML/PDF về S3; hoặc cập nhật trạng thái "Không được cấp mã" kèm mã lỗi/lý do phản hồi.

#### [US-ACC-VN-004] Tải lên và giải mã hóa đơn đầu vào (XML/PDF)
* **Đặc tả:**
  Là một Kế toán mua hàng,  
  Tôi muốn tải lên tệp tin XML/PDF hóa đơn mua vào từ nhà cung cấp,  
  Để hệ thống tự động giải mã thông tin và lưu trữ chứng từ phục vụ thanh toán, kê khai thuế.
* **Tiêu chí nghiệm thu (Acceptance Criteria):**
  - **Given** người dùng chọn file XML hóa đơn Thông tư 78.
  - **When** nhấp "Tải lên và xử lý".
  - **Then** hệ thống parse dữ liệu XML, hiển thị thông tin MST người bán, tổng tiền trước thuế, tiền thuế GTGT, số hóa đơn lên màn hình và tạo bản ghi hóa đơn mua vào ở trạng thái nháp.

#### [US-ACC-VN-005] Cảnh báo trùng lặp hóa đơn đầu vào
* **Đặc tả:**
  Là một Kế toán trưởng,  
  Tôi muốn hệ thống tự động đưa ra cảnh báo trùng lặp khi có hóa đơn đầu vào mới trùng số hóa đơn, ký hiệu và MST nhà cung cấp với hóa đơn đã có,  
  Để tránh ghi nhận chi phí và thuế đầu vào hai lần.
* **Tiêu chí nghiệm thu (Acceptance Criteria):**
  - **Given** hệ thống đã tồn tại hóa đơn đầu vào có số `0001234`, ký hiệu `1C26TAA`, MST `0102030405`.
  - **When** kế toán nhập tay hoặc upload XML hóa đơn có thông tin tương ứng.
  - **Then** hệ thống chặn không cho lưu và hiển thị thông báo: "Hóa đơn này đã được nhập bởi [Kế toán A] vào ngày [Ngày]. Vui lòng kiểm tra lại!".

#### [US-ACC-VN-006] Xuất dữ liệu bảng kê thuế GTGT chuẩn HTKK
* **Đặc tả:**
  Là một Kế toán thuế,  
  Tôi muốn xuất báo cáo bảng kê hóa đơn mua vào/bán ra theo định dạng file Excel khớp với mẫu HTKK,  
  Để dễ dàng kê khai và nộp tờ khai thuế GTGT hàng kỳ.
* **Tiêu chí nghiệm thu (Acceptance Criteria):**
  - **When** chọn Kỳ kê khai (ví dụ: Quý 2/2026) và bấm "Xuất bảng kê".
  - **Then** hệ thống lọc toàn bộ hóa đơn có trạng thái "Đã cấp mã cơ quan thuế" (đầu ra) và "Đã xác nhận kê khai" (đầu vào) có ngày nằm trong kỳ, xuất file Excel chuẩn cấu hình cột tương thích phần mềm HTKK.

#### [US-ACC-VN-007] Chốt kỳ kê khai thuế
* **Đặc tả:**
  Là một Kế toán trưởng,  
  Tôi muốn chốt kỳ kê khai thuế sau khi hoàn tất đối soát số liệu,  
  Để khóa cứng các chứng từ kế toán liên quan, ngăn người dùng tự ý sửa đổi làm sai lệch số liệu đã báo cáo thuế.
* **Tiêu chí nghiệm thu (Acceptance Criteria):**
  - **When** Kế toán trưởng chọn "Chốt kỳ" và xác nhận.
  - **Then** hệ thống đổi trạng thái kỳ kê khai sang "Đã khóa", chặn toàn bộ quyền Thêm/Sửa/Xóa của tất cả các chứng từ có ngày hạch toán nằm trong kỳ. Chỉ Kế toán trưởng mới được mở khóa kỳ sau khi nhập lý do hạch toán điều chỉnh.

