export const AVATAR_DOC = {
    id: 'avatar',
    name: 'AvatarComponent',
    selector: 'erp-avatar',
    category: 'Data Display',
    description: 'Hiển thị ảnh đại diện người dùng hoặc chữ cái đầu tiên (Initial Avatar) kèm trạng thái trực tuyến và hỗ trợ Skeleton Shimmer khi đang tải.',
    importStatement: `import { AvatarComponent, AvatarSize, AvatarShape } from '@open-erp/shared';`,
    props: [
        { name: 'name', type: 'string', default: `'User'`, description: 'Tên người dùng để tự động trích xuất chữ cái in hoa đầu tiên.' },
        { name: 'size', type: `AvatarSize | 'xs' | 'sm' | 'md' | 'lg' | 'xl'`, default: `AvatarSize.MD`, description: 'Kích thước avatar.', options: ['xs', 'sm', 'md', 'lg', 'xl'] },
        { name: 'shape', type: `AvatarShape | 'circle' | 'rounded' | 'square'`, default: `AvatarShape.ROUNDED`, description: 'Kiểu bo góc avatar.', options: ['rounded', 'circle', 'square'] },
        { name: 'online', type: 'boolean', default: 'false', description: 'Hiển thị chấm xanh báo trạng thái đang hoạt động (Online).' },
        { name: 'imageUrl', type: 'string', default: 'undefined', description: 'Đường dẫn ảnh nếu muốn hiển thị hình ảnh thay vì chữ cái.' },
        { name: 'loading', type: 'boolean', default: 'false', description: 'Bật chế độ Skeleton Shimmer khi đang tải dữ liệu.' }
    ],
    examples: [
        {
            title: 'Avatar cơ bản với các kích thước',
            description: 'Hiển thị chữ cái đầu tiên theo tên người dùng.',
            code: `<erp-avatar name="Admin" size="sm"></erp-avatar>
<erp-avatar name="Nguyễn Minh" size="md" [online]="true"></erp-avatar>
<erp-avatar name="Vina Global" size="lg" shape="circle"></erp-avatar>`
        },
        {
            title: 'Trạng thái Skeleton Loading',
            description: 'Khi dữ liệu profile người dùng đang được tải từ API.',
            code: `<erp-avatar [loading]="true" size="md"></erp-avatar>
<erp-avatar [loading]="true" size="lg" shape="circle"></erp-avatar>`
        }
    ]
};
//# sourceMappingURL=avatar.doc.js.map