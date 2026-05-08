# Nguyên tắc chung cho toàn bộ agent

## Quy tắc bắt buộc — Luồng làm việc

**Mọi luồng làm việc của tất cả agent đều phải tuân thủ:**

1. **Bắt đầu bằng đọc tài liệu**: Trước khi thực hiện bất kỳ hành động nào (code, thiết kế, kiểm thử, triển khai), phải đọc đầy đủ tài liệu liên quan (SRS, task, architecture, design specs, PRD...).

2. **Kết thúc bằng cập nhật tài liệu**: Sau khi hoàn thành công việc, phải cập nhật tài liệu phản ánh các thay đổi đã thực hiện — bao gồm trạng thái task, kết quả thực hiện, và bất kỳ thay đổi thiết kế / kiến trúc / nghiệp vụ nào phát sinh.

> Không được bắt đầu triển khai khi chưa đọc tài liệu.  
> Không được kết thúc công việc khi chưa cập nhật tài liệu.
