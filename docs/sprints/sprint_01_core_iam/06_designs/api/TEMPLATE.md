# [MÃ_TÍNH_NĂNG] Đặc Tả Giao Diện Lập Trình Ứng Dụng (API Specifications)

- **Tính năng**: [Tên tính năng]
- **Phụ trách**: Solution Architect Agent
- **Base URL**: `/api/v1`

---

## Danh Sách Endpoints

### 1. `POST /api/v1/resources` - Tạo Mới Bản Ghi
- **Mô tả**: Cho phép người dùng tạo một thực thể mới.
- **Quyền hạn (RBAC)**: `admin`, `manager`.
- **Headers**:
  - `Authorization: Bearer <token>`
  - `Content-Type: application/json`

#### Request Body
```json
{
  "code": "RES-001",
  "name": "Tên bản ghi",
  "amount": 100000
}
```

#### Response Success (`201 Created`)
```json
{
  "success": true,
  "data": {
    "id": "uuid-string",
    "code": "RES-001",
    "name": "Tên bản ghi",
    "status": "draft",
    "created_at": "2026-09-17T00:00:00Z"
  }
}
```

#### Response Errors
- `400 Bad Request`: Thiếu trường bắt buộc hoặc dữ liệu sai định dạng.
- `401 Unauthorized`: Chưa đăng nhập hoặc token hết hạn.
- `409 Conflict`: Trùng mã `code`.

---

### 2. `GET /api/v1/resources` - Danh Sách Bản Ghi (Phân Trang & Lọc)
- **Query Params**:
  - `page` (int, default: 1)
  - `limit` (int, default: 20)
  - `search` (string, tìm theo code/name)
  - `status` (string, lọc theo trạng thái)
