export const MAINTENANCE_BANNER_DOC = {
    id: 'maintenance-banner',
    name: 'MaintenanceBannerComponent',
    selector: 'erp-maintenance-banner',
    category: 'Navigation & Utility',
    description: 'Màn hình khóa bảo trì hệ thống toàn trang hoặc thanh thông báo broadcast trên cùng điều khiển động qua cấu hình app-config.json.',
    importStatement: `import { MaintenanceBannerComponent } from '@open-erp/shared';`,
    props: [],
    examples: [
        {
            title: 'Khai báo tại Root Component',
            description: 'Tự động kích hoạt khi cấu hình maintenance hoặc systemNotice được bật.',
            code: `<erp-maintenance-banner></erp-maintenance-banner>`
        }
    ]
};
//# sourceMappingURL=maintenance-banner.doc.js.map