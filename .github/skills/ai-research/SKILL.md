---
name: ai-research
description: 'Tra cứu và đối chiếu phương án kỹ thuật qua nhiều nền tảng AI trên browser để tăng độ tin cậy trước khi quyết định.'
argument-hint: 'Mô tả vấn đề cần tra cứu AI và kết quả mong muốn'
user-invocable: true
disable-model-invocation: false
---

# AI Research

Skill này giúp agent dùng browser của người dùng để tra cứu trên nhiều nền tảng AI; sau đó tổng hợp, đối chiếu, và đưa ra kế hoạch xử lý có kiểm chứng.

## Khi nào nên dùng

- Cần giải quyết vấn đề kỹ thuật phức tạp, nhiều giả thuyết.
- Cần kiểm tra chéo giữa nhiều nguồn AI để giảm sai lệch.
- Cần phương án hành động nhanh nhưng vẫn có tiêu chí chất lượng.
- Cần tận dụng browser thay vì chỉ dựa vào suy luận nội bộ.

## Không nên dùng

- Yêu cầu chứa dữ liệu nhạy cảm (secret, token, mật khẩu, PII) chưa được ẩn danh.
- Tác vụ chỉ cần thay đổi rất nhỏ trong code và đã có ngữ cảnh đầy đủ trong repo.

## Kết quả đầu ra bắt buộc

- Tóm tắt vấn đề và phạm vi.
- Bảng đối chiếu ý kiến từ các nền tảng AI đã dùng.
- Kết luận hợp nhất (consensus hoặc phân nhánh theo điều kiện).
- Kế hoạch thực thi từng bước trong repo.
- Checklist xác nhận hoàn thành.

## Quy trình chuẩn

1. Chuẩn hóa bài toán
- Viết lại vấn đề thành 1 prompt gốc rõ mục tiêu, ràng buộc, môi trường, lỗi hiện tại.
- Ẩn danh mọi dữ liệu nhạy cảm trước khi gửi.

2. Tạo bộ prompt dùng chung
- Tạo 1 prompt chuẩn cho các nền tảng để kết quả dễ so sánh.
- Nếu cần, thêm 1 prompt phụ cho từng nền tảng để khai thác điểm mạnh riêng.

3. Tra cứu lần 1 trên các nền tảng
- Mở lần lượt các nền tảng AI trên browser (ví dụ: ChatGPT, Gemini, Grok).
- Gửi cùng prompt chuẩn và thu thập kết quả thô.

4. Đối chiếu và phân loại
- Nhóm câu trả lời thành: trùng khớp, bổ sung, mâu thuẫn.
- Trích ra giả định quan trọng, bước thực thi, rủi ro được nêu.

5. Nhánh quyết định khi có mâu thuẫn
- Nếu 3 nguồn đồng thuận cao: chuyển sang bước 6.
- Nếu có mâu thuẫn lớn: tạo prompt phản biện và hỏi vòng 2, tập trung vào điểm mâu thuẫn.
- Nếu vẫn mâu thuẫn: ưu tiên phương án có khả năng kiểm chứng nhanh trong repo bằng test/build nhỏ nhất.

6. Hợp nhất phương án thực thi
- Tạo kế hoạch hành động theo thứ tự: an toàn -> tác động thấp -> tác động cao.
- Mỗi bước phải có tiêu chí pass/fail rõ ràng.

7. Thực thi và kiểm chứng trong repo
- Áp dụng thay đổi từng bước nhỏ.
- Sau mỗi bước: chạy test/lint/build phù hợp để xác nhận.

8. Chốt kết quả
- Ghi rõ: đã làm gì, vì sao chọn phương án đó, bằng chứng kiểm chứng.
- Liệt kê các điểm còn mở và đề xuất vòng tra cứu tiếp theo nếu cần.

## Tiêu chí chất lượng

- Có ít nhất 2 nguồn AI độc lập đồng thuận cho các quyết định quan trọng.
- Mọi khuyến nghị quan trọng đều chuyển thành bước kiểm chứng được trong repo.
- Không để lộ dữ liệu nhạy cảm trong prompt hoặc ảnh chụp.
- Kết luận cuối cùng phải hành động được, không chỉ dừng ở mô tả lý thuyết.

## Checklist hoàn thành

- [ ] Đã chuẩn hóa prompt gốc và ẩn danh dữ liệu nhạy cảm.
- [ ] Đã thu thập phản hồi từ các nền tảng AI đã chọn.
- [ ] Đã lập bảng đối chiếu điểm giống/khác.
- [ ] Đã xử lý mâu thuẫn bằng vòng hỏi bổ sung hoặc kiểm chứng thực nghiệm.
- [ ] Đã thực thi ít nhất một hướng trong repo và có bằng chứng test/build.
- [ ] Đã xuất bản tóm tắt kết luận và next steps.

## Mẫu prompt nhanh

Prompt chuẩn:
"Bạn là chuyên gia kỹ thuật. Hãy phân tích vấn đề sau theo cấu trúc: (1) nguyên nhân khả dĩ, (2) cách kiểm tra nhanh nhất, (3) phương án sửa ưu tiên theo rủi ro thấp -> cao, (4) rủi ro khi triển khai, (5) tiêu chí xác nhận đã sửa xong. Bối cảnh: <mô tả ngắn>, môi trường: <stack>, lỗi: <log/triệu chứng đã ẩn danh>."

Prompt phản biện khi mâu thuẫn:
"Có 2 phương án trái ngược: A=<...>, B=<...>. Hãy chỉ ra điều kiện nào khiến A đúng, điều kiện nào khiến B đúng, và đề xuất thí nghiệm ngắn nhất để phân biệt A/B trong repo hiện tại."

## Gợi ý sử dụng trong chat

- /ai-research "So sánh phương án xử lý lỗi build TypeScript sau khi nâng cấp dependency"
- /ai-research "Tra cứu đa nguồn AI để chọn chiến lược tối ưu query MongoDB bị chậm"
- /ai-research "Đối chiếu kết luận cho bug race condition và đề xuất test xác minh"
