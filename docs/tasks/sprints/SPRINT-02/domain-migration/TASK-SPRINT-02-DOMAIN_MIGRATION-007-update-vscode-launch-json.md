### TASK-SPRINT-02-DOMAIN_MIGRATION-007: Cập nhật VSCode launch.json cho domain services mới

**Trạng thái:** 🟡 REVIEW
**Loại:** DevOps
**Module:** Platform + WMS
**Sprint:** 02
**Ưu tiên:** Cao
**Ước tính:** 1 SP
**Người nhận:** Senior DevOps
**Phụ thuộc:** TASK-SPRINT-02-DOMAIN_MIGRATION-002, TASK-SPRINT-02-DOMAIN_MIGRATION-001

---

#### Mô tả

File `e:\Minh\open-erp\.vscode\launch.json` hiện chỉ chứa launch configs cho 11 legacy microservices (auth, user, notification, config, organization, inventory, common-service, file-service, chat, data-transfer, approval-flow) và FE web. Cần cập nhật để phản ánh kiến trúc 6-domain mới: thêm configs cho `platform-service` và `wms-service`, đồng thời giữ nguyên legacy configs (vì các service cũ vẫn chạy trong giai đoạn migration).

---

#### Yêu cầu

##### 1. Đọc file hiện tại

Đọc toàn bộ `e:\Minh\open-erp\.vscode\launch.json` trước khi sửa.

##### 2. Thêm configs cho domain services mới

Thêm 2 launch configurations mới (platform-service và wms-service) theo **đúng format** của các configs hiện có:

```json
{
  "type": "node",
  "request": "launch",
  "cwd": "${workspaceFolder}/open-erp-backend",
  "name": "Platform Service (Dev)",
  "runtimeExecutable": "npm",
  "runtimeArgs": ["run", "start:platform:dev"],
  "sourceMaps": true,
  "console": "integratedTerminal"
},
{
  "type": "node",
  "request": "launch",
  "cwd": "${workspaceFolder}/open-erp-backend",
  "name": "WMS Service (Dev)",
  "runtimeExecutable": "npm",
  "runtimeArgs": ["run", "start:wms:dev"],
  "sourceMaps": true,
  "console": "integratedTerminal"
}
```

**Xác nhận script tồn tại** trong `open-erp-backend/package.json` trước khi thêm:
- `start:platform:dev` → đã có từ Task 001
- `start:wms:dev` → đã có từ Task 002

##### 3. Thêm compound launch "Domain Services (Phase 1)"

Thêm một `compound` configuration để khởi chạy nhóm services cần thiết cho Phase 1 (WMS + Catalog) trong một lần bấm:

```json
{
  "name": "🚀 Domain Services Phase 1",
  "configurations": [
    "Auth Service (Dev)",
    "User Service (Dev)",
    "Organization Service (Dev)",
    "Platform Service (Dev)",
    "WMS Service (Dev)",
    "Notification Service (Dev)"
  ],
  "stopAll": true
}
```

Đảm bảo file JSON hợp lệ sau khi sửa (trailing comma, brackets...).

---

#### Tiêu chí hoàn thành

- [ ] `Platform Service (Dev)` launch config tồn tại
- [ ] `WMS Service (Dev)` launch config tồn tại
- [ ] Compound `🚀 Domain Services Phase 1` tồn tại
- [ ] Tất cả legacy configs vẫn còn nguyên
- [ ] File JSON hợp lệ (không có syntax error)
- [ ] Cập nhật trạng thái task này → 🟡 REVIEW
- [ ] Cập nhật `docs/tasks/sprints/SPRINT-02/TASK-INDEX.md` → task 007 = 🟡 REVIEW
