---
name: agentic-control
description: Hướng dẫn điều khiển trình duyệt web (agent-browser) và ứng dụng máy tính (agent-desktop) cho AI Agent trên môi trường Windows. Dùng khi cần kiểm thử giao diện trực tiếp, chụp ảnh màn hình, thao tác form/nút bấm hoặc điều khiển phần mềm desktop.
---

# Agentic Control: Trình duyệt (`agent-browser`) & Máy tính (`agent-desktop`)

## 1. Điều khiển Trình duyệt Web (`agent-browser`)

### 1.1. Cài đặt & Kiểm tra
- Binary toàn cục: `agent-browser` (đã cài sẵn qua npm toàn cục).
- Kiểm tra phiên bản: `agent-browser --version`

### 1.2. Chu trình Thao tác Chuẩn (The Loop)
1. **Mở URL**: `agent-browser open "http://localhost:4200/apps/form"`
2. **Chụp cây phần tử tương tác (Interactive Snapshot)**:
   ```powershell
   agent-browser snapshot -i
   ```
   Lệnh này trả về cây Accessibility rút gọn kèm mã định danh tham chiếu: `@e1`, `@e2`, `@e3`...
3. **Thao tác theo Ref**:
   - Nhấn chuột: `agent-browser click @e1`
   - Nhập liệu: `agent-browser fill @e2 "user@example.com"`
   - Đọc thuộc tính/văn bản: `agent-browser get text @e3`
   - Chọn dropdown: `agent-browser select @e4 "Giá trị"`
4. **Chụp ảnh màn hình**:
   ```powershell
   agent-browser screenshot path/to/image.png
   ```
5. **Đổi kích thước khung nhìn (Dual-Mode Testing)**:
   - Desktop: `agent-browser set viewport 1440 900`
   - Mobile: `agent-browser set viewport 390 844`

---

## 2. Điều khiển Máy tính & Ứng dụng Desktop (`agent-desktop`)

### 2.1. Cài đặt & Quyền hệ thống
- Binary toàn cục: `agent-desktop` (phiên bản >= 1.2.0).
- Kiểm tra trạng thái: `agent-desktop status` (kiểm tra quyền accessibility, platform, surfaces).

### 2.2. Chu trình Thao tác Chuẩn
1. **Liệt kê cửa sổ & ứng dụng đang mở**:
   ```powershell
   agent-desktop list-windows
   agent-desktop list-apps
   ```
2. **Tập trung vào cửa sổ ứng dụng**:
   ```powershell
   agent-desktop focus-window --title "Open-ERP"
   ```
3. **Chụp cây Accessibility có @ref**:
   ```powershell
   agent-desktop snapshot --app "msedge" -i --compact
   ```
   > **LƯU Ý TRÊN WINDOWS POWERSHELL**: Luôn đặt `@ref` trong dấu nháy đơn hoặc kép: `'@s8f3k2p9:e1'`, vì ký tự `@` đứng đầu trong PowerShell là toán tử splatting.
4. **Thao tác hành động**:
   - Nhấn chuột ngữ nghĩa: `agent-desktop click '@s8f3k2p9:e5'`
   - Nhập văn bản: `agent-desktop type '@s8f3k2p9:e2' "Văn bản mẫu"`
   - Chờ phần tử xuất hiện: `agent-desktop wait --element '@s8f3k2p9:e9' --predicate actionable --timeout 5000`
   - Chụp ảnh cửa sổ: `agent-desktop screenshot --window "Open-ERP" screenshot.png`

