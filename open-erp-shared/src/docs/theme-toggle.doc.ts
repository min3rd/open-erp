import { ComponentDoc } from '../models/component-doc.model';

export const THEME_TOGGLE_DOC: ComponentDoc = {
  id: 'theme-toggle',
  name: 'ThemeToggleComponent',
  selector: 'erp-theme-toggle',
  category: 'Navigation & Utility',
  description: 'Nút chuyển đổi chế độ giao diện Tối/Sáng (Dark/Light mode) tích hợp trực tiếp với ThemeService và CSS variables.',
  importStatement: `import { ThemeToggleComponent } from '@open-erp/shared';`,
  props: [],
  examples: [
    {
      title: 'Nút chuyển đổi Dark/Light mode',
      description: 'Tự động đồng bộ với trạng thái theme hệ thống và localStorage.',
      code: `<erp-theme-toggle></erp-theme-toggle>`
    }
  ]
};
