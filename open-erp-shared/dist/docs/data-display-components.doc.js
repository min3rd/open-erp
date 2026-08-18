export const TABLE_DOC = {
    id: 'table',
    name: 'Table / Data Grid',
    selector: 'erp-table',
    category: 'Data Display',
    description: 'Bảng dữ liệu doanh nghiệp đa tính năng hỗ trợ phân trang tích hợp, sắp xếp đa cột (sort asc/desc), chọn dòng (checkbox/select all), sticky header và loading skeleton.',
    importStatement: `import { TableComponent, TableColumn, TableSortDirection } from '@open-erp/shared';`,
    props: [
        { name: 'columns', type: 'TableColumn<T>[]', default: '[]', description: 'Cấu hình danh sách các cột trong bảng.' },
        { name: 'data', type: 'T[]', default: '[]', description: 'Mảng dữ liệu đối tượng hiển thị.' },
        { name: 'loading', type: 'boolean', default: 'false', description: 'Hiển thị hiệu ứng shimmer skeleton khi gọi API.' },
        { name: 'striped', type: 'boolean', default: 'false', description: 'Kẻ sọc xen kẽ giữa các dòng dữ liệu.' },
        { name: 'bordered', type: 'boolean', default: 'true', description: 'Hiển thị viền bo góc bao quanh bảng.' },
        { name: 'selectable', type: 'boolean', default: 'false', description: 'Cho phép chọn từng dòng hoặc chọn tất cả bằng checkbox.' },
        { name: 'pagination', type: 'boolean', default: 'false', description: 'Tích hợp thanh phân trang ở cuối bảng.' }
    ],
    examples: [
        {
            title: 'Bảng danh sách đơn hàng ERP',
            description: 'Hiển thị bảng dữ liệu có sắp xếp và phân trang.',
            code: `<erp-table [columns]="[
  { key: 'code', title: 'Mã đơn', sortable: true, width: '120px' },
  { key: 'customer', title: 'Khách hàng', sortable: true },
  { key: 'total', title: 'Tổng tiền (VNĐ)', align: 'right', sortable: true },
  { key: 'status', title: 'Trạng thái', align: 'center' }
]" [data]="ordersData" [selectable]="true" [pagination]="true" [totalItems]="100">
</erp-table>`
        }
    ]
};
export const CARD_DOC = {
    id: 'card',
    name: 'Card',
    selector: 'erp-card',
    category: 'Data Display',
    description: 'Khung chứa nhóm thông tin liên quan với tiêu đề, biểu tượng, ảnh bìa, phần thân và chân thẻ hành động, hỗ trợ hiệu ứng hover nổi bật.',
    importStatement: `import { CardComponent, CardVariant } from '@open-erp/shared';`,
    props: [
        { name: 'title', type: 'string', default: 'undefined', description: 'Tiêu đề chính của thẻ.' },
        { name: 'subtitle', type: 'string', default: 'undefined', description: 'Mô tả phụ dưới tiêu đề.' },
        { name: 'icon', type: 'IconName', default: 'undefined', description: 'Biểu tượng góc trái header.' },
        { name: 'coverImage', type: 'string', default: 'undefined', description: 'Đường dẫn ảnh bìa trên đầu thẻ.' },
        { name: 'variant', type: `CardVariant | 'elevated' | 'outlined' | 'filled' | 'ghost'`, default: 'CardVariant.ELEVATED', description: 'Biến thể giao diện của thẻ.' },
        { name: 'hoverable', type: 'boolean', default: 'false', description: 'Hiệu ứng nhấc nổi khi di chuột qua.' },
        { name: 'loading', type: 'boolean', default: 'false', description: 'Hiệu ứng tải Skeleton.' }
    ],
    examples: [
        {
            title: 'Thẻ thông tin tổng hợp',
            description: 'Hiển thị thông tin dự án kèm nút hành động.',
            code: `<erp-card title="Dự án ERP 2026" subtitle="Khách hàng Tập đoàn Vingroup" icon="briefcase" [hoverable]="true">
  <p>Hệ thống quản trị chuỗi cung ứng và kho bãi thông minh.</p>
  <div card-footer class="flex justify-end gap-2">
    <erp-button variant="secondary" size="sm">Chi tiết</erp-button>
    <erp-button variant="primary" size="sm">Cập nhật</erp-button>
  </div>
</erp-card>`
        }
    ]
};
export const LIST_DOC = {
    id: 'list',
    name: 'List / List Item',
    selector: 'erp-list',
    category: 'Data Display',
    description: 'Danh sách hiển thị các mục thông tin tuần tự có thể kèm biểu tượng, avatar tiền tố và nút hành động hoặc liên kết.',
    importStatement: `import { ListComponent, ListItemComponent } from '@open-erp/shared';`,
    props: [
        { name: 'header', type: 'string', default: 'undefined', description: 'Tiêu đề đầu danh sách.' },
        { name: 'footer', type: 'string', default: 'undefined', description: 'Văn bản chú thích cuối danh sách.' },
        { name: 'bordered', type: 'boolean', default: 'true', description: 'Bao khung viền cho danh sách.' }
    ],
    examples: [
        {
            title: 'Danh sách thông báo gần đây',
            description: 'Hiển thị các mục thông báo kèm icon và liên kết chi tiết.',
            code: `<erp-list header="Thông báo hệ thống">
  <erp-list-item title="Đơn hàng mới #DH-992" description="Khách hàng vừa thanh toán chuyển khoản" icon="shopping-bag" [clickable]="true"></erp-list-item>
  <erp-list-item title="Cảnh báo tồn kho" description="Sản phẩm iPhone 16 Pro Max còn dưới 5 chiếc" icon="alert-triangle" [clickable]="true"></erp-list-item>
</erp-list>`
        }
    ]
};
export const AVATAR_GROUP_DOC = {
    id: 'avatar-group',
    name: 'Avatar Group',
    selector: 'erp-avatar-group',
    category: 'Data Display',
    description: 'Nhóm avatar người dùng xếp chồng lồng vào nhau, tự động hiển thị số lượng thành viên còn lại (+N).',
    importStatement: `import { AvatarGroupComponent, AvatarGroupUser } from '@open-erp/shared';`,
    props: [
        { name: 'users', type: 'AvatarGroupUser[]', default: '[]', description: 'Danh sách người dùng trong nhóm.' },
        { name: 'max', type: 'number', default: '4', description: 'Số lượng avatar tối đa hiển thị.' },
        { name: 'size', type: `AvatarSize | 'xs' | 'sm' | 'md' | 'lg' | 'xl'`, default: 'AvatarSize.MD', description: 'Kích thước avatar.' },
        { name: 'shape', type: `AvatarShape | 'circle' | 'rounded' | 'square'`, default: 'AvatarShape.CIRCLE', description: 'Hình dáng avatar.' }
    ],
    examples: [
        {
            title: 'Nhóm nhân sự dự án',
            description: 'Hiển thị avatar các thành viên tham gia.',
            code: `<erp-avatar-group [users]="[
  { name: 'Minh Nguyen' },
  { name: 'Lan Anh' },
  { name: 'Tuan Kiet' },
  { name: 'Bao Ngoc' },
  { name: 'Hoang Nam' }
]" [max]="3"></erp-avatar-group>`
        }
    ]
};
export const ACCORDION_DOC = {
    id: 'accordion',
    name: 'Accordion / Collapse',
    selector: 'erp-accordion',
    category: 'Data Display',
    description: 'Khối nội dung có thể thu gọn hoặc mở rộng khi click để tiết kiệm không gian màn hình, hỗ trợ chế độ đơn mục hoặc đa mục.',
    importStatement: `import { AccordionComponent, AccordionItem } from '@open-erp/shared';`,
    props: [
        { name: 'items', type: 'AccordionItem[]', default: '[]', description: 'Danh sách các mục accordion.' },
        { name: 'expandMultiple', type: 'boolean', default: 'false', description: 'Cho phép mở nhiều mục cùng lúc.' },
        { name: 'bordered', type: 'boolean', default: 'true', description: 'Đóng khung viền bao quanh.' }
    ],
    examples: [
        {
            title: 'Câu hỏi thường gặp (FAQ)',
            description: 'Thu gọn các câu trả lời chi tiết.',
            code: `<erp-accordion [items]="[
  { title: 'Làm thế nào để đổi mật khẩu?', content: 'Vào Cài đặt tài khoản > Bảo mật > Đổi mật khẩu.', icon: 'lock' },
  { title: 'Hạn mức xuất hóa đơn trong ngày?', content: 'Mỗi tenant được xuất tối đa 500 hóa đơn/ngày.', icon: 'file-text' }
]"></erp-accordion>`
        }
    ]
};
export const TIMELINE_DOC = {
    id: 'timeline',
    name: 'Timeline',
    selector: 'erp-timeline',
    category: 'Data Display',
    description: 'Dòng thời gian hiển thị chuỗi sự kiện hoặc lịch sử theo thứ tự ngày giờ với các điểm mốc màu sắc và icon.',
    importStatement: `import { TimelineComponent, TimelineItem, TimelinePosition } from '@open-erp/shared';`,
    props: [
        { name: 'items', type: 'TimelineItem[]', default: '[]', description: 'Danh sách sự kiện theo mốc thời gian.' },
        { name: 'reverse', type: 'boolean', default: 'false', description: 'Đảo ngược thứ tự thời gian.' },
        { name: 'loading', type: 'boolean', default: 'false', description: 'Hiển thị hiệu ứng tải Skeleton.' }
    ],
    examples: [
        {
            title: 'Lịch sử xử lý đơn hàng',
            description: 'Theo dõi tiến trình từ tạo đơn đến giao hàng.',
            code: `<erp-timeline [items]="[
  { title: 'Đơn hàng được tạo', timestamp: '08:30 18/08/2026', color: 'primary', icon: 'file-plus' },
  { title: 'Đã đóng gói hàng', timestamp: '10:15 18/08/2026', color: 'warning', icon: 'box' },
  { title: 'Giao hàng thành công', timestamp: '14:20 18/08/2026', color: 'success', icon: 'check' }
]"></erp-timeline>`
        }
    ]
};
export const TREE_VIEW_DOC = {
    id: 'tree-view',
    name: 'Tree View',
    selector: 'erp-tree-view',
    category: 'Data Display',
    description: 'Cấu trúc cây phân cấp danh mục hoặc dữ liệu cha - con hỗ trợ thu gọn/bung mở, chọn nút và checkbox cấp bậc.',
    importStatement: `import { TreeViewComponent, TreeNode } from '@open-erp/shared';`,
    props: [
        { name: 'nodes', type: 'TreeNode[]', default: '[]', description: 'Cây dữ liệu các nút danh mục.' },
        { name: 'checkable', type: 'boolean', default: 'false', description: 'Hiển thị checkbox chọn nút.' },
        { name: 'selectable', type: 'boolean', default: 'true', description: 'Cho phép nhấp chọn nút.' },
        { name: 'searchable', type: 'boolean', default: 'false', description: 'Tích hợp ô tìm kiếm lọc nút cây.' }
    ],
    examples: [
        {
            title: 'Cây thư mục tài liệu phòng ban',
            description: 'Phân cấp phòng ban và tài liệu nội bộ.',
            code: `<erp-tree-view [nodes]="[
  { 
    id: 'root-1', 
    label: 'Khối Công nghệ', 
    expanded: true,
    children: [
      { id: 'sub-1', label: 'Frontend Team (Angular)' },
      { id: 'sub-2', label: 'Backend Team (.NET)' }
    ]
  }
]"></erp-tree-view>`
        }
    ]
};
export const STATISTIC_DOC = {
    id: 'statistic',
    name: 'Statistic / KPI Card',
    selector: 'erp-statistic',
    category: 'Data Display',
    description: 'Khối làm nổi bật các con số thống kê, chỉ số hiệu suất kèm tiền tố, hậu tố và xu hướng tăng/giảm.',
    importStatement: `import { StatisticComponent } from '@open-erp/shared';`,
    props: [
        { name: 'title', type: 'string', default: "''", description: 'Tiêu đề chỉ số thống kê.' },
        { name: 'value', type: 'string | number', default: "''", description: 'Giá trị con số nổi bật.' },
        { name: 'prefix', type: 'string', default: 'undefined', description: 'Ký tự hoặc đơn vị phía trước.' },
        { name: 'suffix', type: 'string', default: 'undefined', description: 'Đơn vị đo lường phía sau.' },
        { name: 'trend', type: `'up' | 'down' | 'neutral'`, default: 'undefined', description: 'Chiều hướng biến động.' },
        { name: 'trendValue', type: 'string', default: 'undefined', description: 'Phần trăm hoặc giá trị thay đổi.' }
    ],
    examples: [
        {
            title: 'Doanh thu tháng hiện tại',
            description: 'Hiển thị tổng doanh thu và tỷ lệ tăng trưởng.',
            code: `<erp-statistic title="Tổng doanh thu"
               value="1.250.000.000"
               suffix="₫"
               icon="dollar-sign"
               trend="up"
               trendValue="+24.5%"
               trendLabel="so với tháng trước">
</erp-statistic>`
        }
    ]
};
export const CAROUSEL_DOC = {
    id: 'carousel',
    name: 'Carousel / Slider',
    selector: 'erp-carousel',
    category: 'Data Display',
    description: 'Trình chiếu trượt qua lại giữa nhiều hình ảnh hoặc thẻ nội dung kèm autoplay và nút chuyển trang.',
    importStatement: `import { CarouselComponent, CarouselSlide } from '@open-erp/shared';`,
    props: [
        { name: 'slides', type: '(string | CarouselSlide)[]', default: '[]', description: 'Danh sách các slide trình chiếu.' },
        { name: 'autoplay', type: 'boolean', default: 'true', description: 'Tự động trượt sau khoảng thời gian interval.' },
        { name: 'interval', type: 'number', default: '4000', description: 'Thời gian dừng mỗi slide (ms).' },
        { name: 'height', type: 'string', default: "'240px'", description: 'Chiều cao khung trình chiếu.' }
    ],
    examples: [
        {
            title: 'Banner quảng bá tính năng mới',
            description: 'Trình chiếu slide hình ảnh và thông điệp.',
            code: `<erp-carousel [slides]="[
  { title: 'Phân hệ Kế toán ERP 2.0', subtitle: 'Tích hợp hóa đơn điện tử tự động', tag: 'Mới ra mắt' },
  { title: 'Báo cáo thông minh AI', subtitle: 'Dự báo dòng tiền thời gian thực', tag: 'AI Powered' }
]"></erp-carousel>`
        }
    ]
};
export const DESCRIPTIONS_DOC = {
    id: 'descriptions',
    name: 'Descriptions / Key-Value Pair',
    selector: 'erp-descriptions',
    category: 'Data Display',
    description: 'Danh sách hiển thị theo cặp thuộc tính - giá trị để xem chi tiết bản ghi đơn hàng, khách hàng, hợp đồng.',
    importStatement: `import { DescriptionsComponent, DescriptionItem } from '@open-erp/shared';`,
    props: [
        { name: 'title', type: 'string', default: 'undefined', description: 'Tiêu đề thông tin chi tiết.' },
        { name: 'items', type: 'DescriptionItem[]', default: '[]', description: 'Mảng danh sách các cặp thuộc tính - giá trị.' },
        { name: 'column', type: 'number', default: '3', description: 'Số cột chia trong lưới hiển thị (1, 2, 3, 4).' }
    ],
    examples: [
        {
            title: 'Chi tiết hồ sơ khách hàng',
            description: 'Hiển thị các trường thông tin đối tác.',
            code: `<erp-descriptions title="Thông tin khách hàng" [items]="[
  { label: 'Tên đối tác', value: 'Công ty TNHH Giải pháp Phần mềm' },
  { label: 'Mã số thuế', value: '0108892144' },
  { label: 'Hạn mức nợ', value: '500.000.000 ₫', badge: 'VIP' }
]"></erp-descriptions>`
        }
    ]
};
export const IMAGE_DOC = {
    id: 'image',
    name: 'Image / Image Gallery',
    selector: 'erp-image',
    category: 'Data Display',
    description: 'Khung hiển thị hình ảnh kèm tính năng xem trước phóng to (Lightbox Preview), xoay ảnh và fallback khi lỗi.',
    importStatement: `import { ImageComponent, ImageGalleryComponent } from '@open-erp/shared';`,
    props: [
        { name: 'src', type: 'string', default: "''", description: 'Đường dẫn URL hình ảnh.' },
        { name: 'preview', type: 'boolean', default: 'true', description: 'Cho phép nhấp để mở Lightbox phóng to.' },
        { name: 'rounded', type: `'none' | 'sm' | 'md' | 'lg' | 'xl' | 'full'`, default: "'lg'", description: 'Bo góc hình ảnh.' }
    ],
    examples: [
        {
            title: 'Hình ảnh chứng từ đính kèm',
            description: 'Xem trước phóng to hình ảnh hóa đơn.',
            code: `<erp-image src="https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600" width="200px" height="140px"></erp-image>`
        }
    ]
};
export const CALENDAR_DOC = {
    id: 'calendar',
    name: 'Calendar',
    selector: 'erp-calendar',
    category: 'Data Display',
    description: 'Lịch hiển thị các ngày trong tháng để xem lịch trình, sự kiện và chọn ngày làm việc.',
    importStatement: `import { CalendarComponent, CalendarEvent } from '@open-erp/shared';`,
    props: [
        { name: 'selectedDate', type: 'string', default: 'undefined', description: 'Ngày được chọn (YYYY-MM-DD).' },
        { name: 'events', type: 'CalendarEvent[]', default: '[]', description: 'Danh sách sự kiện hiển thị chấm đánh dấu.' }
    ],
    examples: [
        {
            title: 'Lịch công tác tháng',
            description: 'Theo dõi sự kiện và lịch hẹn khách hàng.',
            code: `<erp-calendar [events]="[
  { date: '2026-08-18', title: 'Họp ban giám đốc' },
  { date: '2026-08-25', title: 'Quyết toán thuế' }
]"></erp-calendar>`
        }
    ]
};
export const TOOLTIP_DOC = {
    id: 'tooltip',
    name: 'Tooltip',
    selector: '[erpTooltip]',
    category: 'Data Display',
    description: 'Directive hiển thị hộp gợi ý nổi khi hover để giải thích thêm nội dung cho bất kỳ phần tử nào.',
    importStatement: `import { TooltipDirective, TooltipComponent, TooltipPlacement } from '@open-erp/shared';`,
    props: [
        { name: 'erpTooltip', type: 'string', default: "''", description: 'Nội dung văn bản gợi ý hiển thị.' },
        { name: 'tooltipPlacement', type: `'top' | 'bottom' | 'left' | 'right'`, default: "'top'", description: 'Hướng hiển thị tooltip.' }
    ],
    examples: [
        {
            title: 'Gợi ý giải thích phím tắt và thao tác',
            description: 'Hover chuột lên nút để xem gợi ý.',
            code: `<erp-button erpTooltip="Tải xuống báo cáo định dạng Excel (.xlsx)" tooltipPlacement="top">Xuất Excel</erp-button>`
        }
    ]
};
//# sourceMappingURL=data-display-components.doc.js.map