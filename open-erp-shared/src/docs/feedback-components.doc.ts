import { ComponentDoc } from '../models/component-doc.model';

export const FEEDBACK_COMPONENTS_DOCS: ComponentDoc[] = [
  {
    id: 'alert',
    name: 'Alert / Banner',
    category: 'Feedback & Status',
    description: 'Khung cảnh báo tĩnh hiển thị các thông điệp quan trọng của hệ thống (thành công, lỗi, cảnh báo, thông tin) kèm nút đóng và hành động tùy biến.',
    badge: 'Feedback',
    props: [
      { name: 'variant', type: 'AlertVariant | "info" | "success" | "warning" | "error" | "neutral"', default: '"info"', description: 'Màu sắc và mức độ cảnh báo của thông báo', options: ['info', 'success', 'warning', 'error', 'neutral'] },
      { name: 'title', type: 'string', default: 'undefined', description: 'Tiêu đề in đậm của cảnh báo' },
      { name: 'message', type: 'string', default: 'undefined', description: 'Đoạn văn bản mô tả chi tiết thông báo' },
      { name: 'showIcon', type: 'boolean', default: 'true', description: 'Hiển thị biểu tượng tương ứng với trạng thái cảnh báo' },
      { name: 'closable', type: 'boolean', default: 'false', description: 'Hiển thị nút đóng để ẩn cảnh báo' },
      { name: 'banner', type: 'boolean', default: 'false', description: 'Chế độ banner toàn chiều ngang không bo viền đặt ở đầu trang' },
      { name: 'bordered', type: 'boolean', default: 'true', description: 'Hiển thị đường viền bao quanh' }
    ],
    examples: [
      {
        title: 'Cảnh báo thành công với nút đóng',
        description: 'Thông báo xác nhận hoàn thành tác vụ với nút đóng',
        code: `<erp-alert variant="success"
           title="Thanh toán thành công"
           message="Đơn hàng #ERP-2026 đã được xử lý và xuất hóa đơn điện tử."
           [closable]="true">
</erp-alert>`
      },
      {
        title: 'Cảnh báo nguy hiểm (Error Banner)',
        description: 'Banner báo lỗi hệ thống toàn chiều ngang',
        code: `<erp-alert variant="error"
           title="Mất kết nối cơ sở dữ liệu"
           message="Không thể đồng bộ tồn kho. Vui lòng liên hệ IT để được hỗ trợ."
           [banner]="true">
</erp-alert>`
      }
    ]
  },
  {
    id: 'toast',
    name: 'Toast / Notification',
    category: 'Feedback & Status',
    description: 'Hệ thống thông báo nổi tạm thời xuất hiện tại góc màn hình và tự động biến mất với thanh đếm thời gian.',
    badge: 'Service',
    props: [
      { name: 'type', type: 'ToastType | "info" | "success" | "warning" | "error" | "loading"', default: '"info"', description: 'Loại thông báo', options: ['info', 'success', 'warning', 'error', 'loading'] },
      { name: 'title', type: 'string', default: '""', description: 'Tiêu đề thông báo' },
      { name: 'message', type: 'string', default: '""', description: 'Nội dung thông báo' },
      { name: 'duration', type: 'number', default: '4000', description: 'Thời gian tự đóng tính bằng mili-giây (0 = không tự đóng)' },
      { name: 'showProgress', type: 'boolean', default: 'true', description: 'Hiển thị thanh tiến trình đếm ngược' }
    ],
    examples: [
      {
        title: 'Gọi thông báo qua ToastService',
        description: 'Sử dụng ToastService để kích hoạt thông báo từ bất kỳ component nào',
        code: `// Trong component TypeScript:
const toastService = inject(ToastService);

toastService.success('Dữ liệu đã được lưu thành công!', 'Thành công');
toastService.error('Có lỗi xảy ra khi tải dữ liệu', 'Lỗi kết nối');
toastService.loading('Đang sao lưu hệ thống...');`
      }
    ]
  },
  {
    id: 'progress',
    name: 'Progress Bar & Circle',
    category: 'Feedback & Status',
    description: 'Thanh hoặc vòng tròn hiển thị tiến độ hoàn thành tác vụ (theo % hoặc hiệu ứng không xác định - indeterminate).',
    badge: 'Visual',
    props: [
      { name: 'percent', type: 'number', default: '0', description: 'Phần trăm hoàn thành (từ 0 đến 100)' },
      { name: 'variant', type: 'ProgressVariant | "bar" | "circle"', default: '"bar"', description: 'Dạng hiển thị: thanh ngang hoặc vòng tròn', options: ['bar', 'circle'] },
      { name: 'status', type: 'ProgressStatus | "normal" | "success" | "warning" | "error" | "active"', default: '"normal"', description: 'Trạng thái màu sắc tiến trình', options: ['normal', 'success', 'warning', 'error', 'active'] },
      { name: 'showInfo', type: 'boolean', default: 'true', description: 'Hiển thị số % hoặc icon hoàn thành' },
      { name: 'strokeWidth', type: 'number', default: '8', description: 'Độ dày nét tiến trình (px)' },
      { name: 'indeterminate', type: 'boolean', default: 'false', description: 'Chế độ chạy liên tục khi chưa xác định được thời gian' }
    ],
    examples: [
      {
        title: 'Thanh tiến trình hoàn thành',
        description: 'Tiến độ 75% với trạng thái active gradient',
        code: `<erp-progress [percent]="75" status="active" [striped]="true"></erp-progress>`
      },
      {
        title: 'Vòng tròn tiến độ',
        description: 'Tiến trình dạng tròn tròn hiển thị 88%',
        code: `<erp-progress [percent]="88" variant="circle" [circleSize]="120" status="success"></erp-progress>`
      }
    ]
  },
  {
    id: 'result',
    name: 'Result / Error Page',
    category: 'Feedback & Status',
    description: 'Trang hoặc khối thông báo kết quả toàn màn hình cho các trạng thái thành công hoặc lỗi HTTP 403, 404, 500.',
    badge: 'Layout',
    props: [
      { name: 'status', type: 'ResultStatus | "403" | "404" | "500" | "success" | "error" | "warning" | "info"', default: '"info"', description: 'Mã lỗi HTTP hoặc loại kết quả', options: ['403', '404', '500', 'success', 'error', 'warning', 'info'] },
      { name: 'title', type: 'string', default: 'undefined', description: 'Tiêu đề chính' },
      { name: 'subTitle', type: 'string', default: 'undefined', description: 'Đoạn văn bản diễn giải chi tiết' }
    ],
    examples: [
      {
        title: 'Trang 404 Không tìm thấy',
        description: 'Hiển thị trang 404 kèm nút quay về trang chủ',
        code: `<erp-result status="404"
            title="Không tìm thấy trang yêu cầu"
            subTitle="Đường dẫn bạn truy cập có thể đã bị xóa hoặc không hợp lệ.">
  <div result-actions>
    <erp-button variant="primary" iconLeft="home">Về Trang chủ</erp-button>
  </div>
</erp-result>`
      }
    ]
  },
  {
    id: 'watermark',
    name: 'Watermark',
    category: 'Feedback & Status',
    description: 'Khối chèn hình mờ chìm dưới nội dung để hiển thị bản quyền, dấu mật hoặc thông tin nhận diện bảo mật.',
    badge: 'Security',
    props: [
      { name: 'content', type: 'string | string[]', default: '"OPEN ERP 2026"', description: 'Nội dung chữ in mờ' },
      { name: 'rotate', type: 'number', default: '-22', description: 'Góc xoay nghiêng của chữ (độ)' },
      { name: 'opacity', type: 'number', default: '0.12', description: 'Độ trong suốt của hình mờ' },
      { name: 'fontSize', type: 'number', default: '14', description: 'Kích cỡ phông chữ' },
      { name: 'image', type: 'string', default: 'undefined', description: 'Đường dẫn ảnh logo watermark (tùy chọn)' }
    ],
    examples: [
      {
        title: 'Watermark bảo mật văn bản',
        description: 'Bảo vệ bảng biểu hoặc tài liệu hợp đồng nội bộ',
        code: `<erp-watermark [content]="['BẢO MẬT NỘI BỘ', 'MINH.NV - 2026']">
  <div class="p-6 bg-white dark:bg-slate-900 border rounded-2xl">
    <h3 class="font-bold">Báo cáo Tài chính Q3</h3>
    <p>Nội dung nhạy cảm của doanh nghiệp...</p>
  </div>
</erp-watermark>`
      }
    ]
  }
];
