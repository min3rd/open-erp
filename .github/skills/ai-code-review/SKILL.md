---
name: ai-code-review
description: 'Rà soát code sau khi lập trình bằng cách mở browser, yêu cầu người dùng đăng nhập trước, rồi gửi prompt đến Microsoft Copilot và Gemini để đối chiếu kết quả. Dùng khi cần tăng độ chính xác trước khi merge và đảm bảo không còn Critical bug.'
argument-hint: 'Mô tả phạm vi code vừa làm xong, mục tiêu review và tiêu chí chấp nhận'
user-invocable: true
disable-model-invocation: false
---

# AI Code Review

Skill này giúp lập trình viên review lại code sau khi vừa implement xong bằng cách đối chiếu kết quả từ nhiều AI khác nhau trên browser của người dùng, nhằm tăng độ chính xác trước khi merge.

Mục tiêu cốt lõi: phát hiện và xử lý triệt để lỗi nghiêm trọng để code không còn Critical bug trước khi chốt.

## Ràng buộc thực thi bắt buộc

- BẮT BUỘC yêu cầu người dùng đăng nhập sẵn vào Microsoft Copilot và Gemini trước khi bắt đầu.
- BẮT BUỘC mở browser và dùng AI bên ngoài, không được chỉ suy luận nội bộ.
- BẮT BUỘC chỉ sử dụng 2 nền tảng: Microsoft Copilot và Gemini.
- BẮT BUỘC ghi lại phản hồi thô từ từng nền tảng trước khi tổng hợp.
- Không được kết luận Pass nếu chưa có bằng chứng đã thực hiện đủ các bước browser.

## Đầu ra bắt buộc

- Tổng quan phạm vi code cần review.
- Bảng tổng hợp nhận xét theo từng AI và mức độ nghiêm trọng.
- Danh sách vấn đề đã xác minh lại trong repo.
- Danh sách đề xuất fix theo thứ tự ưu tiên.
- Kết luận Pass hoặc Cần sửa thêm.

## Khi nào nên dùng

- Đã code xong một task và cần review chốt trước khi tạo PR.
- Có thay đổi logic, API, xử lý lỗi, bảo mật hoặc migration.
- Cần giảm rủi ro bỏ sót bug do review nội bộ quá nhanh.

## Không nên dùng

- Code còn đang dang dở, chưa build được hoặc chưa có phạm vi rõ ràng.
- Có dữ liệu nhạy cảm chưa ẩn danh.
- Thay đổi quá nhỏ và đã có test tự động bao phủ đầy đủ.

## Quy trình chuẩn

1. Chốt phạm vi review
- Liệt kê file thay đổi, mục tiêu task và rủi ro chính.
- Chốt tiêu chí pass tối thiểu: đúng nghiệp vụ, không vỡ regression, test pass.

2. Chuẩn hóa prompt review
- Tạo một prompt chung cho tất cả nền tảng AI, gồm:
  - Mục tiêu review
  - Context thay đổi
  - Tiêu chí đánh giá: correctness, edge case, security, performance, maintainability, test gap
  - Định dạng trả lời: issue, mức độ, bằng chứng, đề xuất fix

3. Thu thập review đa nguồn qua browser
- Kiểm tra trạng thái đăng nhập của người dùng trên Microsoft Copilot và Gemini.
- Gửi cùng một prompt cho cả 2 nền tảng AI đã đăng nhập.
- Lưu kết quả thô theo từng nền tảng để đối chiếu.

Chi tiết thao tác bắt buộc:
- Mở tab 1: Microsoft Copilot, gửi prompt review, lưu phản hồi.
- Mở tab 2: Gemini, gửi đúng prompt review, lưu phản hồi.
- Nếu một trong hai nền tảng chưa đăng nhập được, yêu cầu người dùng đăng nhập rồi mới tiếp tục.

4. Đối chiếu và phân loại
- Nhóm nhận xét theo 3 loại:
  - Đồng thuận: nhiều AI cùng báo cùng một vấn đề
  - Bổ sung: chỉ 1 AI nêu vấn đề nhưng hợp lý
  - Mâu thuẫn: kết luận trái ngược
- Gán mức độ nghiêm trọng: Critical, Major, Minor, Nit.

5. Ra quyết định theo nhánh
- Nếu có issue Critical hoặc Major đồng thuận: đưa vào danh sách fix bắt buộc.
- Nếu issue chỉ xuất hiện ở 1 AI: kiểm chứng nhanh bằng code, test hoặc tài liệu.
- Nếu AI mâu thuẫn:
  - Tạo prompt phản biện tập trung vào điểm mâu thuẫn
  - Hỏi vòng 2 trên ít nhất 2 nền tảng
  - Ưu tiên phương án kiểm chứng nhanh nhất trong repo

6. Kiểm chứng trong repo
- Áp dụng fix theo thứ tự rủi ro cao đến thấp.
- Sau mỗi fix, chạy kiểm tra phù hợp: unit test, lint, build hoặc smoke test.
- Nếu phát sinh regression, rollback thay đổi đáng nghi ngờ và đánh giá lại.

7. Chốt kết quả
- Đánh dấu từng issue: fixed, rejected có lý do hoặc defer.
- Tổng hợp bài học và checklist cho lần review tiếp theo.
- Kết luận:
  - Pass: không còn Critical bug, không còn Major bug chưa xử lý và test chính pass.
  - Cần sửa thêm: còn Critical bug, còn Major bug hoặc còn điểm mơ hồ chưa kiểm chứng.

## Tiêu chí chất lượng

- Có tối thiểu 2 AI độc lập tham gia review.
- Mọi issue Critical và Major đều có bước kiểm chứng trong repo.
- Không chấp nhận kết luận chỉ dựa trên ý kiến AI mà không có bằng chứng kiểm thử.
- Kết quả cuối phải rõ ràng Pass hoặc Cần sửa thêm.
- Không được phép chốt Pass khi còn bất kỳ Critical bug nào.

## Checklist hoàn thành

- [ ] Đã chốt phạm vi review và tiêu chí pass.
- [ ] Đã xác nhận người dùng đăng nhập thành công Microsoft Copilot và Gemini.
- [ ] Đã gửi prompt chung trên cả Microsoft Copilot và Gemini qua browser.
- [ ] Đã lưu phản hồi thô từ cả 2 nền tảng.
- [ ] Đã lập bảng đối chiếu đồng thuận, bổ sung, mâu thuẫn.
- [ ] Đã xử lý mâu thuẫn bằng vòng phản biện hoặc kiểm chứng repo.
- [ ] Đã fix issue ưu tiên cao và chạy test liên quan.
- [ ] Đã xác nhận không còn Critical bug trước khi chốt.
- [ ] Đã có kết luận cuối và danh sách việc tiếp theo.

## Mẫu prompt nhanh

"Bạn đóng vai senior reviewer. Hãy review thay đổi code này theo các mục: correctness, edge cases, security, performance, maintainability, test gaps. Trả lời theo bảng: issue, severity, evidence, suggested fix, confidence. Nếu không đủ thông tin, nêu rõ giả định cần bổ sung. Mục tiêu bắt buộc: không còn Critical bug trước khi merge."
