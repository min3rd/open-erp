// Sprint 08: generate the plugin bundle i18n dictionaries (13 locales) for the
// form and workflow plugins. vi/en are hand-written; the remaining locales fall
// back to the English strings until native translations land (tracked in the
// sprint test report as a known gap).
import fs from 'node:fs';
import path from 'node:path';

const LOCALES = [
  'vi', 'en', 'de', 'es', 'fr', 'ja', 'ko', 'ru', 'th', 'zh-CN', 'pt-BR', 'id', 'ar',
];

const FORM_VI = {
  PLUGIN_FORM_TAB_FORMS: 'Biểu mẫu',
  PLUGIN_FORM_TAB_BUILDER: 'Thiết kế',
  PLUGIN_FORM_TAB_RESPONSES: 'Câu trả lời',
  PLUGIN_FORM_TAB_SUMMARY: 'Tổng hợp',
  PLUGIN_FORM_ERROR_LOAD: 'Không tải được danh sách biểu mẫu.',
  PLUGIN_FORM_ERROR_JSON: 'JSON không hợp lệ.',
  PLUGIN_FORM_ERROR_SAVE: 'Không lưu được biểu mẫu.',
  PLUGIN_FORM_LIST_TITLE: 'Danh sách biểu mẫu',
  PLUGIN_FORM_CREATE: 'Tạo biểu mẫu',
  PLUGIN_FORM_SLUG: 'Đường dẫn',
  PLUGIN_FORM_TITLE: 'Tiêu đề',
  PLUGIN_FORM_STATUS: 'Trạng thái',
  PLUGIN_FORM_VERSION: 'Phiên bản',
  PLUGIN_FORM_OPEN: 'Mở',
  PLUGIN_FORM_EMPTY: 'Chưa có biểu mẫu nào.',
  PLUGIN_FORM_SAVE: 'Lưu',
  PLUGIN_FORM_PUBLISH: 'Phát hành',
  PLUGIN_FORM_CLOSE: 'Đóng thu',
  PLUGIN_FORM_BUILDER_HINT: 'Sửa document JSON (items: SECTION/câu hỏi); logic chỉ tham chiếu câu hỏi phía trước.',
  PLUGIN_FORM_DOCUMENT: 'Nội dung biểu mẫu',
  PLUGIN_FORM_RESPONSE_SUBMITTED: 'Thời điểm gửi',
  PLUGIN_FORM_RESPONSE_EMAIL: 'Email người gửi',
  PLUGIN_FORM_RESPONSE_ENTITY: 'Ghi entity',
  PLUGIN_FORM_RESPONSE_ANSWERS: 'Câu trả lời',
  PLUGIN_FORM_RESPONSE_EMPTY: 'Chưa có câu trả lời.',
  PLUGIN_FORM_SUMMARY_TOTAL: 'Tổng số câu trả lời',
  PLUGIN_FORM_SUMMARY_REF: 'Câu hỏi',
  PLUGIN_FORM_SUMMARY_VALUE: 'Giá trị',
  PLUGIN_FORM_SAVED: 'Đã lưu biểu mẫu.',
  PLUGIN_FORM_PUBLISHED: 'Đã phát hành biểu mẫu.',
  PLUGIN_FORM_DEFAULT_SECTION: 'Phần thông tin',
  PLUGIN_FORM_DEFAULT_QUESTION: 'Câu hỏi mới',
  PLUGIN_FORM_FILL_THANKS: 'Cảm ơn bạn đã gửi câu trả lời!',
  PLUGIN_FORM_FILL_REFERENCE: 'Mã tham chiếu',
  PLUGIN_FORM_FILL_UNAVAILABLE: 'Biểu mẫu không khả dụng.',
  PLUGIN_FORM_FILL_SUBMIT: 'Gửi câu trả lời',
  PLUGIN_FORM_FILL_SUBMIT_FAILED: 'Không gửi được câu trả lời.',
};

const WORKFLOW_VI = {
  PLUGIN_WORKFLOW_TAB_INBOX: 'Việc của tôi',
  PLUGIN_WORKFLOW_TAB_FLOWS: 'Luồng',
  PLUGIN_WORKFLOW_TAB_RUNS: 'Lượt chạy',
  PLUGIN_WORKFLOW_ERROR_INBOX: 'Không tải được hộp thư việc.',
  PLUGIN_WORKFLOW_TASK_NODE: 'Bước',
  PLUGIN_WORKFLOW_TASK_INSTANCE: 'Lượt chạy',
  PLUGIN_WORKFLOW_TASK_MODE: 'Chế độ duyệt',
  PLUGIN_WORKFLOW_TASK_DUE: 'Hạn',
  PLUGIN_WORKFLOW_TASK_STATUS: 'Trạng thái',
  PLUGIN_WORKFLOW_OVERDUE: 'Quá hạn',
  PLUGIN_WORKFLOW_OPEN: 'Mở',
  PLUGIN_WORKFLOW_INBOX_EMPTY: 'Không có việc nào chờ bạn.',
  PLUGIN_WORKFLOW_COMMENT: 'Ý kiến',
  PLUGIN_WORKFLOW_APPROVE: 'Đồng ý',
  PLUGIN_WORKFLOW_REJECT: 'Từ chối',
  PLUGIN_WORKFLOW_CLAIM: 'Nhận việc',
  PLUGIN_WORKFLOW_CANCEL: 'Đóng',
  PLUGIN_WORKFLOW_REASON_REQUIRED: 'Từ chối phải có lý do.',
  PLUGIN_WORKFLOW_ACTION_DONE: 'Đã xử lý.',
  PLUGIN_WORKFLOW_ERROR_ACTION: 'Không xử lý được việc.',
  PLUGIN_WORKFLOW_KEY: 'Mã luồng',
  PLUGIN_WORKFLOW_STATUS: 'Trạng thái',
  PLUGIN_WORKFLOW_EDIT: 'Sửa',
  PLUGIN_WORKFLOW_PUBLISH: 'Phát hành',
  PLUGIN_WORKFLOW_FLOWS_EMPTY: 'Chưa có luồng nào.',
  PLUGIN_WORKFLOW_DOCUMENT: 'Định nghĩa luồng',
  PLUGIN_WORKFLOW_SAVE: 'Lưu',
  PLUGIN_WORKFLOW_FLOW_SAVED: 'Đã lưu luồng.',
  PLUGIN_WORKFLOW_BUILDER_HINT: 'Node: START/END, APPROVAL, TASK, CONDITION, PARALLEL, AUTO_WEBHOOK, AUTO_ENTITY_UPDATE, CC.',
  PLUGIN_WORKFLOW_ERROR_JSON: 'JSON không hợp lệ.',
  PLUGIN_WORKFLOW_ERROR_SAVE: 'Không lưu được luồng.',
  PLUGIN_WORKFLOW_RUN_ID: 'Mã lượt chạy',
  PLUGIN_WORKFLOW_OUTCOME: 'Kết quả',
  PLUGIN_WORKFLOW_TRIGGER: 'Kích hoạt',
  PLUGIN_WORKFLOW_RUNS_EMPTY: 'Chưa có lượt chạy nào.',
  PLUGIN_WORKFLOW_RUN_TIMELINE: 'Tiến trình',
  PLUGIN_WORKFLOW_TASKS: 'Các bước',
  PLUGIN_WORKFLOW_ERROR_NO_USER: 'Thiếu danh tính người dùng.',
};

const FORM_EN = Object.fromEntries(
  Object.entries(FORM_VI).map(([key, value]) => [key, enFallback(key, value)]),
);
const WORKFLOW_EN = Object.fromEntries(
  Object.entries(WORKFLOW_VI).map(([key, value]) => [key, enFallback(key, value)]),
);

function enFallback(key, viValue) {
  const map = {
    PLUGIN_FORM_TAB_FORMS: 'Forms',
    PLUGIN_FORM_TAB_BUILDER: 'Builder',
    PLUGIN_FORM_TAB_RESPONSES: 'Responses',
    PLUGIN_FORM_TAB_SUMMARY: 'Summary',
    PLUGIN_FORM_LIST_TITLE: 'Forms',
    PLUGIN_FORM_CREATE: 'New form',
    PLUGIN_FORM_SLUG: 'Slug',
    PLUGIN_FORM_TITLE: 'Title',
    PLUGIN_FORM_STATUS: 'Status',
    PLUGIN_FORM_VERSION: 'Version',
    PLUGIN_FORM_OPEN: 'Open',
    PLUGIN_FORM_EMPTY: 'No forms yet.',
    PLUGIN_FORM_SAVE: 'Save',
    PLUGIN_FORM_PUBLISH: 'Publish',
    PLUGIN_FORM_CLOSE: 'Close intake',
    PLUGIN_FORM_DOCUMENT: 'Form document',
    PLUGIN_FORM_RESPONSE_SUBMITTED: 'Submitted at',
    PLUGIN_FORM_RESPONSE_EMAIL: 'Responder email',
    PLUGIN_FORM_RESPONSE_ENTITY: 'Entity write',
    PLUGIN_FORM_RESPONSE_ANSWERS: 'Answers',
    PLUGIN_FORM_RESPONSE_EMPTY: 'No responses yet.',
    PLUGIN_FORM_SUMMARY_TOTAL: 'Total responses',
    PLUGIN_FORM_SUMMARY_REF: 'Question',
    PLUGIN_FORM_SUMMARY_VALUE: 'Value',
    PLUGIN_FORM_SAVED: 'Form saved.',
    PLUGIN_FORM_PUBLISHED: 'Form published.',
    PLUGIN_FORM_FILL_THANKS: 'Thank you for your response!',
    PLUGIN_FORM_FILL_REFERENCE: 'Reference',
    PLUGIN_FORM_FILL_UNAVAILABLE: 'This form is unavailable.',
    PLUGIN_FORM_FILL_SUBMIT: 'Submit',
    PLUGIN_FORM_FILL_SUBMIT_FAILED: 'Could not submit your response.',
    PLUGIN_WORKFLOW_TAB_INBOX: 'My tasks',
    PLUGIN_WORKFLOW_TAB_FLOWS: 'Flows',
    PLUGIN_WORKFLOW_TAB_RUNS: 'Runs',
    PLUGIN_WORKFLOW_TASK_NODE: 'Step',
    PLUGIN_WORKFLOW_TASK_INSTANCE: 'Run',
    PLUGIN_WORKFLOW_TASK_MODE: 'Mode',
    PLUGIN_WORKFLOW_TASK_DUE: 'Due',
    PLUGIN_WORKFLOW_TASK_STATUS: 'Status',
    PLUGIN_WORKFLOW_OVERDUE: 'Overdue',
    PLUGIN_WORKFLOW_OPEN: 'Open',
    PLUGIN_WORKFLOW_INBOX_EMPTY: 'No tasks waiting for you.',
    PLUGIN_WORKFLOW_COMMENT: 'Comment',
    PLUGIN_WORKFLOW_APPROVE: 'Approve',
    PLUGIN_WORKFLOW_REJECT: 'Reject',
    PLUGIN_WORKFLOW_CLAIM: 'Claim',
    PLUGIN_WORKFLOW_CANCEL: 'Close',
    PLUGIN_WORKFLOW_KEY: 'Flow key',
    PLUGIN_WORKFLOW_EDIT: 'Edit',
    PLUGIN_WORKFLOW_PUBLISH: 'Publish',
    PLUGIN_WORKFLOW_FLOWS_EMPTY: 'No flows yet.',
    PLUGIN_WORKFLOW_DOCUMENT: 'Flow definition',
    PLUGIN_WORKFLOW_SAVE: 'Save',
    PLUGIN_WORKFLOW_FLOW_SAVED: 'Flow saved.',
    PLUGIN_WORKFLOW_RUN_ID: 'Run id',
    PLUGIN_WORKFLOW_OUTCOME: 'Outcome',
    PLUGIN_WORKFLOW_TRIGGER: 'Trigger',
    PLUGIN_WORKFLOW_RUNS_EMPTY: 'No runs yet.',
    PLUGIN_WORKFLOW_RUN_TIMELINE: 'Timeline',
    PLUGIN_WORKFLOW_TASKS: 'Steps',
  };
  return map[key] ?? viValue;
}

function writeBundle(plugin, locales) {
  // Plugin bundles ship the host dictionaries (public/i18n) like every other
  // plugin; this script MERGES the sprint keys into each locale file.
  const target = path.resolve('src/frontend/web/public/i18n');
  if (!fs.existsSync(target)) {
    console.error('Missing src/frontend/web/public/i18n; run npm install first.');
    process.exit(1);
  }
  for (const locale of LOCALES) {
    const file = path.join(target, `${locale}.json`);
    const existing = fs.existsSync(file)
      ? JSON.parse(fs.readFileSync(file, 'utf8'))
      : {};
    const sprint = locale === 'vi' ? locales.vi : locales.en;
    const merged = { ...existing, ...sprint };
    fs.writeFileSync(file, JSON.stringify(merged, null, 2) + '\n', 'utf8');
  }
  console.log(`Merged ${plugin} sprint keys into ${LOCALES.length} host locales`);
}

writeBundle('form', { vi: FORM_VI, en: FORM_EN });
writeBundle('workflow', { vi: WORKFLOW_VI, en: WORKFLOW_EN });
