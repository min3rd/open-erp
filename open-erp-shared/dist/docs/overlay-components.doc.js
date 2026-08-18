export const OVERLAY_COMPONENTS_DOCS = [
    {
        id: 'modal',
        name: 'Modal / Dialog',
        category: 'Overlay & Popups',
        description: 'Cửa sổ đối thoại nổi đè lên màn hình chính với backdrop làm mờ glassmorphism và khóa cuộn trang, phục vụ xác nhận hoặc nhập liệu quan trọng.',
        badge: 'Overlay',
        props: [
            { name: 'visible', type: 'boolean', default: 'false', description: 'Trạng thái hiển thị / ẩn của Modal' },
            { name: 'title', type: 'string', default: 'undefined', description: 'Tiêu đề trên thanh tiêu đề Modal' },
            { name: 'subtitle', type: 'string', default: 'undefined', description: 'Mô tả phụ dưới tiêu đề' },
            { name: 'size', type: 'ModalSize | "xs" | "sm" | "md" | "lg" | "xl" | "full"', default: '"md"', description: 'Độ rộng của hộp thoại', options: ['xs', 'sm', 'md', 'lg', 'xl', 'full'] },
            { name: 'closable', type: 'boolean', default: 'true', description: 'Hiển thị nút X đóng góc trên phải' },
            { name: 'maskClosable', type: 'boolean', default: 'true', description: 'Đóng Modal khi click vào vùng đen bên ngoài' },
            { name: 'showFooter', type: 'boolean', default: 'true', description: 'Hiển thị vùng chân trang với nút Hủy và Xác nhận' }
        ],
        examples: [
            {
                title: 'Mẫu Modal thêm mới người dùng',
                description: 'Modal nhập liệu với kích cỡ MD',
                code: `<erp-modal [(visible)]="showModal"
           title="Thêm Người dùng Mới"
           subtitle="Nhập thông tin tài khoản nhân sự"
           icon="user-plus"
           (ok)="handleSaveUser()">
  <div class="space-y-4">
    <erp-input label="Họ và tên" placeholder="Nguyễn Văn A"></erp-input>
    <erp-input label="Email công vụ" placeholder="user@company.vn"></erp-input>
  </div>
</erp-modal>`
            }
        ]
    },
    {
        id: 'drawer',
        name: 'Drawer / Slide-over',
        category: 'Overlay & Popups',
        description: 'Khung trượt ra từ 4 cạnh màn hình (trái, phải, trên, dưới) thích hợp cho biểu mẫu dài hoặc chi tiết bản ghi.',
        badge: 'Overlay',
        props: [
            { name: 'visible', type: 'boolean', default: 'false', description: 'Trạng thái hiển thị ngăn kéo' },
            { name: 'placement', type: 'DrawerPlacement | "left" | "right" | "top" | "bottom"', default: '"right"', description: 'Cạnh màn hình ngăn kéo trượt ra', options: ['left', 'right', 'top', 'bottom'] },
            { name: 'size', type: 'DrawerSize | "sm" | "md" | "lg" | "xl" | "full"', default: '"md"', description: 'Độ rộng hoặc chiều cao của ngăn kéo', options: ['sm', 'md', 'lg', 'xl', 'full'] },
            { name: 'title', type: 'string', default: 'undefined', description: 'Tiêu đề của Drawer' }
        ],
        examples: [
            {
                title: 'Ngăn kéo chi tiết đơn hàng (Right Drawer)',
                description: 'Trượt ra từ bên phải màn hình',
                code: `<erp-drawer [(visible)]="showDrawer"
            title="Chi tiết Đơn hàng #ORD-889"
            placement="right"
            size="lg">
  <p>Toàn bộ danh sách mặt hàng và nhật ký vận chuyển...</p>
</erp-drawer>`
            }
        ]
    },
    {
        id: 'popover',
        name: 'Popover',
        category: 'Overlay & Popups',
        description: 'Khối nội dung tương tác nổi cạnh phần tử kích hoạt khi click hoặc hover.',
        badge: 'Floating',
        props: [
            { name: 'title', type: 'string', default: 'undefined', description: 'Tiêu đề của Popover' },
            { name: 'content', type: 'string', default: 'undefined', description: 'Nội dung dạng chuỗi (nếu không dùng template)' },
            { name: 'placement', type: 'PopoverPlacement | "top" | "bottom" | "left" | "right"', default: '"top"', description: 'Hướng hiển thị', options: ['top', 'bottom', 'left', 'right'] },
            { name: 'trigger', type: 'PopoverTrigger | "click" | "hover"', default: '"click"', description: 'Phương thức kích hoạt', options: ['click', 'hover'] }
        ],
        examples: [
            {
                title: 'Popover bộ lọc nâng cao',
                description: 'Mở bảng lọc khi click vào nút bấm',
                code: `<erp-popover title="Bộ lọc nâng cao" placement="bottom">
  <button popover-trigger class="px-4 py-2 border rounded-xl">Mở Bộ lọc</button>
  <div class="space-y-2">
    <p>Chọn các điều kiện lọc nâng cao...</p>
  </div>
</erp-popover>`
            }
        ]
    },
    {
        id: 'popconfirm',
        name: 'Popconfirm',
        category: 'Overlay & Popups',
        description: 'Hộp thoại xác nhận hành động nhanh (Đồng ý / Hủy) gắn trực tiếp vào phần tử kích hoạt.',
        badge: 'Interactive',
        props: [
            { name: 'title', type: 'string', default: '"Bạn có chắc chắn muốn thực hiện?"', description: 'Câu hỏi xác nhận' },
            { name: 'description', type: 'string', default: 'undefined', description: 'Diễn giải chi tiết hậu quả của hành động' },
            { name: 'okText', type: 'string', default: '"Đồng ý"', description: 'Chữ trên nút xác nhận' },
            { name: 'cancelText', type: 'string', default: '"Hủy"', description: 'Chữ trên nút hủy' },
            { name: 'okVariant', type: 'ButtonVariant | "primary" | "danger"', default: '"primary"', description: 'Kiểu nút xác nhận', options: ['primary', 'danger'] }
        ],
        examples: [
            {
                title: 'Xác nhận xóa bản ghi',
                description: 'Hộp thoại xác nhận màu đỏ cảnh báo xóa dữ liệu vĩnh viễn',
                code: `<erp-popconfirm title="Xóa tài khoản này?"
               description="Thao tác này không thể hoàn tác."
               okText="Xóa luôn"
               okVariant="danger"
               (confirm)="handleDelete()">
  <erp-button variant="danger" iconLeft="trash-2">Xóa người dùng</erp-button>
</erp-popconfirm>`
            }
        ]
    },
    {
        id: 'context-menu',
        name: 'Context Menu',
        category: 'Overlay & Popups',
        description: 'Trình đơn chuột phải tùy biến xuất hiện chính xác tại tọa độ chuột của người dùng.',
        badge: 'Desktop',
        props: [
            { name: 'items', type: 'ContextMenuItem[]', default: '[]', description: 'Danh sách các mục menu (label, icon, shortcut, danger, divider, action)' },
            { name: 'disabled', type: 'boolean', default: 'false', description: 'Vô hiệu hóa trình đơn chuột phải' }
        ],
        examples: [
            {
                title: 'Menu chuột phải cho vùng dữ liệu',
                description: 'Hiển thị menu ngữ cảnh khi click chuột phải',
                code: `<erp-context-menu [items]="[
  { label: 'Chỉnh sửa', icon: 'edit', shortcut: 'Ctrl+E' },
  { label: 'Sao chép ID', icon: 'copy' },
  { divider: true },
  { label: 'Xóa bản ghi', icon: 'trash-2', danger: true }
]">
  <div class="p-8 border rounded-2xl bg-slate-50 dark:bg-slate-900">
    Click chuột phải vào đây để mở Context Menu
  </div>
</erp-context-menu>`
            }
        ]
    },
    {
        id: 'lightbox',
        name: 'Lightbox / Image Preview',
        category: 'Overlay & Popups',
        description: 'Lớp phủ xem ảnh toàn màn hình với tính năng phóng to/thu nhỏ, xoay ảnh và điều hướng ảnh trước/sau.',
        badge: 'Media',
        props: [
            { name: 'images', type: 'string[]', default: '[]', description: 'Danh sách URL các hình ảnh' },
            { name: 'currentIndex', type: 'number', default: '0', description: 'Vị trí ảnh đang xem' },
            { name: 'visible', type: 'boolean', default: 'false', description: 'Trạng thái hiển thị Lightbox' }
        ],
        examples: [
            {
                title: 'Mở Lightbox bộ sưu tập ảnh',
                description: 'Xem toàn màn hình bộ ảnh sản phẩm',
                code: `<erp-lightbox [images]="galleryList"
              [(visible)]="showLightbox"
              [(currentIndex)]="selectedPhotoIndex">
</erp-lightbox>`
            }
        ]
    }
];
//# sourceMappingURL=overlay-components.doc.js.map