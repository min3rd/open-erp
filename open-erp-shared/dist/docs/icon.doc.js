export const ICON_DOC = {
    id: 'icon',
    name: 'IconComponent',
    selector: 'erp-icon',
    category: 'General',
    description: 'Hệ thống Icon Vector Feather/Lucide sắc nét chuẩn hóa, không phụ thuộc vào ký tự emoji trên hệ điều hành.',
    importStatement: `import { IconComponent, IconName } from '@open-erp/shared';`,
    props: [
        { name: 'name', type: 'IconName', default: `'info'`, description: 'Tên biểu tượng vector SVG.', options: ['globe', 'sun', 'moon', 'check', 'user', 'users', 'settings', 'bell', 'search', 'alert-triangle', 'refresh-cw', 'plus', 'dollar-sign'] },
        { name: 'size', type: 'number | string', default: '18', description: 'Kích thước icon tính bằng pixel.' },
        { name: 'strokeWidth', type: 'number', default: '2', description: 'Độ dày nét vẽ icon.' },
        { name: 'className', type: 'string', default: `''`, description: 'Class CSS Tailwind áp dụng màu sắc/hiệu ứng.' }
    ],
    examples: [
        {
            title: 'Các biểu tượng thường dùng trong ERP',
            description: 'Icon hiển thị với màu sắc và kích thước linh hoạt.',
            code: `<erp-icon name="dollar-sign" [size]="20" className="text-emerald-500"></erp-icon>
<erp-icon name="users" [size]="20" className="text-indigo-500"></erp-icon>
<erp-icon name="shield" [size]="20" className="text-cyan-500"></erp-icon>`
        }
    ]
};
//# sourceMappingURL=icon.doc.js.map