import { ComponentDoc } from '../models/component-doc.model';

export const LANGUAGE_SELECTOR_DOC: ComponentDoc = {
  id: 'language-selector',
  name: 'LanguageSelectorComponent',
  selector: 'erp-language-selector',
  category: 'Navigation & Utility',
  description: 'Menu Dropdown chọn ngôn ngữ ứng dụng, liên kết trực tiếp với Transloco và danh sách ngôn ngữ cấu hình từ JSON runtime.',
  importStatement: `import { LanguageSelectorComponent } from '@open-erp/shared';`,
  props: [],
  examples: [
    {
      title: 'Bộ chuyển đổi ngôn ngữ',
      description: 'Chuyển đổi tức thì giữa Tiếng Việt và English.',
      code: `<erp-language-selector></erp-language-selector>`
    }
  ]
};
