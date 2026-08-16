import { ComponentDoc } from '../models/component-doc.model';

export const EMPTY_STATE_DOC: ComponentDoc = {
  id: 'empty-state',
  name: 'EmptyStateComponent',
  selector: 'erp-empty-state',
  category: 'Feedback & Loading',
  description: 'Hiển thị giao diện thông báo khi bảng/danh sách không có dữ liệu, kèm icon vector, mô tả và nút hành động.',
  importStatement: `import { EmptyStateComponent, EmptyStateType } from '@open-erp/shared';`,
  props: [
    { name: 'title', type: 'string', default: `'Không tìm thấy dữ liệu'`, description: 'Tiêu đề thông báo trạng thái trống.' },
    { name: 'description', type: 'string', default: `''`, description: 'Mô tả chi tiết hoặc gợi ý hành động.' },
    { name: 'type', type: `EmptyStateType | 'no-data' | 'not-found' | 'error' | 'maintenance'`, default: `EmptyStateType.NO_DATA`, description: 'Kiểu trạng thái trống.', options: ['no-data', 'not-found', 'error', 'maintenance'] },
    { name: 'loading', type: 'boolean', default: 'false', description: 'Bật chế độ Skeleton Shimmer khi đang tải dữ liệu.' }
  ],
  examples: [
    {
      title: 'Trạng thái không tìm thấy kết quả',
      description: 'Khi tìm kiếm hoặc lọc dữ liệu không khớp.',
      code: `<erp-empty-state title="Không tìm thấy đơn hàng"
                 description="Vui lòng thử lại với từ khóa tìm kiếm hoặc bộ lọc khác."
                 type="not-found">
  <erp-button action variant="outline" iconLeft="refresh-cw">Đặt lại bộ lọc</erp-button>
</erp-empty-state>`
    }
  ]
};
