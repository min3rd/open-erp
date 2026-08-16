export const BUTTON_DOC = {
    id: 'button',
    name: 'ButtonComponent',
    selector: 'erp-button',
    category: 'General',
    description: 'Nút bấm nghiệp vụ chuẩn ERP hỗ trợ nhiều biến thể (Primary, Secondary, Outline, Danger, Success, Ghost), Spinner đang xử lý và Skeleton Shimmer.',
    importStatement: `import { ButtonComponent, ButtonVariant, ButtonSize } from '@open-erp/shared';`,
    props: [
        { name: 'variant', type: `ButtonVariant | 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost' | 'success'`, default: `ButtonVariant.PRIMARY`, description: 'Kiểu giao diện nút.', options: ['primary', 'secondary', 'outline', 'danger', 'ghost', 'success'] },
        { name: 'size', type: `ButtonSize | 'sm' | 'md' | 'lg'`, default: `ButtonSize.MD`, description: 'Kích thước nút.', options: ['sm', 'md', 'lg'] },
        { name: 'loading', type: 'boolean', default: 'false', description: 'Hiển thị vòng quay loading spinner và khóa tương tác.' },
        { name: 'skeleton', type: 'boolean', default: 'false', description: 'Hiển thị khung Skeleton Shimmer khi trang đang tải.' },
        { name: 'disabled', type: 'boolean', default: 'false', description: 'Vô hiệu hóa nút bấm.' },
        { name: 'iconLeft', type: 'IconName', default: 'undefined', description: 'Tên icon vector bên trái.' },
        { name: 'iconRight', type: 'IconName', default: 'undefined', description: 'Tên icon vector bên phải.' },
        { name: 'fullWidth', type: 'boolean', default: 'false', description: 'Mở rộng 100% chiều rộng container.' }
    ],
    examples: [
        {
            title: 'Các biến thể nút bấm ERP',
            description: 'Các nút hành động với màu sắc và kích thước khác nhau.',
            code: `<erp-button variant="primary" iconLeft="plus">Thêm mới</erp-button>
<erp-button variant="secondary" iconLeft="refresh-cw">Làm mới</erp-button>
<erp-button variant="danger" iconLeft="alert-triangle">Xóa dữ liệu</erp-button>
<erp-button variant="success" iconLeft="check">Phê duyệt</erp-button>`
        },
        {
            title: 'Nút trong trạng thái Loading & Skeleton',
            description: 'Phản hồi khi gọi API hoặc tải màn hình.',
            code: `<erp-button [loading]="true">Đang lưu...</erp-button>
<erp-button [skeleton]="true" size="md"></erp-button>`
        }
    ]
};
//# sourceMappingURL=button.doc.js.map