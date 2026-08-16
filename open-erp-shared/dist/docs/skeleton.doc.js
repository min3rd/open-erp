export const SKELETON_DOC = {
    id: 'skeleton',
    name: 'SkeletonComponent',
    selector: 'erp-skeleton',
    category: 'Feedback & Loading',
    description: 'Khung xương Shimmer Loading động dùng để hiển thị placeholder mượt mà trong khi chờ dữ liệu bất đồng bộ tải về.',
    importStatement: `import { SkeletonComponent } from '@open-erp/shared';`,
    props: [
        { name: 'width', type: 'string', default: `'100%'`, description: 'Chiều rộng (VD: 100%, 12rem, 40px).' },
        { name: 'height', type: 'string', default: `'1rem'`, description: 'Chiều cao (VD: 1rem, 2.5rem, 40px).' },
        { name: 'shape', type: `'rect' | 'circle' | 'rounded' | 'pill'`, default: `'rounded'`, description: 'Hình dạng khung xương.', options: ['rounded', 'circle', 'pill', 'rect'] },
        { name: 'className', type: 'string', default: `''`, description: 'Tùy biến thêm class Tailwind CSS.' }
    ],
    examples: [
        {
            title: 'Các hình dạng Skeleton cơ bản',
            description: 'Dạng hình tròn (avatar), pill (badge), hình chữ nhật (dòng text/card).',
            code: `<erp-skeleton width="3rem" height="3rem" shape="circle"></erp-skeleton>
<erp-skeleton width="6rem" height="1.5rem" shape="pill"></erp-skeleton>
<erp-skeleton width="100%" height="2rem" shape="rounded"></erp-skeleton>`
        }
    ]
};
//# sourceMappingURL=skeleton.doc.js.map