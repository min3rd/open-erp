import { ComponentDoc } from '../models/component-doc.model';

export const ICON_BUTTON_DOC: ComponentDoc = {
  id: 'icon-button',
  name: 'IconButtonComponent',
  selector: 'erp-icon-button',
  category: 'General',
  description: 'Nút bấm chuyên dụng cho biểu tượng (Icon Button) với tooltip, huy hiệu thông báo (Badge), trạng thái tải (Loading) và nhiều hình dáng (Circle, Rounded, Square).',
  importStatement: `import { IconButtonComponent, ButtonVariant, ButtonSize } from '@open-erp/shared';`,
  props: [
    { name: 'icon', type: 'IconName', default: `'plus'`, description: 'Tên icon Feather vector hiển thị ở trung tâm.', required: true },
    { name: 'variant', type: `ButtonVariant | 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost' | 'success'`, default: `'ghost'`, description: 'Phong cách nút.', options: ['primary', 'secondary', 'outline', 'danger', 'ghost', 'success'] },
    { name: 'size', type: `ButtonSize | 'sm' | 'md' | 'lg'`, default: `'md'`, description: 'Kích thước nút biểu tượng.', options: ['sm', 'md', 'lg'] },
    { name: 'shape', type: `'circle' | 'rounded' | 'square'`, default: `'rounded'`, description: 'Hình dáng viền nút.', options: ['circle', 'rounded', 'square'] },
    { name: 'tooltip', type: 'string', default: 'undefined', description: 'Gợi ý hiển thị khi rê chuột vào nút.' },
    { name: 'badge', type: 'number | string', default: 'undefined', description: 'Số lượng hoặc chấm thông báo đính kèm góc trên nút.' },
    { name: 'disabled', type: 'boolean', default: 'false', description: 'Vô hiệu hóa nút.' },
    { name: 'loading', type: 'boolean', default: 'false', description: 'Hiển thị vòng quay loading thay thế icon.' },
    { name: 'skeleton', type: 'boolean', default: 'false', description: 'Chế độ Skeleton Loading.' },
    { name: 'btnClick', type: 'EventEmitter<MouseEvent>', default: 'event', description: 'Sự kiện phát ra khi click vào nút.' }
  ],
  examples: [
    {
      title: 'Nút chuông thông báo có Badge đếm số',
      description: 'Dùng cho thanh Header Top Navigation.',
      code: `<erp-icon-button icon="bell" variant="ghost" shape="circle" [badge]="5" tooltip="Thông báo hệ thống" (btnClick)="openNotifications()"></erp-icon-button>`
    },
    {
      title: 'Nút thêm mới hình tròn nổi bật',
      description: 'Nút Primary dạng tròn bo góc mềm mại.',
      code: `<erp-icon-button icon="plus" variant="primary" shape="circle" size="lg" tooltip="Tạo đơn hàng mới"></erp-icon-button>`
    }
  ]
};

export const TYPOGRAPHY_DOC: ComponentDoc = {
  id: 'typography',
  name: 'TypographyComponent',
  selector: 'erp-typography, erp-heading, erp-text',
  category: 'General',
  description: 'Hệ thống hiển thị văn bản, tiêu đề (H1-H6), đoạn văn, chữ dẫn (Lead), ghi chú mờ (Muted) và mã nguồn (Code) chuẩn hóa.',
  importStatement: `import { TypographyComponent, TypographyVariant } from '@open-erp/shared';`,
  props: [
    { name: 'variant', type: `TypographyVariant | 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'lead' | 'body' | 'small' | 'muted' | 'code'`, default: `'body'`, description: 'Cấp độ typography.', options: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'lead', 'body', 'small', 'muted', 'code'] },
    { name: 'weight', type: `'light' | 'normal' | 'medium' | 'semibold' | 'bold' | 'black'`, default: 'undefined', description: 'Độ đậm chữ.' },
    { name: 'align', type: `'left' | 'center' | 'right' | 'justify'`, default: 'undefined', description: 'Căn lề văn bản.' },
    { name: 'gradient', type: 'boolean', default: 'false', description: 'Áp dụng màu chữ chuyển sắc Gradient hiện đại.' },
    { name: 'truncate', type: 'boolean', default: 'false', description: 'Tự động rút gọn dấu ... khi tràn hàng.' },
    { name: 'loading', type: 'boolean', default: 'false', description: 'Hiển thị Skeleton Shimmer.' }
  ],
  examples: [
    {
      title: 'Tiêu đề Gradient H1 & Đoạn văn Lead',
      description: 'Dành cho trang đích (Landing Page) và tiêu đề Dashboard.',
      code: `<erp-typography variant="h1" [gradient]="true">Hệ Thống Quản Trị Doanh Nghiệp Open ERP</erp-typography>\n<erp-typography variant="lead">Nền tảng ERP thế hệ mới tối ưu vận hành đa chi nhánh</erp-typography>`
    }
  ]
};

export const LINK_DOC: ComponentDoc = {
  id: 'link',
  name: 'LinkComponent',
  selector: 'erp-link',
  category: 'General',
  description: 'Liên kết điều hướng hỗ trợ Angular routerLink nội bộ hoặc liên kết ngoài (external link) có icon mở tab mới.',
  importStatement: `import { LinkComponent } from '@open-erp/shared';`,
  props: [
    { name: 'href', type: 'string', default: 'undefined', description: 'Đường dẫn liên kết URL ngoài.' },
    { name: 'routerLink', type: 'string | any[]', default: 'undefined', description: 'Đường dẫn định tuyến nội bộ Angular Router.' },
    { name: 'external', type: 'boolean', default: 'false', description: 'Mở trong tab mới (target="_blank", rel="noopener noreferrer") kèm icon external-link.' },
    { name: 'underline', type: `'always' | 'hover' | 'none'`, default: `'hover'`, description: 'Kiểu gạch chân liên kết.', options: ['always', 'hover', 'none'] },
    { name: 'color', type: `'primary' | 'muted' | 'danger' | 'slate'`, default: `'primary'`, description: 'Màu sắc liên kết.', options: ['primary', 'muted', 'danger', 'slate'] },
    { name: 'iconLeft', type: 'IconName', default: 'undefined', description: 'Icon phía trước liên kết.' },
    { name: 'iconRight', type: 'IconName', default: 'undefined', description: 'Icon phía sau liên kết.' },
    { name: 'disabled', type: 'boolean', default: 'false', description: 'Vô hiệu hóa click liên kết.' },
    { name: 'loading', type: 'boolean', default: 'false', description: 'Chế độ Skeleton Loading.' }
  ],
  examples: [
    {
      title: 'Liên kết xem tài liệu ra trang ngoài',
      description: 'Tự động gắn icon mở tab mới.',
      code: `<erp-link href="https://docs.open-erp.vn" [external]="true" underline="hover">Xem tài liệu hướng dẫn API</erp-link>`
    }
  ]
};

export const DIVIDER_DOC: ComponentDoc = {
  id: 'divider',
  name: 'DividerComponent',
  selector: 'erp-divider',
  category: 'General',
  description: 'Đường kẻ phân tách nội dung (Separator) hỗ trợ chiều ngang/dọc, đường nét đứt (dashed) và nhãn văn bản ở giữa.',
  importStatement: `import { DividerComponent, DividerOrientation } from '@open-erp/shared';`,
  props: [
    { name: 'orientation', type: `DividerOrientation | 'horizontal' | 'vertical'`, default: `'horizontal'`, description: 'Chiều đường phân cách.', options: ['horizontal', 'vertical'] },
    { name: 'dashed', type: 'boolean', default: 'false', description: 'Hiển thị đường nét đứt thay vì nét liền.' },
    { name: 'label', type: 'string', default: 'undefined', description: 'Nhãn văn bản đặt chính giữa đường kẻ.' },
    { name: 'align', type: `'left' | 'center' | 'right'`, default: `'center'`, description: 'Vị trí của nhãn văn bản.', options: ['left', 'center', 'right'] },
    { name: 'loading', type: 'boolean', default: 'false', description: 'Chế độ Skeleton Loading.' }
  ],
  examples: [
    {
      title: 'Đường phân cách có nhãn văn bản',
      description: 'Dùng để chia khối thông tin trong form đăng nhập/đăng ký.',
      code: `<erp-divider label="HOẶC ĐĂNG NHẬP BẰNG"></erp-divider>`
    }
  ]
};

export const BADGE_DOC: ComponentDoc = {
  id: 'badge',
  name: 'BadgeComponent',
  selector: 'erp-badge',
  category: 'Data Display',
  description: 'Huy hiệu / Nhãn đếm thông báo đa năng với 4 phong cách (Solid, Subtle, Outline, Dot) và nhiều màu sắc ngữ nghĩa.',
  importStatement: `import { BadgeComponent, BadgeVariant, BadgeColor } from '@open-erp/shared';`,
  props: [
    { name: 'value', type: 'string | number', default: 'undefined', description: 'Nội dung chữ hoặc số hiển thị trên huy hiệu.' },
    { name: 'variant', type: `BadgeVariant | 'solid' | 'subtle' | 'outline' | 'dot'`, default: `'subtle'`, description: 'Kiểu hiển thị huy hiệu.', options: ['solid', 'subtle', 'outline', 'dot'] },
    { name: 'color', type: `BadgeColor | 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'neutral'`, default: `'primary'`, description: 'Bộ màu sắc ngữ nghĩa.', options: ['primary', 'success', 'warning', 'danger', 'info', 'neutral'] },
    { name: 'pill', type: 'boolean', default: 'true', description: 'Bo tròn dạng viên thuốc (Pill shape).' },
    { name: 'loading', type: 'boolean', default: 'false', description: 'Chế độ Skeleton Loading.' }
  ],
  examples: [
    {
      title: 'Huy hiệu chấm trạng thái (Dot Badge)',
      description: 'Hiển thị trạng thái gọn gàng trong bảng dữ liệu.',
      code: `<erp-badge variant="dot" color="success">Đang trực tuyến</erp-badge>`
    },
    {
      title: 'Huy hiệu đếm số lượng thông báo',
      description: 'Huy hiệu Solid màu đỏ nổi bật.',
      code: `<erp-badge variant="solid" color="danger" [value]="12"></erp-badge>`
    }
  ]
};

export const TAG_DOC: ComponentDoc = {
  id: 'tag',
  name: 'TagComponent',
  selector: 'erp-tag, erp-chip',
  category: 'Data Display',
  description: 'Thẻ nhãn cơ bản (Tag / Chip) đại diện cho danh mục, phân loại hoặc trạng thái có nút xóa (removable) và icon.',
  importStatement: `import { TagComponent, TagColor, TagVariant } from '@open-erp/shared';`,
  props: [
    { name: 'label', type: 'string', default: `''`, description: 'Văn bản nhãn thẻ.', required: true },
    { name: 'icon', type: 'IconName', default: 'undefined', description: 'Icon Feather vector phía trước nhãn.' },
    { name: 'color', type: `TagColor | 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'purple' | 'pink'`, default: `'primary'`, description: 'Màu sắc thẻ.', options: ['primary', 'secondary', 'success', 'warning', 'danger', 'info', 'neutral', 'purple', 'pink'] },
    { name: 'variant', type: `TagVariant | 'solid' | 'subtle' | 'outline'`, default: `'subtle'`, description: 'Biến thể hiển thị.', options: ['solid', 'subtle', 'outline'] },
    { name: 'size', type: `'sm' | 'md' | 'lg'`, default: `'md'`, description: 'Kích cỡ thẻ.', options: ['sm', 'md', 'lg'] },
    { name: 'removable', type: 'boolean', default: 'false', description: 'Hiển thị nút X để xóa thẻ.' },
    { name: 'clickable', type: 'boolean', default: 'false', description: 'Kích hoạt hiệu ứng hover & click.' },
    { name: 'disabled', type: 'boolean', default: 'false', description: 'Làm mờ và khóa thẻ.' },
    { name: 'loading', type: 'boolean', default: 'false', description: 'Chế độ Skeleton Loading.' },
    { name: 'remove', type: 'EventEmitter<MouseEvent>', default: 'event', description: 'Sự kiện phát ra khi click nút xóa thẻ.' },
    { name: 'tagClick', type: 'EventEmitter<MouseEvent>', default: 'event', description: 'Sự kiện phát ra khi click vào thân thẻ.' }
  ],
  examples: [
    {
      title: 'Thẻ phân loại có icon và nút xóa',
      description: 'Dành cho gắn tag đơn hàng, khách hàng VIP.',
      code: `<erp-tag label="Khách hàng VIP" icon="shield" color="purple" [removable]="true" (remove)="onRemoveTag()"></erp-tag>`
    }
  ]
};

export const SPINNER_DOC: ComponentDoc = {
  id: 'spinner',
  name: 'SpinnerComponent',
  selector: 'erp-spinner, erp-loader',
  category: 'Feedback & Loading',
  description: 'Vòng xoay và hiệu ứng chờ tải (Loader) với 3 biến thể (Spin, Dots nhảy, Pulse nhấp nháy) và nhiều kích thước.',
  importStatement: `import { SpinnerComponent, SpinnerSize, SpinnerVariant } from '@open-erp/shared';`,
  props: [
    { name: 'size', type: `SpinnerSize | 'xs' | 'sm' | 'md' | 'lg' | 'xl'`, default: `'md'`, description: 'Kích thước vòng xoay.', options: ['xs', 'sm', 'md', 'lg', 'xl'] },
    { name: 'variant', type: `SpinnerVariant | 'spin' | 'dots' | 'pulse'`, default: `'spin'`, description: 'Biến thể chuyển động.', options: ['spin', 'dots', 'pulse'] },
    { name: 'color', type: 'string', default: `'text-indigo-600 dark:text-indigo-400'`, description: 'Mã lớp màu Tailwind cho spinner.' },
    { name: 'label', type: 'string', default: 'undefined', description: 'Dòng chữ giải thích bên cạnh (VD: Đang xử lý...).' }
  ],
  examples: [
    {
      title: 'Vòng xoay tải dữ liệu kèm nhãn',
      description: 'Hiển thị khi gọi API hoặc tải trang.',
      code: `<erp-spinner size="lg" label="Đang đồng bộ dữ liệu ERP..." variant="spin"></erp-spinner>`
    },
    {
      title: 'Hiệu ứng 3 chấm nhảy (Dots loader)',
      description: 'Phổ biến trong tin nhắn hoặc trạng thái typing.',
      code: `<erp-spinner variant="dots" size="md"></erp-spinner>`
    }
  ]
};

export const KBD_DOC: ComponentDoc = {
  id: 'kbd',
  name: 'KbdComponent',
  selector: 'erp-kbd',
  category: 'General',
  description: 'Hiển thị phím tắt bàn phím (Keyboard Keycap) giao diện 3D nổi bật hỗ trợ tổ hợp phím (Ctrl+S, ⌘K, Esc).',
  importStatement: `import { KbdComponent } from '@open-erp/shared';`,
  props: [
    { name: 'key', type: 'string', default: 'undefined', description: 'Ký tự phím đơn lẻ (VD: Esc, Enter).' },
    { name: 'keys', type: 'string[]', default: 'undefined', description: 'Mảng tổ hợp các phím (VD: ["Ctrl", "K"] hoặc ["⌘", "Shift", "P"]).' },
    { name: 'size', type: `'sm' | 'md' | 'lg'`, default: `'md'`, description: 'Kích thước phím bấm.', options: ['sm', 'md', 'lg'] }
  ],
  examples: [
    {
      title: 'Hiển thị tổ hợp phím tìm kiếm nhanh',
      description: 'Dùng trong thanh tìm kiếm Command Palette.',
      code: `<erp-kbd [keys]="['Ctrl', 'K']"></erp-kbd>`
    },
    {
      title: 'Phím thoát đơn lẻ',
      description: 'Phím Esc đóng modal popup.',
      code: `<erp-kbd key="Esc"></erp-kbd>`
    }
  ]
};
