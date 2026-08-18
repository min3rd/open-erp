import { ComponentDoc } from '../models/component-doc.model';

export const NAVBAR_DOC: ComponentDoc = {
  id: 'navbar',
  name: 'Navbar / Header / App Bar',
  selector: 'erp-navbar',
  category: 'Navigation & Utility',
  description: 'Thanh điều hướng chính đặt ở đầu trang với các khu vực thương hiệu, liên kết điều hướng, ô tìm kiếm và các nút hành động, hỗ trợ sticky/fixed, hiệu ứng kính mờ và menu responsive trên mobile.',
  importStatement: `import { NavbarComponent, NavbarItem, NavbarPosition } from '@open-erp/shared';`,
  props: [
    { name: 'brandTitle', type: 'string', default: "''", description: 'Tên thương hiệu hoặc ứng dụng ERP.' },
    { name: 'brandSubtitle', type: 'string', default: 'undefined', description: 'Tiêu đề phụ dưới tên thương hiệu.' },
    { name: 'brandLogo', type: 'string', default: 'undefined', description: 'Đường dẫn hình ảnh logo.' },
    { name: 'position', type: `NavbarPosition | 'static' | 'sticky' | 'fixed'`, default: 'NavbarPosition.STICKY', description: 'Vị trí ghim thanh điều hướng.' },
    { name: 'bordered', type: 'boolean', default: 'true', description: 'Đường viền dưới ngăn cách nội dung.' },
    { name: 'glass', type: 'boolean', default: 'true', description: 'Hiệu ứng kính mờ trong suốt (Backdrop blur).' },
    { name: 'items', type: 'NavbarItem[]', default: '[]', description: 'Mảng danh sách các mục điều hướng ở giữa.' },
    { name: 'showMobileToggle', type: 'boolean', default: 'true', description: 'Hiển thị nút hamburger trên màn hình nhỏ.' }
  ],
  examples: [
    {
      title: 'Navbar hoàn chỉnh với Menu và Actions',
      description: 'Sử dụng cấu trúc header tiêu chuẩn cho hệ thống quản trị ERP.',
      code: `<erp-navbar brandTitle="Open ERP"
            brandSubtitle="Enterprise Suite"
            [items]="[
              { label: 'Tổng quan', url: '/dashboard', active: true, icon: 'grid' },
              { label: 'Đơn hàng', url: '/orders', icon: 'shopping-cart', badge: '12' },
              { label: 'Khách hàng', url: '/customers', icon: 'users' },
              { label: 'Báo cáo', url: '/reports', icon: 'bar-chart-2' }
            ]">
  <div navbar-actions class="flex items-center gap-2">
    <erp-theme-toggle></erp-theme-toggle>
    <erp-avatar text="Minh Nguyen" size="sm"></erp-avatar>
  </div>
</erp-navbar>`
    }
  ]
};

export const SIDEBAR_DOC: ComponentDoc = {
  id: 'sidebar',
  name: 'Sidebar / Navigation Drawer',
  selector: 'erp-sidebar',
  category: 'Navigation & Utility',
  description: 'Thanh điều hướng dạng cột dọc hỗ trợ 3 chế độ (cố định, mini rút gọn và ngăn kéo trượt mở overlay trên mobile), phân nhóm section, menu đa cấp và huy hiệu số lượng.',
  importStatement: `import { SidebarComponent, SidebarItem, SidebarMode } from '@open-erp/shared';`,
  props: [
    { name: 'mode', type: `SidebarMode | 'fixed' | 'mini' | 'overlay'`, default: 'SidebarMode.FIXED', description: 'Chế độ hiển thị thanh bên.' },
    { name: 'collapsed', type: 'boolean', default: 'false', description: 'Trạng thái thu gọn mini (chỉ hiển thị icon).' },
    { name: 'openOverlay', type: 'boolean', default: 'false', description: 'Mở ngăn kéo Drawer trên Mobile.' },
    { name: 'items', type: 'SidebarItem[]', default: '[]', description: 'Danh sách các mục menu và nhóm chức năng.' },
    { name: 'showCollapseToggle', type: 'boolean', default: 'true', description: 'Hiển thị nút bấm gập/mở thanh bên ở cuối trang.' }
  ],
  examples: [
    {
      title: 'Sidebar phân nhóm và Submenu đa cấp',
      description: 'Cấu trúc menu quản trị doanh nghiệp đa phân hệ.',
      code: `<erp-sidebar [items]="[
  { sectionHeader: 'Quản trị' },
  { id: 'dash', label: 'Bảng điều khiển', icon: 'activity', active: true },
  { 
    id: 'sales', 
    label: 'Kinh doanh & Bán hàng', 
    icon: 'shopping-bag', 
    expanded: true,
    children: [
      { id: 'orders', label: 'Đơn bán hàng', badge: '5' },
      { id: 'invoices', label: 'Hóa đơn VAT' }
    ]
  },
  { sectionHeader: 'Hệ thống' },
  { id: 'settings', label: 'Cấu hình hệ thống', icon: 'settings' }
]"></erp-sidebar>`
    }
  ]
};

export const BREADCRUMB_DOC: ComponentDoc = {
  id: 'breadcrumb',
  name: 'Breadcrumb',
  selector: 'erp-breadcrumb',
  category: 'Navigation & Utility',
  description: 'Thanh chỉ mục phân cấp vị trí hiện tại của trang, hỗ trợ icon, dấu phân cách tùy biến (chevron, slash, arrow, dot), tự động rút gọn đường dẫn dài và hiệu ứng skeleton.',
  importStatement: `import { BreadcrumbComponent, BreadcrumbItem, BreadcrumbSeparator } from '@open-erp/shared';`,
  props: [
    { name: 'items', type: '(string | BreadcrumbItem)[]', default: '[]', description: 'Danh sách các cấp thư mục hoặc phân cấp trang.' },
    { name: 'separator', type: `BreadcrumbSeparator | 'slash' | 'chevron' | 'arrow' | 'dot' | string`, default: 'BreadcrumbSeparator.CHEVRON', description: 'Ký tự phân cách giữa các cấp.' },
    { name: 'maxItems', type: 'number', default: 'undefined', description: 'Số lượng mục tối đa hiển thị trước khi rút gọn thành (...).' },
    { name: 'showHomeIcon', type: 'boolean', default: 'false', description: 'Hiển thị icon trang chủ ở đầu thanh breadcrumb.' },
    { name: 'loading', type: 'boolean', default: 'false', description: 'Hiển thị hiệu ứng tải Skeleton.' }
  ],
  examples: [
    {
      title: 'Breadcrumb với Chevron & Rút gọn',
      description: 'Chỉ mục vị trí chi tiết đơn hàng trong phân hệ bán hàng.',
      code: `<erp-breadcrumb [showHomeIcon]="true"
                [items]="[
                  { label: 'Bán hàng', icon: 'shopping-bag', url: '/sales' },
                  { label: 'Danh sách Đơn hàng', url: '/sales/orders' },
                  { label: 'Đơn hàng #DH-2026-889', active: true }
                ]">
</erp-breadcrumb>`
    }
  ]
};

export const PAGINATION_DOC: ComponentDoc = {
  id: 'pagination',
  name: 'Pagination',
  selector: 'erp-pagination',
  category: 'Navigation & Utility',
  description: 'Thanh phân trang chuẩn dữ liệu lớn với thuật toán dải trang tự động rút gọn dấu ba chấm, chọn kích thước trang, thống kê tổng số bản ghi và nhảy trang nhanh.',
  importStatement: `import { PaginationComponent, PaginationVariant } from '@open-erp/shared';`,
  props: [
    { name: 'currentPage', type: 'number', default: '1', description: 'Trang hiện tại (1-indexed).' },
    { name: 'totalItems', type: 'number', default: '0', description: 'Tổng số bản ghi trong danh sách dữ liệu.' },
    { name: 'pageSize', type: 'number', default: '10', description: 'Số bản ghi hiển thị trên một trang.' },
    { name: 'pageSizeOptions', type: 'number[]', default: '[10, 20, 50, 100]', description: 'Các tùy chọn số lượng bản ghi trên một trang.' },
    { name: 'variant', type: `PaginationVariant | 'full' | 'simple' | 'compact'`, default: 'PaginationVariant.FULL', description: 'Biến thể hiển thị giao diện phân trang.' },
    { name: 'showPageSizeSelector', type: 'boolean', default: 'true', description: 'Hiển thị dropdown chọn số dòng / trang.' },
    { name: 'showTotalInfo', type: 'boolean', default: 'true', description: 'Hiển thị thông tin thống kê số lượng bản ghi.' },
    { name: 'showJumpToPage', type: 'boolean', default: 'false', description: 'Hiển thị ô nhập số trang để chuyển nhanh.' }
  ],
  examples: [
    {
      title: 'Phân trang danh sách dữ liệu ERP',
      description: 'Thanh điều hướng phân trang đầy đủ tính năng.',
      code: `<erp-pagination [currentPage]="1"
                [totalItems]="250"
                [pageSize]="10"
                [pageSizeOptions]="[10, 20, 50, 100]"
                [showJumpToPage]="true"
                (pageChange)="onPageChange($event)">
</erp-pagination>`
    }
  ]
};

export const TABS_DOC: ComponentDoc = {
  id: 'tabs',
  name: 'Tabs',
  selector: 'erp-tabs',
  category: 'Navigation & Utility',
  description: 'Điều hướng theo thẻ tab để chuyển đổi nội dung cùng cấp trên một màn hình, hỗ trợ 4 kiểu giao diện (Line, Pills, Enclosed, Segmented), icon, badge đếm và hướng ngang/dọc.',
  importStatement: `import { TabsComponent, TabItem, TabsVariant, TabsOrientation } from '@open-erp/shared';`,
  props: [
    { name: 'items', type: '(string | TabItem)[]', default: '[]', description: 'Danh sách các tab điều hướng.' },
    { name: 'activeTabId', type: 'string', default: 'undefined', description: 'ID tab đang được chọn kích hoạt.' },
    { name: 'variant', type: `TabsVariant | 'line' | 'pills' | 'enclosed' | 'segmented'`, default: 'TabsVariant.LINE', description: 'Kiểu hiển thị của tab.' },
    { name: 'orientation', type: `TabsOrientation | 'horizontal' | 'vertical'`, default: 'TabsOrientation.HORIZONTAL', description: 'Hướng bố trí danh sách tab.' },
    { name: 'size', type: `'sm' | 'md' | 'lg'`, default: "'md'", description: 'Kích thước hiển thị của tab.' },
    { name: 'fullWidth', type: 'boolean', default: 'false', description: 'Mở rộng đều các tab 100% chiều ngang.' }
  ],
  examples: [
    {
      title: 'Tabs biến thể Line & Pills',
      description: 'Chuyển đổi các danh mục báo cáo thống kê.',
      code: `<erp-tabs [items]="[
  { id: 'overview', label: 'Tổng quan', icon: 'grid' },
  { id: 'finance', label: 'Tài chính', icon: 'dollar-sign', badge: '3' },
  { id: 'activity', label: 'Nhật ký hoạt động', icon: 'clock' }
]" [(activeTabId)]="activeTab">
</erp-tabs>`
    }
  ]
};

export const DROPDOWN_MENU_DOC: ComponentDoc = {
  id: 'dropdown-menu',
  name: 'Menu / Dropdown Menu',
  selector: 'erp-dropdown-menu',
  category: 'Navigation & Utility',
  description: 'Danh sách lựa chọn menu thả xuống linh hoạt theo nhiều vị trí (bottom-start, bottom-end, top-start, top-end, left, right), hỗ trợ phím tắt KBD, icon, badge, phân nhóm và tự động đóng.',
  importStatement: `import { DropdownMenuComponent, DropdownMenuItem, DropdownPlacement } from '@open-erp/shared';`,
  props: [
    { name: 'items', type: 'DropdownMenuItem[]', default: '[]', description: 'Danh sách các hành động hoặc mục menu.' },
    { name: 'placement', type: `DropdownPlacement | 'bottom-start' | 'bottom-end' | 'top-start' | 'top-end' | 'left' | 'right'`, default: 'DropdownPlacement.BOTTOM_START', description: 'Vị trí hiển thị của menu popup.' },
    { name: 'trigger', type: `'click' | 'hover'`, default: "'click'", description: 'Sự kiện kích hoạt mở menu.' },
    { name: 'isOpen', type: 'boolean', default: 'false', description: 'Trạng thái mở menu.' },
    { name: 'closeOnClickOutside', type: 'boolean', default: 'true', description: 'Tự động đóng menu khi nhấp chuột ra ngoài.' }
  ],
  examples: [
    {
      title: 'Menu hành động với phím tắt KBD',
      description: 'Thao tác nhanh cho hàng dữ liệu hoặc tài khoản cá nhân.',
      code: `<erp-dropdown-menu [items]="[
  { header: 'Tùy chọn thao tác' },
  { id: 'edit', label: 'Chỉnh sửa thông tin', icon: 'edit-2', shortcut: 'Ctrl+E' },
  { id: 'duplicate', label: 'Nhân bản dữ liệu', icon: 'copy', shortcut: 'Ctrl+D' },
  { divider: true },
  { id: 'delete', label: 'Xóa vĩnh viễn', icon: 'trash-2', danger: true, shortcut: 'Del' }
]">
  <erp-button variant="secondary" iconRight="chevron-down">Thao tác</erp-button>
</erp-dropdown-menu>`
    }
  ]
};

export const BOTTOM_NAV_DOC: ComponentDoc = {
  id: 'bottom-nav',
  name: 'Bottom Navigation',
  selector: 'erp-bottom-nav',
  category: 'Navigation & Utility',
  description: 'Thanh điều hướng cố định ở đáy màn hình tối ưu cho Mobile & PWA Tablet Web App, hiển thị icon, nhãn, huy hiệu đếm và hỗ trợ safe area padding.',
  importStatement: `import { BottomNavComponent, BottomNavItem } from '@open-erp/shared';`,
  props: [
    { name: 'items', type: 'BottomNavItem[]', default: '[]', description: 'Danh sách các nút điều hướng đáy màn hình.' },
    { name: 'activeId', type: 'string', default: 'undefined', description: 'ID nút đang được chọn kích hoạt.' },
    { name: 'fixed', type: 'boolean', default: 'true', description: 'Cố định thanh điều hướng ở cạnh dưới màn hình.' },
    { name: 'floating', type: 'boolean', default: 'false', description: 'Kiểu thanh nổi dạng viên thuốc (floating pill).' },
    { name: 'showLabels', type: 'boolean', default: 'true', description: 'Hiển thị chữ nhãn dưới icon.' }
  ],
  examples: [
    {
      title: 'Bottom Navigation cho Mobile ERP',
      description: 'Giao diện ứng dụng di động với thông báo số lượng đơn cần xử lý.',
      code: `<erp-bottom-nav [items]="[
  { id: 'home', label: 'Trang chủ', icon: 'home' },
  { id: 'orders', label: 'Đơn hàng', icon: 'shopping-bag', badge: '4' },
  { id: 'inventory', label: 'Kho hàng', icon: 'box' },
  { id: 'profile', label: 'Tài khoản', icon: 'user' }
]" [(activeId)]="activeMobileTab">
</erp-bottom-nav>`
    }
  ]
};

export const ANCHOR_DOC: ComponentDoc = {
  id: 'anchor',
  name: 'Anchor / Scrollspy',
  selector: 'erp-anchor',
  category: 'Navigation & Utility',
  description: 'Danh mục điều hướng liên kết nhanh đến các vị trí/tiêu đề trên cùng một trang dài, tự động theo dõi cuộn trang (Scrollspy) để đánh dấu vị trí đang đọc và cuộn mượt mà.',
  importStatement: `import { AnchorComponent, AnchorItem } from '@open-erp/shared';`,
  props: [
    { name: 'items', type: 'AnchorItem[]', default: '[]', description: 'Cây mục lục và ID các phần tử đích trên trang.' },
    { name: 'activeTargetId', type: 'string', default: "''", description: 'ID phần tử đích đang active.' },
    { name: 'offsetTop', type: 'number', default: '100', description: 'Khoảng cách bù trừ (px) từ đỉnh màn hình khi cuộn.' },
    { name: 'title', type: 'string', default: "'Nội dung trang'", description: 'Tiêu đề thanh mục lục điều hướng.' }
  ],
  examples: [
    {
      title: 'Thanh mục lục tài liệu hướng dẫn',
      description: 'Điều hướng nhanh các mục trong trang hồ sơ hợp đồng.',
      code: `<erp-anchor [items]="[
  { targetId: 'section-general', title: '1. Thông tin chung' },
  { 
    targetId: 'section-finance', 
    title: '2. Điều khoản tài chính',
    children: [
      { targetId: 'section-payment', title: '2.1 Tiến độ thanh toán' },
      { targetId: 'section-tax', title: '2.2 Thuế & Phí' }
    ]
  },
  { targetId: 'section-sign', title: '3. Chữ ký các bên' }
]">
</erp-anchor>`
    }
  ]
};

export const BACK_TO_TOP_DOC: ComponentDoc = {
  id: 'back-to-top',
  name: 'Back to Top',
  selector: 'erp-back-to-top',
  category: 'Navigation & Utility',
  description: 'Nút bấm nổi chuyển nhanh về đầu trang, tự động kích hoạt khi cuộn vượt quá ngưỡng threshold và hiển thị vòng tròn tiến độ cuộn trang thời gian thực.',
  importStatement: `import { BackToTopComponent, BackToTopShape } from '@open-erp/shared';`,
  props: [
    { name: 'threshold', type: 'number', default: '300', description: 'Khoảng cách cuộn tối thiểu (px) để nút hiển thị.' },
    { name: 'shape', type: `BackToTopShape | 'circle' | 'rounded' | 'pill'`, default: 'BackToTopShape.CIRCLE', description: 'Hình dáng nút bấm nổi.' },
    { name: 'showProgress', type: 'boolean', default: 'true', description: 'Hiển thị vòng tròn phần trăm tiến độ cuộn trang.' },
    { name: 'tooltip', type: 'string', default: "'Lên đầu trang'", description: 'Văn bản gợi ý khi di chuột vào nút.' },
    { name: 'text', type: 'string', default: 'undefined', description: 'Văn bản hiển thị kèm theo khi dùng shape pill.' }
  ],
  examples: [
    {
      title: 'Nút cuộn lên đầu trang với Progress Ring',
      description: 'Hỗ trợ người dùng quay lại đầu trang trên các danh sách báo cáo dài.',
      code: `<erp-back-to-top [threshold]="200"
                  shape="circle"
                  [showProgress]="true">
</erp-back-to-top>`
    }
  ]
};

export const SPEED_DIAL_DOC: ComponentDoc = {
  id: 'speed-dial',
  name: 'Speed Dial / FAB Menu',
  selector: 'erp-speed-dial',
  category: 'Navigation & Utility',
  description: 'Nút bấm nổi (Floating Action Button) mở ra danh sách các hành động hoặc điều hướng nhanh theo 4 hướng (lên, xuống, trái, phải), kèm nhãn tooltip và hiệu ứng làm mờ nền.',
  importStatement: `import { SpeedDialComponent, SpeedDialAction, SpeedDialDirection, SpeedDialPosition } from '@open-erp/shared';`,
  props: [
    { name: 'items', type: 'SpeedDialAction[]', default: '[]', description: 'Danh sách các hành động bung ra từ nút chính.' },
    { name: 'icon', type: 'IconName', default: "'plus'", description: 'Icon của nút FAB chính.' },
    { name: 'direction', type: `SpeedDialDirection | 'up' | 'down' | 'left' | 'right'`, default: 'SpeedDialDirection.UP', description: 'Hướng bung các nút hành động con.' },
    { name: 'position', type: `SpeedDialPosition | 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left'`, default: 'SpeedDialPosition.BOTTOM_RIGHT', description: 'Vị trí ghim nút trên màn hình.' },
    { name: 'showBackdrop', type: 'boolean', default: 'false', description: 'Làm tối và mờ nền khi menu được mở.' },
    { name: 'showLabels', type: 'boolean', default: 'true', description: 'Hiển thị nhãn tooltip cạnh các nút hành động con.' }
  ],
  examples: [
    {
      title: 'FAB Menu thêm mới nhanh chứng từ',
      description: 'Tạo nhanh đơn hàng, khách hàng hoặc phiếu thu từ góc màn hình.',
      code: `<erp-speed-dial [items]="[
  { id: 'order', label: 'Tạo đơn hàng mới', icon: 'shopping-cart' },
  { id: 'customer', label: 'Thêm khách hàng', icon: 'user-plus' },
  { id: 'invoice', label: 'Xuất hóa đơn', icon: 'file-text' }
]" (actionClick)="onSpeedDialAction($event)">
</erp-speed-dial>`
    }
  ]
};

export const SEGMENTED_CONTROL_DOC: ComponentDoc = {
  id: 'segmented-control',
  name: 'Segmented Control',
  selector: 'erp-segmented-control',
  category: 'Navigation & Utility',
  description: 'Bộ nút chuyển đổi trạng thái hoặc chế độ xem (View switcher) dạng trượt cao cấp, hỗ trợ icon, badge đếm, các kích thước sm/md/lg và tương thích Reactive Forms.',
  importStatement: `import { SegmentedControlComponent, SegmentedControlOption } from '@open-erp/shared';`,
  props: [
    { name: 'options', type: '(string | SegmentedControlOption)[]', default: '[]', description: 'Danh sách các lựa chọn trong bộ chuyển đổi.' },
    { name: 'value', type: 'any', default: 'undefined', description: 'Giá trị đang được chọn (hỗ trợ [(ngModel)]).' },
    { name: 'size', type: `'sm' | 'md' | 'lg'`, default: "'md'", description: 'Kích thước hiển thị của các nút phân đoạn.' },
    { name: 'fullWidth', type: 'boolean', default: 'false', description: 'Mở rộng đều 100% chiều ngang.' },
    { name: 'disabled', type: 'boolean', default: 'false', description: 'Khóa không cho phép tương tác.' }
  ],
  examples: [
    {
      title: 'Chuyển đổi chế độ hiển thị danh sách / lưới / biểu đồ',
      description: 'Chuyển đổi nhanh giữa các góc nhìn dữ liệu.',
      code: `<erp-segmented-control [options]="[
  { label: 'Danh sách', value: 'list', icon: 'list' },
  { label: 'Lưới Card', value: 'grid', icon: 'grid' },
  { label: 'Biểu đồ', value: 'chart', icon: 'pie-chart' }
]" [(value)]="currentView">
</erp-segmented-control>`
    }
  ]
};
