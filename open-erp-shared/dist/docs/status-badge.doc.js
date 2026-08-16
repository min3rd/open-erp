export const STATUS_BADGE_DOC = {
    id: 'status-badge',
    name: 'StatusBadgeComponent',
    selector: 'erp-status-badge',
    category: 'Data Display',
    description: 'Huy hiệu trạng thái ERP chuẩn hóa màu sắc theo quy chuẩn thiết kế, có chấm pulse phát sáng và hỗ trợ Skeleton Shimmer.',
    importStatement: `import { StatusBadgeComponent, BadgeStatus } from '@open-erp/shared';`,
    props: [
        { name: 'status', type: `BadgeStatus | string`, default: `BadgeStatus.PENDING`, description: 'Mã trạng thái nghiệp vụ.', options: ['COMPLETED', 'PROCESSING', 'PENDING', 'ACTIVE', 'INACTIVE', 'DANGER', 'INFO'] },
        { name: 'label', type: 'string', default: `''`, description: 'Nhãn hiển thị tùy biến (nếu để trống sẽ tự lấy theo status).' },
        { name: 'showDot', type: 'boolean', default: 'true', description: 'Hiển thị chấm tròn trạng thái phía trước.' },
        { name: 'loading', type: 'boolean', default: 'false', description: 'Bật chế độ Skeleton Shimmer khi đang tải dữ liệu.' }
    ],
    examples: [
        {
            title: 'Các trạng thái đơn hàng & tài khoản',
            description: 'Màu sắc được tự động phân bổ theo enum BadgeStatus.',
            code: `<erp-status-badge [status]="BadgeStatus.COMPLETED" label="Hoàn thành"></erp-status-badge>
<erp-status-badge [status]="BadgeStatus.PROCESSING" label="Đang xử lý"></erp-status-badge>
<erp-status-badge [status]="BadgeStatus.PENDING" label="Chờ duyệt"></erp-status-badge>
<erp-status-badge [status]="BadgeStatus.INACTIVE" label="Tạm khóa"></erp-status-badge>`
        },
        {
            title: 'Skeleton Loading trong bảng',
            description: 'Hiển thị khi bảng dữ liệu đang tải API.',
            code: `<erp-status-badge [loading]="true"></erp-status-badge>`
        }
    ]
};
//# sourceMappingURL=status-badge.doc.js.map