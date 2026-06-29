# Templates tài liệu SDLC

Copy template phù hợp; thay `{placeholder}` bằng giá trị thực.

---

## PRD (delta — bổ sung tính năng)

Dùng khi thay đổi scope sản phẩm. File gốc: `docs/01_business/prd.md`.

```markdown
# PRD Delta: {Feature Name}
## Dự án: Nền tảng SaaS quản trị doanh nghiệp hợp nhất

### 1. Bối cảnh & Vấn đề
{Mô tả pain point và lý do làm tính năng này}

### 2. Mục tiêu (Goals)
- {Goal 1 — đo được}
- {Goal 2}

### 3. Ngoài phạm vi (Non-Goals)
- {Explicitly out of scope}

### 4. Personas liên quan
| Persona | Nhu cầu |
|---------|---------|
| {Name} | {Need} |

### 5. User Journey (tóm tắt)
{mermaid sequenceDiagram hoặc bullet flow}

### 6. Success Metrics
| Metric | Target |
|--------|--------|
| {Metric} | {Value} |
```

---

## SRS (Software Requirement Specification)

Lưu tại `docs/03_functional/{feature}_spec.md` hoặc section trong Task.

```markdown
# SRS: {Feature Name}
## Phân hệ: {Module Name}

### 1. Tổng quan
{Mô tả chức năng phần mềm cần xây dựng}

### 2. Yêu cầu chức năng (Functional Requirements)
| ID | Mô tả | Priority |
|----|-------|----------|
| FR-001 | {Requirement} | P0 |

### 3. Yêu cầu phi chức năng (NFR)
| ID | Loại | Mô tả |
|----|------|-------|
| NFR-001 | Performance | {e.g. API p95 < 300ms} |
| NFR-002 | Security | {e.g. RLS tenant_id} |

### 4. Data Model
{Entity, field, constraint — link data_model.md}

### 5. API Specification
| Method | Path | Mô tả | Auth |
|--------|------|-------|------|
| POST | /api/v1/{resource} | {Desc} | JWT + X-Tenant-ID |

**Request body:** `{json example}`
**Response 200:** `{json example}`
**Errors:** 400, 401, 403, 404, 409

### 6. Business Rules
- {Rule 1 + error handling}

### 7. Traceability
| URS Story | FR/SRS ID |
|-----------|-----------|
| US-XXX | FR-001 |
```

---

## Mockup / Wireframe (trong sitemap doc)

Bổ sung vào `docs/02_user_requirements/sitemap_and_wireframes.md`.

```markdown
#### Màn hình: {Screen Name}
- **Route:** `/{path}`
- **Persona:** {Who uses it}
- **Mục đích:** {One line}

**Layout (Desktop):**
```
┌─────────────────────────────────────────┐
│ Header: {title}              [Actions] │
├──────────┬──────────────────────────────┤
│ Sidebar  │ Main content                 │
│          │ ┌──────────────────────────┐ │
│          │ │ {Component}              │ │
│          │ └──────────────────────────┘ │
└──────────┴──────────────────────────────┘
```

**Trạng thái:**
| State | Hiển thị |
|-------|----------|
| Loading | Skeleton |
| Empty | "{Message}" + CTA |
| Error | Toast + retry |

**Responsive:** Desktop split-pane → Mobile accordion/list
**Components:** TreeView, Button (Rose Gold primary), Transloco keys: `{key}`
```

---

## Task

Path: `docs/05_project_management/sprint_{N}/tasks/task_{NN}_{slug}.md`

```markdown
# Tài liệu kỹ thuật chi tiết: TSK-{N}.{M} - {Task Title}
## Phân hệ: {Module} (Sprint {N})

| Trace | Link |
|-------|------|
| PRD | [prd.md](../../../01_business/prd.md) |
| URS | [urs.md](../../../02_user_requirements/urs.md) US-{ID} |
| Mockup | [sitemap_and_wireframes.md](../../../02_user_requirements/sitemap_and_wireframes.md) |
| SRS | {link or inline} |

---

### 1. Mục tiêu công việc (Objective)
{What and why}

---

### 2. Thiết kế chi tiết Nghiệp vụ & Kỹ thuật

#### 2.1 {Subsection}
{Schema, rules, diagrams}

#### 2.2 Đặc tả API
{Endpoints — link api_overview.md}

---

### 3. Phân chia công việc chi tiết

#### 3.1 Backend Engineer (BE)
* {Subtask}

#### 3.2 Web Frontend Engineer (FE Web)
* {Subtask}

#### 3.3 Mobile Frontend Engineer (FE Mobile)
* {Subtask}

#### 3.4 UI/UX Designer
* {Subtask if any}

#### 3.5 QA Engineer
* {Test scenarios summary — link testcase file}

---

### 4. Hướng dẫn Phát triển & Gỡ lỗi cục bộ
* **Bước 1:** `docker compose -f docker-compose.local.yml up -d`
* **Bước 2:** {Debug/run commands}

---

### 5. Tiêu chí hoàn thành (Definition of Done)
* {Deliverable checklist}
* Unit test coverage > {X}%
* Code review approved, merged to `develop`
```

Cập nhật bảng task index trong sprint `README.md`:

```markdown
| **TSK-{N}.{M}** | {Title} | {Summary} | [ ] Todo | {Owner} | [task_{NN}_{slug}.md](./tasks/task_{NN}_{slug}.md) |
```

---

## Bug

Path: `docs/05_project_management/sprint_{N}/bugs/bug_{NN}_{slug}.md`

```markdown
# Tài liệu báo cáo lỗi: BUG-{N}.{NN} - {Short Title}
## Phân hệ: {Module} (Sprint {N})

| Liên quan Task | TSK-{N}.{M} |
|----------------|-------------|
| Severity | 🔴 Critical / 🟠 High / 🟡 Medium / 🟢 Low |
| Trạng thái | [ ] Open / [x] Fixed |

---

### 1. Mô tả lỗi (Bug Description)
{What happens — steps to reproduce}

1. {Step 1}
2. {Step 2}
3. **Expected:** {expected}
4. **Actual:** {actual}

---

### 2. Nguyên nhân lỗi (Root Cause)
{Analysis after investigation}

---

### 3. Giải pháp khắc phục (Resolution Design)
1. {Fix step}

---

### 4. Tiêu chí nghiệm thu (Acceptance Criteria)
1. {Verify fix}

---

### 5. Kết quả thực hiện (Resolution & Deliverables)
- **Trạng thái:** [ ] Open / [x] Completed
- **Thay đổi:**

| File | Thay đổi |
|------|----------|
| `{path}` | {change} |
```

---

## Testcase

Path: `docs/05_project_management/sprint_{N}/testcases/tc_{NN}_{slug}.md` hoặc section trong Task.

```markdown
# Testcase: TC-{N}.{NN} - {Feature/Task Name}
## Liên kết: TSK-{N}.{M} | US-{ID}

| Môi trường | Dev local / UAT |
|------------|-----------------|
| Tester | QA |
| Ngày | {YYYY-MM-DD} |

---

## Kịch bản kiểm thử

### TC-001: {Title} — Happy path
| # | Bước | Dữ liệu | Kết quả mong đợi |
|---|------|---------|------------------|
| 1 | {Action} | {Input} | {Expected} |

**Kết quả:** [ ] PASS / [ ] FAIL
**Ghi chú:** {screenshot path if any}

---

### TC-002: {Title} — Edge case
| # | Bước | Dữ liệu | Kết quả mong đợi |
|---|------|---------|------------------|
| 1 | {Action} | {Invalid input} | Error message: "{msg}" |

---

### TC-003: {Title} — Security
| # | Bước | Kết quả mong đợi |
|---|------|------------------|
| 1 | SQL injection in `{field}` | 400, no data leak |

---

## Tổng hợp

| TC ID | Mô tả | Kết quả |
|-------|-------|---------|
| TC-001 | Happy path | PASS |
| TC-002 | Edge | PASS |
| **Tổng** | | **X/Y PASS** |
```

---

## Manual Test Report (UI phức tạp)

Path: `docs/05_project_management/sprint_{N}/tasks/task_{NN}_manual_test_report.md`

```markdown
# Báo cáo Kiểm thử Giao diện: TSK-{N}.{M} - {Feature}

## 1. Thông tin chung
* **Mã công việc:** TSK-{N}.{M}
* **Môi trường:** `{url}`
* **Công cụ:** Chrome / Mobile emulator
* **Ngày:** {date}

## 2. Kịch bản & Kết quả

### Bước 1: {Scenario}
* **Mục tiêu:** {goal}
* **Kết quả thực tế:** {observation}
* **Ảnh:** [screenshot.png](./assets/screenshot.png)
* **Đánh giá:** PASS / FAIL

## 3. Tổng hợp

| Hạng mục | Kết luận |
|----------|----------|
| {Area} | PASS |
```
