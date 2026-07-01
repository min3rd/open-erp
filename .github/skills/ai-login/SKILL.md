---
name: ai-login
description: 'Mở browser và hướng dẫn người dùng đăng nhập sẵn Microsoft Copilot và Gemini trước khi chạy các skill AI khác, để tránh bị chặn hoặc gián đoạn.'
argument-hint: 'Mô tả mục tiêu đăng nhập và skill AI nào sẽ chạy tiếp theo'
user-invocable: true
disable-model-invocation: false
---

# AI Login

Skill này chuẩn bị phiên đăng nhập AI trên browser để các skill khác (như ai-research, ai-code-review) chạy ổn định, không bị chặn do chưa đăng nhập.

## Khi nào nên dùng

- Trước khi chạy các skill cần gọi AI qua browser.
- Khi phiên trước bị đăng xuất hoặc hết hạn.
- Khi phát hiện nền tảng AI yêu cầu sign in trước khi gửi prompt.

## Không nên dùng

- Người dùng không muốn đăng nhập tài khoản AI trên máy hiện tại.
- Không có nhu cầu dùng các skill AI qua browser trong phiên làm việc.

## Đầu ra bắt buộc

- Xác nhận trạng thái đăng nhập của Microsoft Copilot.
- Xác nhận trạng thái đăng nhập của Gemini.
- Danh sách nền tảng sẵn sàng và nền tảng còn bị chặn (nếu có).
- Kết luận có thể tiếp tục chạy skill AI tiếp theo hay chưa.

## Quy trình chuẩn

1. Xác nhận mục tiêu phiên
- Hỏi ngắn gọn skill nào sẽ chạy tiếp theo sau đăng nhập.
- Nhắc người dùng chuẩn bị thao tác đăng nhập thủ công khi được yêu cầu.

2. Mở nền tảng bắt buộc
- Mở Microsoft Copilot: https://copilot.microsoft.com
- Mở Gemini: https://gemini.google.com

3. Kiểm tra trạng thái đăng nhập
- Nếu thấy giao diện chat khả dụng: đánh dấu đã đăng nhập.
- Nếu thấy trang login/sign in: yêu cầu người dùng đăng nhập trước rồi kiểm tra lại.

4. Nhánh xử lý khi chưa đăng nhập
- Nếu Microsoft Copilot chưa đăng nhập: yêu cầu người dùng hoàn tất đăng nhập Copilot.
- Nếu Gemini chưa đăng nhập: yêu cầu người dùng hoàn tất đăng nhập Gemini.
- Sau mỗi lần người dùng báo đã đăng nhập, kiểm tra lại trạng thái trang.

5. Nhánh xử lý khi bị chặn
- Nếu gặp captcha, 2FA, hoặc block theo khu vực: dừng tự động, thông báo rõ lý do.
- Yêu cầu người dùng xử lý thủ công và xác nhận lại khi xong.

6. Xác nhận sẵn sàng
- Chỉ kết luận sẵn sàng khi cả Copilot và Gemini đều ở trạng thái chat khả dụng.
- Trả về tóm tắt: nền tảng nào OK, nền tảng nào chưa OK, và bước tiếp theo.

## Tiêu chí chất lượng

- Đã kiểm tra đủ cả Microsoft Copilot và Gemini.
- Không kết luận "sẵn sàng" nếu một trong hai nền tảng chưa đăng nhập.
- Có thông báo rõ ràng cho người dùng khi cần thao tác thủ công.
- Có kết luận cuối dạng Pass hoặc Chưa Pass.

## Checklist hoàn thành

- [ ] Đã mở Microsoft Copilot trên browser.
- [ ] Đã mở Gemini trên browser.
- [ ] Đã xác nhận Microsoft Copilot đăng nhập thành công.
- [ ] Đã xác nhận Gemini đăng nhập thành công.
- [ ] Đã xử lý hoặc ghi nhận blocker (captcha/2FA/block) nếu có.
- [ ] Đã kết luận có thể chạy skill AI tiếp theo.

## Mẫu prompt nhanh

- /ai-login "Đăng nhập Copilot và Gemini trước khi chạy ai-research"
- /ai-login "Chuẩn bị đăng nhập AI để chạy ai-code-review cho task backend"
- /ai-login "Kiểm tra lại trạng thái đăng nhập AI vì phiên trước bị out"