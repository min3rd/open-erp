// scripts/qa/seed-comprehensive-form.mjs
// Seeds a full-fledged enterprise form covering all 10 field types, matrix, ratings, validation.
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

const BASE = 'http://localhost:8088';

function psql(query) {
  const flat = query.replace(/\s+/g, ' ').trim();
  return execSync(
    `docker exec openerp-postgres-primary psql -U openerp -d openerp_dev -tAc "${flat.replace(/"/g, '\\"')}"`,
    { encoding: 'utf8' },
  ).trim();
}

// Find the most recent active tenant admin
const adminRow = psql(
  "SELECT u.email, t.slug, t.id FROM users u JOIN user_tenants ut ON ut.user_id = u.id JOIN tenants t ON ut.tenant_id = t.id WHERE u.email LIKE 'qa-s08-admin%' AND u.status='ACTIVE' ORDER BY u.created_at DESC LIMIT 1;"
);
if (!adminRow) {
  console.error('No active tenant admin found');
  process.exit(1);
}
const [email, tenantSlug, tenantId] = adminRow.split('|');
console.log(`Using Tenant: ${tenantSlug} (${tenantId}), User: ${email}`);

// Login to get token
const loginRes = await fetch(`${BASE}/api/v1/auth/login`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email, password: 'E2eForm!2026' }),
});
const loginData = await loginRes.json();
const token = loginData.data?.access_token;
if (!token) {
  console.error('Login failed', loginData);
  process.exit(1);
}
console.log('Login successful');

const fullFormPayload = {
  slug: 'candidate-evaluation-master',
  title: 'Phiếu Tuyển Dụng & Đánh Giá Năng Lực Ứng Viên Toàn Diện',
  description: 'Biểu mẫu ứng tuyển chính thức tích hợp 10 loại trường: văn bản, ngày tháng, số liệu, lựa chọn đơn/đa, đánh giá sao, ma trận 2 chiều và tệp đính kèm.',
  document: {
    items: [
      {
        type: 'SECTION',
        title: 'Phần 1: Thông Tin Cá Nhân & Liên Hệ',
        description: 'Vui lòng cung cấp chính xác thông tin cá nhân để Hội đồng tuyển dụng liên hệ.',
      },
      {
        type: 'SHORT_TEXT',
        ref: 'full_name',
        label: 'Họ và tên ứng viên',
        description: 'Nhập đầy đủ họ tên có dấu',
        placeholder: 'Ví dụ: Nguyễn Văn An',
        required: true,
      },
      {
        type: 'SHORT_TEXT',
        ref: 'contact_email',
        label: 'Email liên hệ',
        description: 'Địa chỉ email nhận thông báo kết quả phỏng vấn',
        placeholder: 'nguyenvanan@example.com',
        required: true,
      },
      {
        type: 'DATE',
        ref: 'dob',
        label: 'Ngày sinh (Tùy chọn)',
        description: 'Ngày sinh theo căn cước công dân',
        required: false,
      },
      {
        type: 'SECTION',
        title: 'Phần 2: Năng Lực Nghiệp Vụ & Kinh Nghiệm Làm Việc',
        description: 'Đánh giá kinh nghiệm thực chiến và kiến thức chuyên môn trong lĩnh vực phần mềm doanh nghiệp.',
      },
      {
        type: 'NUMBER',
        ref: 'years_experience',
        label: 'Số năm kinh nghiệm làm việc trong ngành CNTT/ERP',
        description: 'Nhập số năm kinh nghiệm tích lũy (tối thiểu 0)',
        placeholder: 'Ví dụ: 4',
        required: true,
      },
      {
        type: 'SINGLE_CHOICE',
        ref: 'work_mode',
        label: 'Hình thức làm việc mong muốn',
        description: 'Lựa chọn hình thức phù hợp nhất với kế hoạch của bạn',
        required: true,
        options: [
          { value: 'OFFICE', label: 'Toàn thời gian tại Văn phòng (On-site)' },
          { value: 'HYBRID', label: 'Linh hoạt (Hybrid - 3 ngày văn phòng, 2 ngày tại nhà)' },
          { value: 'REMOTE', label: 'Từ xa toàn thời gian (100% Remote)' },
        ],
      },
      {
        type: 'DROPDOWN',
        ref: 'target_department',
        label: 'Vị trí & Khối phòng ban ứng tuyển',
        description: 'Chọn chuyên môn phù hợp với định hướng phát triển',
        required: true,
        options: [
          { value: 'BACKEND', label: 'Kỹ sư Phần mềm Backend (Quarkus / Java Cloud-Native)' },
          { value: 'FRONTEND', label: 'Kỹ sư Frontend (Angular 22 / Tailwind CSS v4)' },
          { value: 'ARCHITECT', label: 'Kiến trúc sư Giải pháp (Solution Architect)' },
          { value: 'QA_QC', label: 'Kỹ sư Đảm bảo Chất lượng (QA/QC Engineer)' },
          { value: 'DEVOPS', label: 'Chuyên viên Vận hành Hệ thống & Hạ tầng (DevOps/SRE)' },
        ],
      },
      {
        type: 'MULTI_CHOICE',
        ref: 'tech_skills',
        label: 'Kỹ năng & Công nghệ thành thạo (Chọn nhiều mục)',
        description: 'Đánh dấu vào tất cả các công nghệ bạn đã từng sử dụng trong dự án thực tế',
        required: true,
        options: [
          { value: 'QUARKUS_JAVA', label: 'Java 21 & Cloud-native Framework (Quarkus / Spring Boot)' },
          { value: 'ANGULAR', label: 'Angular >= 18 & Design System (Tailwind CSS, Reactive Signals)' },
          { value: 'POSTGRES_REDIS', label: 'Cơ sở dữ liệu Quan hệ & Cache (PostgreSQL Multi-tenant, Redis Cluster)' },
          { value: 'KAFKA_MESSAGING', label: 'Message Broker & Event-Driven Architecture (Apache Kafka)' },
          { value: 'DOCKER_K8S', label: 'Containerization & Điều phối (Docker, Kubernetes Helm)' },
        ],
      },
      {
        type: 'LONG_TEXT',
        ref: 'key_projects',
        label: 'Tóm tắt dự án nổi bật & Thành tích tiêu biểu',
        description: 'Mô tả ngắn gọn về quy mô hệ thống, vai trò đóng góp và kết quả đạt được',
        placeholder: 'Mô tả chi tiết dự án gần nhất của bạn...',
        required: true,
      },
      {
        type: 'SECTION',
        title: 'Phần 3: Đánh Giá Kỹ Năng Mềm & Ngôn Ngữ',
        description: 'Tự đánh giá mức độ thuần thục về ngoại ngữ và các kỹ năng phối hợp công việc.',
      },
      {
        type: 'RATING',
        ref: 'english_proficiency',
        label: 'Tự đánh giá trình độ Tiếng Anh chuyên ngành (Đọc tài liệu & Giao tiếp)',
        description: 'Từ 1 sao (Cơ bản) đến 5 sao (Thành thạo / Lưu loát như người bản xứ)',
        required: true,
      },
      {
        type: 'MATRIX',
        ref: 'soft_skills_evaluation',
        label: 'Ma trận đánh giá các kỹ năng phối hợp & Tác phong làm việc',
        description: 'Đánh dấu mức độ đáp ứng của bản thân đối với từng tiêu chí',
        required: true,
        rows: [
          'Kỹ năng Giao tiếp & Thuyết trình kỹ thuật',
          'Khả năng Làm việc nhóm & Hỗ trợ đồng đội',
          'Tư duy phản biện & Giải quyết sự cố độc lập',
          'Quản lý thời gian, Kỷ luật & Chịu áp lực tiến độ',
        ],
        columns: ['Cơ bản', 'Khá', 'Thành thạo', 'Xuất sắc'],
      },
      {
        type: 'FILE_UPLOAD',
        ref: 'candidate_resume',
        label: 'Đính kèm CV / Hồ sơ năng lực chi tiết (Tùy chọn)',
        description: 'Định dạng hỗ trợ: PDF, DOCX (tối đa 2 tệp, mỗi tệp dung lượng tối đa 10MB)',
        required: false,
        file_limits: {
          max_files: 2,
          max_size_mb: 10,
        },
      },
    ],
  },
};

// Check if form already exists with this slug, if so delete or update
const existingFormsRes = await fetch(`${BASE}/api/v1/plugins/runtime/form/api/v1/form/forms`, {
  headers: { Authorization: `Bearer ${token}` },
});
const existingForms = await existingFormsRes.json();
const prev = (existingForms.data?.items ?? []).find((f) => f.slug === fullFormPayload.slug);

let targetFormId = prev?.id;
if (!targetFormId) {
  const createRes = await fetch(`${BASE}/api/v1/plugins/runtime/form/api/v1/form/forms`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(fullFormPayload),
  });
  const created = await createRes.json();
  targetFormId = created.data?.id;
  console.log(`Created new comprehensive form: id=${targetFormId}`);
} else {
  console.log(`Found existing form: id=${targetFormId}, updating document...`);
  await fetch(`${BASE}/api/v1/plugins/runtime/form/api/v1/form/forms/${targetFormId}`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(fullFormPayload),
  });
}

// Publish the form
const pubRes = await fetch(`${BASE}/api/v1/plugins/runtime/form/api/v1/form/forms/${targetFormId}/publish`, {
  method: 'POST',
  headers: { Authorization: `Bearer ${token}` },
});
const pubData = await pubRes.json();
console.log(`Publish result: status=${pubData.data?.publish_status}`);

// Print public URL
console.log(`Public Form URL: http://localhost:4200/public/forms/${tenantSlug}/${fullFormPayload.slug}`);
