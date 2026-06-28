import { FieldType } from '@open-erp/shared';

export interface PanelTemplateDef {
  id: string;
  name: string;
  icon: string;
  description: string;
  type: 'default' | 'tab' | 'card';
  desktopCols: number;
  tabletCols: number;
  mobileCols: number;
  colSpans: number[];
}

export const PANEL_TEMPLATES: PanelTemplateDef[] = [
  { id: 'full',      name: 'Toàn chiều rộng',  icon: 'square',    description: '1 ô chiếm toàn bộ chiều rộng',      type: 'default', desktopCols: 1, tabletCols: 1, mobileCols: 1, colSpans: [12] },
  { id: 'half',      name: 'Hai cột đều',       icon: 'columns',   description: '2 ô 50% / 50%',                     type: 'default', desktopCols: 2, tabletCols: 2, mobileCols: 1, colSpans: [6, 6] },
  { id: 'thirds',    name: 'Ba cột đều',        icon: 'grid',      description: '3 ô 33% / 33% / 33%',               type: 'default', desktopCols: 3, tabletCols: 2, mobileCols: 1, colSpans: [4, 4, 4] },
  { id: 'quarters',  name: 'Bốn cột đều',       icon: 'grid',      description: '4 ô 25% x 4',                       type: 'default', desktopCols: 4, tabletCols: 2, mobileCols: 1, colSpans: [3, 3, 3, 3] },
  { id: 'one-third', name: '1/3 + 2/3',         icon: 'layout',    description: 'Cột nhỏ trái + cột lớn phải',       type: 'default', desktopCols: 2, tabletCols: 2, mobileCols: 1, colSpans: [4, 8] },
  { id: 'two-third', name: '2/3 + 1/3',         icon: 'layout',    description: 'Cột lớn trái + cột nhỏ phải',       type: 'default', desktopCols: 2, tabletCols: 2, mobileCols: 1, colSpans: [8, 4] },
  { id: 'sidebar-l', name: 'Sidebar trái',       icon: 'sidebar',   description: 'Sidebar 25% + vùng nội dung 75%', type: 'default', desktopCols: 2, tabletCols: 1, mobileCols: 1, colSpans: [3, 9] },
  { id: 'sidebar-r', name: 'Sidebar phải',       icon: 'sidebar',   description: 'Vùng nội dung 75% + sidebar 25%', type: 'default', desktopCols: 2, tabletCols: 1, mobileCols: 1, colSpans: [9, 3] },
  { id: 'tab',       name: 'Panel Tab',          icon: 'book-open', description: 'Nhiều trang tab với nội dung riêng', type: 'tab',    desktopCols: 1, tabletCols: 1, mobileCols: 1, colSpans: [12] },
];

export const FIELD_PALETTE_ITEMS = [
  { id: 'TEXT',     label: 'Văn bản ngắn',   icon: 'type',         type: 'field', data: FieldType.TEXT },
  { id: 'TEXTAREA', label: 'Văn bản dài',    icon: 'align-left',   type: 'field', data: FieldType.TEXTAREA },
  { id: 'NUMBER',   label: 'Trường số',       icon: 'hash',         type: 'field', data: FieldType.NUMBER },
  { id: 'DATE',     label: 'Ngày tháng',      icon: 'calendar',     type: 'field', data: FieldType.DATE },
  { id: 'SELECT',   label: 'Hộp chọn',        icon: 'list',         type: 'field', data: FieldType.SELECT },
  { id: 'CHECKBOX', label: 'Hộp kiểm',        icon: 'check-square', type: 'field', data: FieldType.CHECKBOX },
  { id: 'FILE',     label: 'Tải tệp tin',     icon: 'paperclip',    type: 'field', data: FieldType.FILE },
  { id: 'GRID',     label: 'Bảng nhập liệu',  icon: 'grid',         type: 'field', data: FieldType.GRID },
];

export const OPERATORS = [
  { value: 'eq', label: 'Bằng (==)' },
  { value: 'neq', label: 'Khác (!=)' },
  { value: 'empty', label: 'Trống' },
  { value: 'notEmpty', label: 'Không trống' },
];

export const ACTIONS = [
  { value: 'show', label: 'Hiển thị' },
  { value: 'hide', label: 'Ẩn đi' },
  { value: 'enable', label: 'Cho phép nhập' },
  { value: 'disable', label: 'Chỉ đọc' },
  { value: 'require', label: 'Bắt buộc nhập' },
];

export const FIELD_TYPE_LABELS: Record<string, string> = {
  [FieldType.TEXT]: 'Văn bản',
  [FieldType.TEXTAREA]: 'Đoạn văn',
  [FieldType.NUMBER]: 'Số',
  [FieldType.DATE]: 'Ngày',
  [FieldType.SELECT]: 'Chọn',
  [FieldType.CHECKBOX]: 'Hộp kiểm',
  [FieldType.FILE]: 'Tệp tin',
  [FieldType.GRID]: 'Bảng',
};

export const FIELD_TYPE_ICONS: Record<string, string> = {
  [FieldType.TEXT]: 'type',
  [FieldType.TEXTAREA]: 'align-left',
  [FieldType.NUMBER]: 'hash',
  [FieldType.DATE]: 'calendar',
  [FieldType.SELECT]: 'list',
  [FieldType.CHECKBOX]: 'check-square',
  [FieldType.FILE]: 'paperclip',
  [FieldType.GRID]: 'grid',
};

// Toàn bộ chuỗi Text hiển thị trên Giao diện (i18n-ready)
export const I18N_LABELS = {
  title: 'Trình Thiết Kế Form Động',
  subtitle: 'Thiết kế bố cục, phân khu và quy tắc logic biểu mẫu',
  btnUndo: 'Hoàn tác',
  btnRedo: 'Làm lại',
  btnDesignMode: 'Thiết kế',
  btnPreviewMode: 'Xem thử',
  btnSaveDesign: 'Lưu Thiết Kế',
  paletteLayoutTitle: 'Bố cục Panel',
  paletteFieldsTitle: 'Linh kiện nhập liệu',
  canvasTitle: 'Bản vẽ thiết kế',
  canvasBadgeText: 'trường ·',
  canvasEmptyText: 'Nhấn vào một bố cục Panel bên trái để bắt đầu. Sau đó kéo thả linh kiện vào các ô của panel.',
  toplevelDropZoneLabel: 'Trường nhập liệu chung (ngoài panel)',
  toplevelDropZoneEmpty: 'Nhấn linh kiện trái để thêm trực tiếp vào đây',
  previewDesktop: 'Desktop',
  previewTablet: 'Tablet',
  previewMobile: 'Mobile',
  propsEmptyText: 'Chọn một Panel hoặc Trường nhập liệu để thiết lập thuộc tính.',
  propsPanelHeader: 'Cấu Hình Panel',
  propsPanelName: 'Tên phân khu',
  propsPanelType: 'Loại panel',
  propsPanelResponsive: 'Bố cục theo thiết bị',
  propsPanelTabManage: 'Quản lý Tab',
  propsPanelColConfig: 'Cấu hình các cột (col-span)',
  propsFieldTabGeneral: 'Chung',
  propsFieldTabLayout: 'Bố cục',
  propsFieldTabData: 'Lựa chọn',
  propsFieldTabGrid: 'Cột bảng',
  propsFieldTabRules: 'Logic',
  propsFieldLabel: 'Nhãn hiển thị (Label)',
  propsFieldVarName: 'Tên biến (Variable Name)',
  propsFieldPlaceholder: 'Placeholder',
  propsFieldDefaultValue: 'Giá trị mặc định',
  propsFieldToggles: {
    required: 'Bắt buộc nhập',
    readOnly: 'Chỉ đọc',
    hidden: 'Ẩn trường',
  },
  propsFieldValidationTitle: 'Xác thực (Validation)',
  propsFieldValidationMinLength: 'Độ dài tối thiểu',
  propsFieldValidationMaxLength: 'Độ dài tối đa',
  propsFieldOptionsTitle: 'Danh sách lựa chọn',
  propsFieldGridColsTitle: 'Cột bảng nhập liệu',
  propsFieldRulesTitle: 'Quy tắc hiển thị có điều kiện',
  msgLoadSuccess: 'Tải thiết kế form thành công!',
  msgSaveSuccess: 'Lưu thiết kế thành công!',
  msgSaveFail: 'Lưu thất bại: ',
  msgConnectionError: 'Lỗi kết nối máy chủ.',
  msgUndoSuccess: 'Đã hoàn tác!',
  msgRedoSuccess: 'Đã làm lại!',
  msgAddPanelSuccess: 'Đã thêm "{name}"!',
  msgAddNestedPanelSuccess: 'Đã thêm panel lồng nhau!',
  msgDeletePanelSuccess: 'Đã xóa phân khu!',
  msgAddFieldSuccess: 'Đã thêm trường "{name}"',
  msgDeleteFieldSuccess: 'Đã xóa trường nhập liệu!',
  tabLabelDefault: 'Tab ',
  columnLabelDefault: 'Cột ',
  optionLabelDefault: 'Lựa chọn ',
  gridColLabelDefault: 'Cột ',
  labels: {
    cols: 'Số cột',
    width: 'Độ rộng',
    addTab: 'Thêm Tab',
    addColumn: 'Thêm cột',
    addRule: 'Thêm quy tắc',
    addOption: 'Thêm lựa chọn',
    if: 'Nếu',
    then: 'Thì',
    target: 'Biến đích',
    value: 'Giá trị',
    header: 'Nhãn cột',
    type: 'Loại',
    flat: '1 cột (phẳng)',
  },
  tooltips: {
    up: 'Lên',
    down: 'Xuống',
    addCol: 'Thêm cột',
    deletePanel: 'Xóa panel',
    deleteField: 'Xóa',
    deleteTab: 'Xóa tab',
  },
  placeholders: {
    tabName: 'Tên tab...',
    optionLabel: 'Nhãn...',
    optionValue: 'Giá trị...',
    gridColHeader: 'Nhãn cột...',
    conditionalField: 'Tên biến nguồn...',
    conditionalTarget: 'Tên biến đích...',
  },
  dragEmptyCol: 'Kéo thả hoặc nhấn để thêm',
};
