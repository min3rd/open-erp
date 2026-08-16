import { ComponentDoc } from '../models/component-doc.model';

export const KPI_CARD_DOC: ComponentDoc = {
  id: 'kpi-card',
  name: 'KpiCardComponent',
  selector: 'erp-kpi-card',
  category: 'Data Display',
  description: 'Thẻ chỉ số tổng quan (KPI) cho Dashboard với tiêu đề, giá trị nổi bật, xu hướng tăng/giảm, icon vector và chế độ Skeleton Shimmer.',
  importStatement: `import { KpiCardComponent, KpiTrendDirection } from '@open-erp/shared';`,
  props: [
    { name: 'title', type: 'string', default: `''`, description: 'Tiêu đề chỉ số thống kê (VD: Doanh thu tháng, Đơn hàng mới).' },
    { name: 'value', type: 'string | number', default: `''`, description: 'Giá trị hiển thị nổi bật.' },
    { name: 'subText', type: 'string', default: `''`, description: 'Nội dung phụ (VD: ↑ +18.4% so với tháng trước).' },
    { name: 'trend', type: `KpiTrendDirection | 'up' | 'down' | 'neutral'`, default: `KpiTrendDirection.NEUTRAL`, description: 'Hướng xu hướng tăng/giảm.', options: ['up', 'down', 'neutral'] },
    { name: 'iconName', type: 'IconName', default: 'undefined', description: 'Tên Feather/Lucide vector icon hiển thị góc trên.' },
    { name: 'iconBg', type: 'string', default: `'bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600'`, description: 'CSS class cho màu nền & màu sắc icon.' },
    { name: 'loading', type: 'boolean', default: 'false', description: 'Bật chế độ Skeleton Shimmer khi đang tải dữ liệu.' }
  ],
  examples: [
    {
      title: 'Thẻ thống kê Doanh thu & Đơn hàng',
      description: 'Hiển thị thẻ KPI với icon và xu hướng tăng.',
      code: `<erp-kpi-card title="Doanh thu tháng" 
              value="485.900.000 ₫" 
              subText="↑ +18.4% so với tháng trước" 
              trend="up" 
              iconName="dollar-sign">
</erp-kpi-card>`
    },
    {
      title: 'Skeleton Loading',
      description: 'Khi dashboard đang tải các số liệu thống kê.',
      code: `<erp-kpi-card [loading]="true"></erp-kpi-card>`
    }
  ]
};
