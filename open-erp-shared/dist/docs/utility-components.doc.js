export const UTILITY_COMPONENTS_DOCS = [
    {
        id: 'portal',
        name: 'Portal Directive',
        category: 'Utilities & Misc',
        description: 'Cơ chế dịch chuyển render một template DOM ra ngoài cây phân cấp cha (mặc định ra document.body).',
        badge: 'DOM',
        props: [
            { name: 'erpPortal', type: 'string', default: '"body"', description: 'CSS selector của container đích nơi template được chèn vào' }
        ],
        examples: [
            {
                title: 'Render phần tử trực tiếp vào document.body',
                description: 'Chuyển một banner hoặc popup ra ngoài container hiện tại',
                code: `<div *erpPortal>
  <div class="fixed top-4 right-4 p-4 bg-indigo-600 text-white rounded-2xl shadow-xl z-50">
    Nội dung này được render tại document.body
  </div>
</div>`
            }
        ]
    },
    {
        id: 'affix',
        name: 'Affix / Sticky',
        category: 'Utilities & Misc',
        description: 'Tự động ghim cố định một phần tử trên màn hình khi người dùng cuộn trang vượt qua ngưỡng chỉ định.',
        badge: 'Scroll',
        props: [
            { name: 'offsetTop', type: 'number', default: '0', description: 'Khoảng cách cách mép trên khi ghim (px)' },
            { name: 'offsetBottom', type: 'number', default: '0', description: 'Khoảng cách cách mép dưới khi ghim (px)' },
            { name: 'position', type: 'AffixPosition | "top" | "bottom"', default: '"top"', description: 'Vị trí ghim (đỉnh hoặc đáy)', options: ['top', 'bottom'] }
        ],
        examples: [
            {
                title: 'Ghim thanh công cụ ở đỉnh màn hình',
                description: 'Cố định thanh công cụ cách đỉnh 16px khi cuộn trang',
                code: `<erp-affix [offsetTop]="16">
  <div class="p-4 bg-white dark:bg-slate-900 border rounded-2xl shadow-md flex items-center justify-between">
    <span class="font-bold">Thanh công cụ cố định</span>
    <erp-button size="sm">Lưu ngay</erp-button>
  </div>
</erp-affix>`
            }
        ]
    },
    {
        id: 'virtual-scroll',
        name: 'Virtual Scroll / Virtual List',
        category: 'Utilities & Misc',
        description: 'Trình render danh sách ảo tối ưu hiệu năng, chỉ hiển thị các phần tử nằm trong viewport cho tập dữ liệu lớn hàng chục ngàn dòng.',
        badge: 'Performance',
        props: [
            { name: 'items', type: 'any[]', default: '[]', description: 'Danh sách mảng dữ liệu nguồn' },
            { name: 'itemSize', type: 'number', default: '48', description: 'Chiều cao cố định của mỗi hàng (px)' },
            { name: 'height', type: 'string', default: '"360px"', description: 'Chiều cao của khung cuộn container' }
        ],
        examples: [
            {
                title: 'Render 10,000 dòng dữ liệu siêu mượt',
                description: 'Hiển thị danh sách khách hàng lớn không giật lag',
                code: `<erp-virtual-scroll [items]="largeCustomerList" [itemSize]="52" height="400px">
  <ng-template let-customer let-index="index">
    <div class="flex items-center justify-between px-4 py-3 border-b hover:bg-slate-50">
      <span>#{{ index + 1 }} {{ customer.name }}</span>
      <span class="text-xs text-slate-400">{{ customer.phone }}</span>
    </div>
  </ng-template>
</erp-virtual-scroll>`
            }
        ]
    },
    {
        id: 'copy-button',
        name: 'Copy to Clipboard',
        category: 'Utilities & Misc',
        description: 'Nút bấm hoặc directive hỗ trợ sao chép nhanh chuỗi văn bản vào bộ nhớ tạm kèm hiệu ứng thông báo.',
        badge: 'Interaction',
        props: [
            { name: 'value', type: 'string', default: '""', description: 'Nội dung cần sao chép' },
            { name: 'text', type: 'string', default: '"Sao chép"', description: 'Nhãn văn bản trên nút' },
            { name: 'copiedText', type: 'string', default: '"Đã sao chép!"', description: 'Nhãn thông báo khi sao chép thành công' }
        ],
        examples: [
            {
                title: 'Nút sao chép mã Token',
                description: 'Sao chép mã API key bảo mật',
                code: `<erp-copy-button value="sk_live_erp_98492847291839218" text="Copy API Key"></erp-copy-button>`
            }
        ]
    },
    {
        id: 'resizable',
        name: 'Resizable Container',
        category: 'Utilities & Misc',
        description: 'Khối cho phép người dùng kéo thả góc hoặc cạnh để thay đổi kích thước thủ công theo ý muốn.',
        badge: 'Drag & Drop',
        props: [
            { name: 'initialWidth', type: 'number', default: '320', description: 'Chiều rộng ban đầu (px)' },
            { name: 'initialHeight', type: 'number', default: '200', description: 'Chiều cao ban đầu (px)' },
            { name: 'minWidth', type: 'number', default: '160', description: 'Chiều rộng tối thiểu (px)' },
            { name: 'minHeight', type: 'number', default: '100', description: 'Chiều cao tối thiểu (px)' }
        ],
        examples: [
            {
                title: 'Khung điều chỉnh kích cỡ kéo thả',
                description: 'Khung tùy biến kích thước nội dung',
                code: `<erp-resizable [initialWidth]="360" [initialHeight]="220">
  <div class="h-full flex flex-col justify-between">
    <h4 class="font-bold text-xs">Cửa sổ có thể co giãn</h4>
    <p class="text-xs text-slate-500">Kéo cạnh phải hoặc góc dưới để thay đổi kích thước.</p>
  </div>
</erp-resizable>`
            }
        ]
    },
    {
        id: 'transition',
        name: 'Transitions & Motion Wrapper',
        category: 'Utilities & Misc',
        description: 'Thành phần bao bọc xử lý hiệu ứng chuyển cảnh mượt mà khi phần tử xuất hiện hoặc biến mất.',
        badge: 'Animation',
        props: [
            { name: 'show', type: 'boolean', default: 'true', description: 'Trạng thái hiển thị' },
            { name: 'type', type: 'TransitionType | "fade" | "scale" | "slide-up" | "slide-down" | "slide-left" | "slide-right"', default: '"fade"', description: 'Kiểu hiệu ứng chuyển cảnh', options: ['fade', 'scale', 'slide-up', 'slide-down', 'slide-left', 'slide-right'] },
            { name: 'duration', type: 'number', default: '250', description: 'Thời gian chạy hiệu ứng (ms)' }
        ],
        examples: [
            {
                title: 'Bao bọc hiệu ứng Zoom In',
                description: 'Hiệu ứng scale mượt mà cho khối nội dung',
                code: `<erp-transition [show]="isPanelOpen" type="scale">
  <div class="p-6 bg-white dark:bg-slate-900 border rounded-2xl shadow-lg">
    Nội dung xuất hiện với hiệu ứng phóng to tinh tế
  </div>
</erp-transition>`
            }
        ]
    }
];
//# sourceMappingURL=utility-components.doc.js.map