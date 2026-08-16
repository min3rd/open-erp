export const LABEL_DOC = {
    id: 'label',
    name: 'LabelComponent',
    selector: 'erp-label',
    category: 'Form & Inputs',
    description: 'Nhãn trường thông tin chuẩn ERP có dấu sao bắt buộc (*), nhãn tùy chọn (Optional), icon vector và tooltip giải thích chi tiết khi hover.',
    importStatement: `import { LabelComponent } from '@open-erp/shared';`,
    props: [
        { name: 'text', type: 'string', default: `''`, description: 'Nội dung văn bản hiển thị của nhãn.', required: true },
        { name: 'required', type: 'boolean', default: 'false', description: 'Hiển thị dấu hoa thị đỏ (*) biểu thị trường bắt buộc.' },
        { name: 'optional', type: 'boolean', default: 'false', description: 'Hiển thị nhãn phụ "(Tùy chọn)" mờ nhạt.' },
        { name: 'tooltip', type: 'string', default: 'undefined', description: 'Nội dung chú thích chi tiết hiển thị trong tooltip khi hover icon info.' },
        { name: 'icon', type: 'IconName', default: 'undefined', description: 'Icon Feather vector hiển thị phía trước nhãn.' },
        { name: 'forId', type: 'string', default: 'undefined', description: 'ID của thẻ input liên kết để kích hoạt focus khi click vào label.' },
        { name: 'loading', type: 'boolean', default: 'false', description: 'Chế độ Skeleton Loading hiển thị khối shimmer.' }
    ],
    examples: [
        {
            title: 'Nhãn bắt buộc có Tooltip giải thích',
            description: 'Phổ biến trong các biểu mẫu tài chính, thuế và định danh doanh nghiệp.',
            code: `<erp-label text="Mã số thuế doanh nghiệp" [required]="true" tooltip="Nhập mã số thuế 10 hoặc 13 số theo Giấy phép ĐKKD"></erp-label>`
        },
        {
            title: 'Nhãn tùy chọn có Icon',
            description: 'Dành cho các trường thông tin bổ sung không bắt buộc.',
            code: `<erp-label text="Số máy bàn / Fax" [optional]="true" icon="phone"></erp-label>`
        }
    ]
};
export const INPUT_DOC = {
    id: 'input',
    name: 'InputComponent',
    selector: 'erp-input',
    category: 'Form & Inputs',
    description: 'Ô nhập văn bản một dòng chuẩn doanh nghiệp hỗ trợ 2-way data binding ([(ngModel)]), Reactive Forms CVA, icon trái/phải, nút xóa nhanh (clearable) và validation states.',
    importStatement: `import { InputComponent, InputSize, ValidationStatus } from '@open-erp/shared';`,
    props: [
        { name: 'label', type: 'string', default: 'undefined', description: 'Nhãn trường hiển thị phía trên input.' },
        { name: 'placeholder', type: 'string', default: `''`, description: 'Văn bản gợi ý placeholder mờ.' },
        { name: 'type', type: 'string', default: `'text'`, description: 'Loại input HTML (text, email, tel, url).' },
        { name: 'size', type: `InputSize | 'sm' | 'md' | 'lg'`, default: `'md'`, description: 'Kích thước ô nhập (sm: nhỏ gọn, md: chuẩn, lg: nổi bật).', options: ['sm', 'md', 'lg'] },
        { name: 'status', type: `ValidationStatus | 'none' | 'valid' | 'invalid' | 'warning'`, default: `'none'`, description: 'Trạng thái xác thực viền và thông báo.', options: ['none', 'valid', 'invalid', 'warning'] },
        { name: 'prefixIcon', type: 'IconName', default: 'undefined', description: 'Icon Feather vector hiển thị cố định bên trái input.' },
        { name: 'suffixIcon', type: 'IconName', default: 'undefined', description: 'Icon Feather vector hiển thị cố định bên phải input.' },
        { name: 'clearable', type: 'boolean', default: 'false', description: 'Hiển thị nút X để người dùng xóa nhanh toàn bộ nội dung khi có text.' },
        { name: 'helperText', type: 'string', default: 'undefined', description: 'Dòng chữ hướng dẫn phụ phía dưới ô nhập.' },
        { name: 'errorMessage', type: 'string', default: 'undefined', description: 'Thông báo lỗi validation màu đỏ hiển thị kèm icon cảnh báo.' },
        { name: 'disabled', type: 'boolean', default: 'false', description: 'Khóa tương tác và làm mờ ô nhập.' },
        { name: 'readonly', type: 'boolean', default: 'false', description: 'Chỉ cho phép xem, không cho chỉnh sửa nội dung.' },
        { name: 'required', type: 'boolean', default: 'false', description: 'Đánh dấu bắt buộc nhập trên nhãn.' },
        { name: 'loading', type: 'boolean', default: 'false', description: 'Hiển thị Skeleton Shimmer khi đang tải dữ liệu từ API.' },
        { name: 'valueChange', type: 'EventEmitter<string>', default: 'event', description: 'Sự kiện phát ra khi giá trị thay đổi.' },
        { name: 'clear', type: 'EventEmitter<void>', default: 'event', description: 'Sự kiện phát ra khi click nút xóa nhanh.' }
    ],
    examples: [
        {
            title: 'Ô nhập tìm kiếm với Icon và Nút xóa nhanh',
            description: 'Hỗ trợ tìm kiếm theo thời gian thực.',
            code: `<erp-input label="Tìm kiếm khách hàng" placeholder="Nhập tên, email hoặc SĐT..." prefixIcon="search" [clearable]="true" [(ngModel)]="searchKeyword"></erp-input>`
        },
        {
            title: 'Ô nhập có Validation báo lỗi đỏ',
            description: 'Tự động hiển thị viền đỏ và thông báo lỗi chuẩn ERP.',
            code: `<erp-input label="Địa chỉ Email" type="email" placeholder="example@company.com" prefixIcon="mail" status="invalid" errorMessage="Địa chỉ email không đúng định dạng" [(ngModel)]="userEmail"></erp-input>`
        }
    ]
};
export const PASSWORD_INPUT_DOC = {
    id: 'password-input',
    name: 'PasswordInputComponent',
    selector: 'erp-password-input',
    category: 'Form & Inputs',
    description: 'Ô nhập mật khẩu bảo mật tích hợp nút chuyển đổi ẩn/hiện mật khẩu (Feather eye/eye-off) và thanh đo độ mạnh mật khẩu tự động (Password Strength Meter).',
    importStatement: `import { PasswordInputComponent, InputSize, ValidationStatus } from '@open-erp/shared';`,
    props: [
        { name: 'label', type: 'string', default: `'Mật khẩu'`, description: 'Nhãn trường.' },
        { name: 'placeholder', type: 'string', default: `'••••••••'`, description: 'Placeholder mật khẩu.' },
        { name: 'showStrengthMeter', type: 'boolean', default: 'false', description: 'Bật thanh đo độ an toàn mật khẩu tự động (Độ dài, chữ hoa, số, ký tự đặc biệt).' },
        { name: 'size', type: `InputSize | 'sm' | 'md' | 'lg'`, default: `'md'`, description: 'Kích thước ô nhập.', options: ['sm', 'md', 'lg'] },
        { name: 'status', type: `ValidationStatus | 'none' | 'valid' | 'invalid' | 'warning'`, default: `'none'`, description: 'Trạng thái xác thực.', options: ['none', 'valid', 'invalid', 'warning'] },
        { name: 'errorMessage', type: 'string', default: 'undefined', description: 'Thông báo lỗi khi mật khẩu không đạt yêu cầu.' },
        { name: 'disabled', type: 'boolean', default: 'false', description: 'Khóa tương tác.' },
        { name: 'required', type: 'boolean', default: 'false', description: 'Bắt buộc nhập.' },
        { name: 'loading', type: 'boolean', default: 'false', description: 'Chế độ Skeleton Loading.' },
        { name: 'valueChange', type: 'EventEmitter<string>', default: 'event', description: 'Sự kiện thay đổi giá trị mật khẩu.' }
    ],
    examples: [
        {
            title: 'Đăng ký tài khoản với Thước đo độ mạnh',
            description: 'Thanh đo độ mạnh chuyển từ Đỏ (Rất yếu) -> Vàng -> Xanh lam -> Xanh lá (Rất mạnh).',
            code: `<erp-password-input label="Tạo mật khẩu mới" [showStrengthMeter]="true" [required]="true" [(ngModel)]="accountPassword"></erp-password-input>`
        }
    ]
};
export const NUMBER_INPUT_DOC = {
    id: 'number-input',
    name: 'NumberInputComponent',
    selector: 'erp-number-input',
    category: 'Form & Inputs',
    description: 'Ô nhập số lượng/tiền tệ với các nút bấm tăng giảm (+/-), giới hạn min/max/step và tiền tố/hậu tố đơn vị đo lường.',
    importStatement: `import { NumberInputComponent, InputSize, ValidationStatus } from '@open-erp/shared';`,
    props: [
        { name: 'label', type: 'string', default: 'undefined', description: 'Nhãn trường.' },
        { name: 'placeholder', type: 'string', default: `'0'`, description: 'Placeholder giá trị mặc định.' },
        { name: 'min', type: 'number', default: '-Infinity', description: 'Giá trị tối thiểu cho phép.' },
        { name: 'max', type: 'number', default: 'Infinity', description: 'Giá trị tối đa cho phép.' },
        { name: 'step', type: 'number', default: '1', description: 'Bước nhảy mỗi lần ấn nút tăng giảm (+/-).' },
        { name: 'prefix', type: 'string', default: 'undefined', description: 'Ký tự tiền tố hiển thị (VD: $, ₫).' },
        { name: 'suffix', type: 'string', default: 'undefined', description: 'Ký tự hậu tố hiển thị (VD: VNĐ, Kiện, Thùng, Hộp).' },
        { name: 'size', type: `InputSize | 'sm' | 'md' | 'lg'`, default: `'md'`, description: 'Kích thước ô nhập.', options: ['sm', 'md', 'lg'] },
        { name: 'disabled', type: 'boolean', default: 'false', description: 'Vô hiệu hóa thao tác.' },
        { name: 'loading', type: 'boolean', default: 'false', description: 'Chế độ Skeleton Loading.' },
        { name: 'valueChange', type: 'EventEmitter<number | null>', default: 'event', description: 'Sự kiện phát ra giá trị số mới.' }
    ],
    examples: [
        {
            title: 'Ô nhập số lượng hàng tồn kho',
            description: 'Giới hạn số lượng từ 1 đến 500, bước nhảy 5.',
            code: `<erp-number-input label="Số lượng xuất kho" [min]="1" [max]="500" [step]="5" suffix="Kiện hàng" [(ngModel)]="stockOutQty"></erp-number-input>`
        }
    ]
};
export const TEXTAREA_DOC = {
    id: 'textarea',
    name: 'TextareaComponent',
    selector: 'erp-textarea',
    category: 'Form & Inputs',
    description: 'Ô nhập văn bản nhiều dòng có bộ đếm số lượng ký tự thời gian thực, giới hạn maxLength và tự động co giãn theo nội dung.',
    importStatement: `import { TextareaComponent, ValidationStatus } from '@open-erp/shared';`,
    props: [
        { name: 'label', type: 'string', default: 'undefined', description: 'Nhãn trường.' },
        { name: 'placeholder', type: 'string', default: `''`, description: 'Văn bản gợi ý placeholder.' },
        { name: 'rows', type: 'number', default: '3', description: 'Số dòng hiển thị ban đầu.' },
        { name: 'maxLength', type: 'number', default: 'undefined', description: 'Giới hạn số ký tự tối đa cho phép.' },
        { name: 'showCount', type: 'boolean', default: 'false', description: 'Hiển thị bộ đếm ký tự góc dưới bên phải (VD: 45 / 200).' },
        { name: 'disabled', type: 'boolean', default: 'false', description: 'Khóa ô nhập.' },
        { name: 'loading', type: 'boolean', default: 'false', description: 'Chế độ Skeleton Loading.' },
        { name: 'valueChange', type: 'EventEmitter<string>', default: 'event', description: 'Sự kiện thay đổi nội dung.' }
    ],
    examples: [
        {
            title: 'Ô nhập ghi chú đơn hàng có đếm ký tự',
            description: 'Giới hạn tối đa 300 ký tự có đếm thời gian thực.',
            code: `<erp-textarea label="Ghi chú giao hàng" [rows]="4" [maxLength]="300" [showCount]="true" placeholder="Ghi rõ thời gian giao hàng mong muốn..." [(ngModel)]="shippingNotes"></erp-textarea>`
        }
    ]
};
export const SELECT_DOC = {
    id: 'select',
    name: 'SelectComponent',
    selector: 'erp-select',
    category: 'Form & Inputs',
    description: 'Menu Dropdown chọn một tùy chọn với khả năng tìm kiếm nhanh (searchable), xóa lựa chọn (clearable), hỗ trợ icon và mô tả phụ cho từng option.',
    importStatement: `import { SelectComponent, SelectOption, InputSize, ValidationStatus } from '@open-erp/shared';`,
    props: [
        { name: 'label', type: 'string', default: 'undefined', description: 'Nhãn trường.' },
        { name: 'placeholder', type: 'string', default: `'Chọn một mục...'`, description: 'Placeholder khi chưa có mục nào được chọn.' },
        { name: 'options', type: 'SelectOption[]', default: '[]', description: 'Danh sách các tùy chọn { label, value, icon?, description?, disabled? }.', required: true },
        { name: 'searchable', type: 'boolean', default: 'false', description: 'Hiển thị ô tìm kiếm lọc nhanh danh sách trong popover.' },
        { name: 'clearable', type: 'boolean', default: 'false', description: 'Cho phép người dùng nhấn nút X để bỏ chọn giá trị hiện tại.' },
        { name: 'size', type: `InputSize | 'sm' | 'md' | 'lg'`, default: `'md'`, description: 'Kích thước hiển thị dropdown.', options: ['sm', 'md', 'lg'] },
        { name: 'disabled', type: 'boolean', default: 'false', description: 'Vô hiệu hóa dropdown.' },
        { name: 'loading', type: 'boolean', default: 'false', description: 'Chế độ Skeleton Loading.' },
        { name: 'valueChange', type: 'EventEmitter<any>', default: 'event', description: 'Sự kiện phát ra khi người dùng chọn mục mới.' }
    ],
    examples: [
        {
            title: 'Dropdown chọn phòng ban có tìm kiếm và nút xóa',
            description: 'Thích hợp cho danh sách nhiều mục có phân loại icon.',
            code: `<erp-select label="Phòng ban trực thuộc" [options]="departmentList" [searchable]="true" [clearable]="true" [(ngModel)]="userDepartment"></erp-select>`
        }
    ]
};
export const MULTI_SELECT_DOC = {
    id: 'multi-select',
    name: 'MultiSelectComponent',
    selector: 'erp-multi-select',
    category: 'Form & Inputs',
    description: 'Menu chọn nhiều mục hiển thị dạng Tags/Chips có nút xóa từng tag, nút Chọn tất cả / Bỏ chọn tất cả và ô tìm kiếm lọc nhanh.',
    importStatement: `import { MultiSelectComponent, SelectOption, InputSize, ValidationStatus } from '@open-erp/shared';`,
    props: [
        { name: 'label', type: 'string', default: 'undefined', description: 'Nhãn trường.' },
        { name: 'placeholder', type: 'string', default: `'Chọn nhiều mục...'`, description: 'Placeholder khi chưa chọn mục nào.' },
        { name: 'options', type: 'SelectOption[]', default: '[]', description: 'Danh sách các tùy chọn có sẵn.', required: true },
        { name: 'maxDisplayTags', type: 'number', default: '3', description: 'Số lượng tag tối đa hiển thị trước khi gộp thành "+N mục".' },
        { name: 'searchable', type: 'boolean', default: 'true', description: 'Bật ô tìm kiếm trong dropdown menu.' },
        { name: 'disabled', type: 'boolean', default: 'false', description: 'Khóa tương tác.' },
        { name: 'loading', type: 'boolean', default: 'false', description: 'Chế độ Skeleton Loading.' },
        { name: 'valueChange', type: 'EventEmitter<any[]>', default: 'event', description: 'Sự kiện phát ra mảng các giá trị được chọn.' }
    ],
    examples: [
        {
            title: 'Phân quyền vai trò người dùng (Multi-role)',
            description: 'Cho phép gán đồng thời nhiều quyền hạn cho tài khoản.',
            code: `<erp-multi-select label="Vai trò (Roles)" [options]="roleOptions" [maxDisplayTags]="4" [(ngModel)]="assignedRoles"></erp-multi-select>`
        }
    ]
};
export const CHECKBOX_DOC = {
    id: 'checkbox',
    name: 'CheckboxComponent',
    selector: 'erp-checkbox',
    category: 'Form & Inputs',
    description: 'Hộp kiểm đơn với nhãn, mô tả chi tiết, hỗ trợ trạng thái bán chọn (Indeterminate) và Angular Form CVA.',
    importStatement: `import { CheckboxComponent } from '@open-erp/shared';`,
    props: [
        { name: 'label', type: 'string', default: `''`, description: 'Nhãn chính bên cạnh hộp kiểm.', required: true },
        { name: 'description', type: 'string', default: 'undefined', description: 'Dòng mô tả phụ giải thích ý nghĩa cài đặt.' },
        { name: 'indeterminate', type: 'boolean', default: 'false', description: 'Trạng thái chọn một phần (dấu gạch ngang).' },
        { name: 'disabled', type: 'boolean', default: 'false', description: 'Khóa hộp kiểm.' },
        { name: 'loading', type: 'boolean', default: 'false', description: 'Chế độ Skeleton Loading.' },
        { name: 'checkedChange', type: 'EventEmitter<boolean>', default: 'event', description: 'Sự kiện phát ra khi thay đổi trạng thái check.' }
    ],
    examples: [
        {
            title: 'Hộp kiểm điều khoản và chính sách bảo mật',
            description: 'Kèm theo mô tả chi tiết về mã hóa dữ liệu.',
            code: `<erp-checkbox label="Tôi đồng ý với các điều khoản bảo mật dữ liệu" description="Dữ liệu doanh nghiệp được mã hóa AES-256 an toàn" [(ngModel)]="isAgreed"></erp-checkbox>`
        }
    ]
};
export const RADIO_GROUP_DOC = {
    id: 'radio-group',
    name: 'RadioGroupComponent',
    selector: 'erp-radio-group',
    category: 'Form & Inputs',
    description: 'Nhóm nút chọn duy nhất hỗ trợ hiển thị dạng danh sách tiêu chuẩn hoặc dạng Card lựa chọn (Card Mode) cao cấp.',
    importStatement: `import { RadioGroupComponent, RadioOption } from '@open-erp/shared';`,
    props: [
        { name: 'label', type: 'string', default: 'undefined', description: 'Nhãn trường.' },
        { name: 'options', type: 'RadioOption[]', default: '[]', description: 'Danh sách các mục lựa chọn { label, value, description?, icon?, disabled? }.', required: true },
        { name: 'cardMode', type: 'boolean', default: 'false', description: 'Bật giao diện Card chọn lựa với viền sáng và bóng đổ hiện đại.' },
        { name: 'orientation', type: `'vertical' | 'horizontal'`, default: `'vertical'`, description: 'Chiều sắp xếp các mục.', options: ['vertical', 'horizontal'] },
        { name: 'disabled', type: 'boolean', default: 'false', description: 'Khóa tương tác toàn bộ nhóm radio.' },
        { name: 'loading', type: 'boolean', default: 'false', description: 'Chế độ Skeleton Loading.' },
        { name: 'valueChange', type: 'EventEmitter<any>', default: 'event', description: 'Sự kiện phát ra khi chọn mục mới.' }
    ],
    examples: [
        {
            title: 'Chọn phương thức thanh toán dạng Card',
            description: 'Giao diện Card giúp người dùng dễ dàng chạm chọn trên cả mobile và desktop.',
            code: `<erp-radio-group label="Phương thức thanh toán" [cardMode]="true" orientation="horizontal" [options]="paymentOptions" [(ngModel)]="selectedPayment"></erp-radio-group>`
        }
    ]
};
export const SWITCH_DOC = {
    id: 'switch',
    name: 'SwitchComponent',
    selector: 'erp-switch',
    category: 'Form & Inputs',
    description: 'Nút gạt bật/tắt (Toggle Switch) mượt mà với 3 kích thước (sm, md, lg), nhãn tiêu đề và mô tả giải thích.',
    importStatement: `import { SwitchComponent, InputSize } from '@open-erp/shared';`,
    props: [
        { name: 'label', type: 'string', default: 'undefined', description: 'Nhãn tiêu đề nút gạt.' },
        { name: 'description', type: 'string', default: 'undefined', description: 'Dòng mô tả chi tiết phía dưới.' },
        { name: 'size', type: `InputSize | 'sm' | 'md' | 'lg'`, default: `'md'`, description: 'Kích thước nút gạt.', options: ['sm', 'md', 'lg'] },
        { name: 'disabled', type: 'boolean', default: 'false', description: 'Khóa thao tác.' },
        { name: 'loading', type: 'boolean', default: 'false', description: 'Chế độ Skeleton Loading.' },
        { name: 'checkedChange', type: 'EventEmitter<boolean>', default: 'event', description: 'Sự kiện phát ra khi thay đổi trạng thái bật/tắt.' }
    ],
    examples: [
        {
            title: 'Bật thông báo khẩn qua SMS',
            description: 'Chuyển đổi trạng thái cấu hình hệ thống.',
            code: `<erp-switch label="Thông báo SMS khẩn cấp" description="Hệ thống tự động gửi tin nhắn khi có sự cố đơn hàng" [(ngModel)]="smsNotifyEnabled"></erp-switch>`
        }
    ]
};
export const DATE_PICKER_DOC = {
    id: 'date-picker',
    name: 'DatePickerComponent',
    selector: 'erp-date-picker',
    category: 'Form & Inputs',
    description: 'Bộ chọn ngày chuẩn ISO (YYYY-MM-DD), phím tắt chọn nhanh ngày hiện tại (Hôm nay), icon lịch và kiểm tra tính hợp lệ.',
    importStatement: `import { DatePickerComponent, InputSize, ValidationStatus } from '@open-erp/shared';`,
    props: [
        { name: 'label', type: 'string', default: 'undefined', description: 'Nhãn trường.' },
        { name: 'placeholder', type: 'string', default: `'YYYY-MM-DD'`, description: 'Định dạng hiển thị.' },
        { name: 'min', type: 'string', default: 'undefined', description: 'Ngày sớm nhất được phép chọn (YYYY-MM-DD).' },
        { name: 'max', type: 'string', default: 'undefined', description: 'Ngày muộn nhất được phép chọn (YYYY-MM-DD).' },
        { name: 'size', type: `InputSize | 'sm' | 'md' | 'lg'`, default: `'md'`, description: 'Kích thước ô nhập.', options: ['sm', 'md', 'lg'] },
        { name: 'disabled', type: 'boolean', default: 'false', description: 'Khóa tương tác.' },
        { name: 'loading', type: 'boolean', default: 'false', description: 'Chế độ Skeleton Loading.' },
        { name: 'valueChange', type: 'EventEmitter<string>', default: 'event', description: 'Sự kiện phát ra chuỗi ngày chuẩn ISO.' }
    ],
    examples: [
        {
            title: 'Chọn ngày bắt đầu hợp đồng',
            description: 'Tích hợp nút chọn nhanh Hôm nay.',
            code: `<erp-date-picker label="Ngày bắt đầu hiệu lực" [required]="true" [(ngModel)]="contractStartDate"></erp-date-picker>`
        }
    ]
};
export const TIME_PICKER_DOC = {
    id: 'time-picker',
    name: 'TimePickerComponent',
    selector: 'erp-time-picker',
    category: 'Form & Inputs',
    description: 'Bộ chọn giờ/phút chuẩn định dạng HH:mm với nút chọn nhanh giờ hiện tại (Bây giờ) và icon đồng hồ vector.',
    importStatement: `import { TimePickerComponent, InputSize, ValidationStatus } from '@open-erp/shared';`,
    props: [
        { name: 'label', type: 'string', default: 'undefined', description: 'Nhãn trường.' },
        { name: 'size', type: `InputSize | 'sm' | 'md' | 'lg'`, default: `'md'`, description: 'Kích thước ô chọn giờ.', options: ['sm', 'md', 'lg'] },
        { name: 'disabled', type: 'boolean', default: 'false', description: 'Khóa tương tác.' },
        { name: 'loading', type: 'boolean', default: 'false', description: 'Chế độ Skeleton Loading.' },
        { name: 'valueChange', type: 'EventEmitter<string>', default: 'event', description: 'Sự kiện phát ra giờ chuẩn HH:mm.' }
    ],
    examples: [
        {
            title: 'Chọn ca làm việc',
            description: 'Lựa chọn thời gian bắt đầu ca.',
            code: `<erp-time-picker label="Thời gian vào ca" [(ngModel)]="shiftStartTime"></erp-time-picker>`
        }
    ]
};
export const DATE_RANGE_PICKER_DOC = {
    id: 'date-range-picker',
    name: 'DateRangePickerComponent',
    selector: 'erp-date-range-picker',
    category: 'Form & Inputs',
    description: 'Bộ chọn khoảng thời gian (Từ ngày -> Đến ngày) tích hợp các phím tắt nhanh: Hôm nay, Tuần này, Tháng này, Quý này.',
    importStatement: `import { DateRangePickerComponent, DateRange, ValidationStatus } from '@open-erp/shared';`,
    props: [
        { name: 'label', type: 'string', default: 'undefined', description: 'Nhãn trường.' },
        { name: 'disabled', type: 'boolean', default: 'false', description: 'Khóa tương tác.' },
        { name: 'loading', type: 'boolean', default: 'false', description: 'Chế độ Skeleton Loading.' },
        { name: 'rangeChange', type: 'EventEmitter<DateRange>', default: 'event', description: 'Sự kiện phát ra đối tượng { startDate, endDate }.' }
    ],
    examples: [
        {
            title: 'Bộ lọc khoảng thời gian báo cáo tài chính',
            description: 'Dễ dàng lọc theo Hôm nay, Tuần này, Tháng này chỉ với 1 click.',
            code: `<erp-date-range-picker label="Kỳ thống kê doanh thu" [(ngModel)]="revenueDateRange"></erp-date-range-picker>`
        }
    ]
};
export const SLIDER_DOC = {
    id: 'slider',
    name: 'SliderComponent',
    selector: 'erp-slider',
    category: 'Form & Inputs',
    description: 'Thanh trượt giá trị liên tục với nhãn hiển thị số lượng theo thời gian thực, dải min/max và đơn vị đo lường.',
    importStatement: `import { SliderComponent } from '@open-erp/shared';`,
    props: [
        { name: 'label', type: 'string', default: 'undefined', description: 'Nhãn trường.' },
        { name: 'min', type: 'number', default: '0', description: 'Giá trị nhỏ nhất của thang đo.' },
        { name: 'max', type: 'number', default: '100', description: 'Giá trị lớn nhất của thang đo.' },
        { name: 'step', type: 'number', default: '1', description: 'Bước nhảy giá trị khi kéo trượt.' },
        { name: 'showValue', type: 'boolean', default: 'true', description: 'Hiển thị badge số lượng thực tế phía trên.' },
        { name: 'unit', type: 'string', default: 'undefined', description: 'Đơn vị tính (VD: %, ₫, MB, Ngày).' },
        { name: 'disabled', type: 'boolean', default: 'false', description: 'Khóa thanh trượt.' },
        { name: 'loading', type: 'boolean', default: 'false', description: 'Chế độ Skeleton Loading.' },
        { name: 'valueChange', type: 'EventEmitter<number>', default: 'event', description: 'Sự kiện phát ra giá trị số mới khi kéo trượt.' }
    ],
    examples: [
        {
            title: 'Thanh trượt tỷ lệ phần trăm chiết khấu',
            description: 'Điều chỉnh chiết khấu từ 0% đến 50%.',
            code: `<erp-slider label="Tỷ lệ chiết khấu thương mại" [min]="0" [max]="50" [step]="5" unit="%" [(ngModel)]="discountRate"></erp-slider>`
        }
    ]
};
export const COLOR_PICKER_DOC = {
    id: 'color-picker',
    name: 'ColorPickerComponent',
    selector: 'erp-color-picker',
    category: 'Form & Inputs',
    description: 'Bộ chọn mã màu với bảng màu gợi ý nhanh (presets), ô chọn màu hệ thống và ô nhập mã HEX trực tiếp.',
    importStatement: `import { ColorPickerComponent } from '@open-erp/shared';`,
    props: [
        { name: 'label', type: 'string', default: 'undefined', description: 'Nhãn trường.' },
        { name: 'presets', type: 'string[]', default: `['#4f46e5', '#3b82f6', ...]`, description: 'Mảng các mã màu gợi ý nhanh.' },
        { name: 'disabled', type: 'boolean', default: 'false', description: 'Khóa bộ chọn màu.' },
        { name: 'loading', type: 'boolean', default: 'false', description: 'Chế độ Skeleton Loading.' },
        { name: 'valueChange', type: 'EventEmitter<string>', default: 'event', description: 'Sự kiện phát ra chuỗi mã màu HEX (VD: #4f46e5).' }
    ],
    examples: [
        {
            title: 'Tùy biến màu sắc nhận diện thương hiệu Tenant',
            description: 'Chọn màu từ presets hoặc mã HEX.',
            code: `<erp-color-picker label="Màu chủ đạo thương hiệu" [(ngModel)]="brandColor"></erp-color-picker>`
        }
    ]
};
export const AUTOCOMPLETE_DOC = {
    id: 'autocomplete',
    name: 'AutocompleteComponent',
    selector: 'erp-autocomplete',
    category: 'Form & Inputs',
    description: 'Ô tìm kiếm và gợi ý danh sách thông minh khi người dùng gõ phím với phân loại nhóm và icon đi kèm.',
    importStatement: `import { AutocompleteComponent, AutocompleteItem, ValidationStatus } from '@open-erp/shared';`,
    props: [
        { name: 'label', type: 'string', default: 'undefined', description: 'Nhãn trường.' },
        { name: 'placeholder', type: 'string', default: `'Tìm kiếm và chọn...'`, description: 'Placeholder gợi ý.' },
        { name: 'items', type: '(string | AutocompleteItem)[]', default: '[]', description: 'Danh sách các mục gợi ý { label, value, category?, icon? }.', required: true },
        { name: 'minLength', type: 'number', default: '1', description: 'Số ký tự tối thiểu trước khi hiển thị popover gợi ý.' },
        { name: 'disabled', type: 'boolean', default: 'false', description: 'Khóa tương tác.' },
        { name: 'loading', type: 'boolean', default: 'false', description: 'Chế độ Skeleton Loading.' },
        { name: 'itemSelect', type: 'EventEmitter<any>', default: 'event', description: 'Sự kiện phát ra khi người dùng chọn mục gợi ý.' }
    ],
    examples: [
        {
            title: 'Gợi ý chức danh trong công ty',
            description: 'Tự động gợi ý khi gõ từ 1 ký tự.',
            code: `<erp-autocomplete label="Vị trí công việc" [items]="jobTitles" [(ngModel)]="selectedJob"></erp-autocomplete>`
        }
    ]
};
export const TAG_INPUT_DOC = {
    id: 'tag-input',
    name: 'TagInputComponent',
    selector: 'erp-tag-input',
    category: 'Form & Inputs',
    description: 'Ô nhập danh sách nhãn/thẻ (Chips/Tags) linh hoạt khi nhấn Enter hoặc dấu phẩy, có xóa nhanh và giới hạn số lượng.',
    importStatement: `import { TagInputComponent, ValidationStatus } from '@open-erp/shared';`,
    props: [
        { name: 'label', type: 'string', default: 'undefined', description: 'Nhãn trường.' },
        { name: 'placeholder', type: 'string', default: `'Nhập thẻ và ấn Enter...'`, description: 'Placeholder khi chưa có tag.' },
        { name: 'maxTags', type: 'number', default: 'undefined', description: 'Giới hạn số lượng tag tối đa.' },
        { name: 'allowDuplicates', type: 'boolean', default: 'false', description: 'Cho phép nhập các tag có nội dung trùng nhau.' },
        { name: 'disabled', type: 'boolean', default: 'false', description: 'Khóa ô nhập.' },
        { name: 'loading', type: 'boolean', default: 'false', description: 'Chế độ Skeleton Loading.' },
        { name: 'tagsChange', type: 'EventEmitter<string[]>', default: 'event', description: 'Sự kiện phát ra mảng danh sách các tag mới.' }
    ],
    examples: [
        {
            title: 'Nhập từ khóa SEO cho sản phẩm ERP',
            description: 'Gõ từ khóa và nhấn Enter để thêm thẻ mới.',
            code: `<erp-tag-input label="Từ khóa tìm kiếm (Tags)" [maxTags]="6" [(ngModel)]="productTags"></erp-tag-input>`
        }
    ]
};
export const RATING_DOC = {
    id: 'rating',
    name: 'RatingComponent',
    selector: 'erp-rating',
    category: 'Data Display',
    description: 'Đánh giá xếp hạng sao tương tác với hiệu ứng rê chuột xem trước (Hover Effect), xóa đánh giá và hỗ trợ chế độ chỉ đọc (readonly).',
    importStatement: `import { RatingComponent, RatingSize } from '@open-erp/shared';`,
    props: [
        { name: 'label', type: 'string', default: 'undefined', description: 'Nhãn trường.' },
        { name: 'max', type: 'number', default: '5', description: 'Số lượng ngôi sao tối đa (VD: 5 hoặc 10).' },
        { name: 'size', type: `RatingSize | 'sm' | 'md' | 'lg'`, default: `'md'`, description: 'Kích thước ngôi sao.', options: ['sm', 'md', 'lg'] },
        { name: 'allowClear', type: 'boolean', default: 'true', description: 'Cho phép click lại vào sao hiện tại để xóa đánh giá về 0.' },
        { name: 'readonly', type: 'boolean', default: 'false', description: 'Chỉ hiển thị điểm đánh giá, khóa tương tác chuột.' },
        { name: 'disabled', type: 'boolean', default: 'false', description: 'Làm mờ và khóa tương tác.' },
        { name: 'loading', type: 'boolean', default: 'false', description: 'Chế độ Skeleton Loading.' },
        { name: 'ratingChange', type: 'EventEmitter<number>', default: 'event', description: 'Sự kiện phát ra điểm đánh giá mới.' }
    ],
    examples: [
        {
            title: 'Đánh giá chất lượng phục vụ khách hàng',
            description: 'Đánh giá 5 sao tương tác mượt mà.',
            code: `<erp-rating label="Mức độ hài lòng của khách hàng" [max]="5" [(ngModel)]="serviceRating"></erp-rating>`
        }
    ]
};
export const RICH_TEXT_EDITOR_DOC = {
    id: 'rich-text-editor',
    name: 'RichTextEditorComponent',
    selector: 'erp-rich-text-editor',
    category: 'Form & Inputs',
    description: 'Trình soạn thảo văn bản định dạng phong phú với thanh công cụ đầy đủ (Bold, Italic, Underline, Lists, Heading, Clear Format).',
    importStatement: `import { RichTextEditorComponent } from '@open-erp/shared';`,
    props: [
        { name: 'label', type: 'string', default: 'undefined', description: 'Nhãn trường.' },
        { name: 'placeholder', type: 'string', default: `'Nhập nội dung định dạng...'`, description: 'Placeholder khi khung trống.' },
        { name: 'minHeight', type: 'string', default: `'140px'`, description: 'Chiều cao tối thiểu của khung soạn thảo.' },
        { name: 'disabled', type: 'boolean', default: 'false', description: 'Khóa khung soạn thảo.' },
        { name: 'loading', type: 'boolean', default: 'false', description: 'Chế độ Skeleton Loading.' },
        { name: 'contentChange', type: 'EventEmitter<string>', default: 'event', description: 'Sự kiện phát ra chuỗi mã HTML khi soạn thảo.' }
    ],
    examples: [
        {
            title: 'Soạn thảo điều khoản hợp đồng kinh tế',
            description: 'Định dạng HTML lưu trữ trực tiếp vào cơ sở dữ liệu.',
            code: `<erp-rich-text-editor label="Điều khoản hợp đồng" minHeight="180px" [(ngModel)]="contractHtml"></erp-rich-text-editor>`
        }
    ]
};
export const OTP_INPUT_DOC = {
    id: 'otp-input',
    name: 'OtpInputComponent',
    selector: 'erp-otp-input',
    category: 'Form & Inputs',
    description: 'Ô nhập mã xác thực OTP / CAPTCHA bảo mật (4 hoặc 6 số), tự động chuyển focus sang ô kế tiếp và hỗ trợ dán (Paste) mã.',
    importStatement: `import { OtpInputComponent, ValidationStatus } from '@open-erp/shared';`,
    props: [
        { name: 'label', type: 'string', default: `'Mã xác thực OTP'`, description: 'Nhãn trường.' },
        { name: 'length', type: 'number', default: '6', description: 'Số lượng chữ số OTP (VD: 4 hoặc 6).' },
        { name: 'disabled', type: 'boolean', default: 'false', description: 'Khóa toàn bộ các ô nhập.' },
        { name: 'loading', type: 'boolean', default: 'false', description: 'Chế độ Skeleton Loading.' },
        { name: 'completed', type: 'EventEmitter<string>', default: 'event', description: 'Sự kiện phát ra ngay khi người dùng nhập đủ các chữ số.' },
        { name: 'valueChange', type: 'EventEmitter<string>', default: 'event', description: 'Sự kiện thay đổi giá trị từng bước.' }
    ],
    examples: [
        {
            title: 'Xác thực đăng nhập 2 lớp (2FA)',
            description: 'Tự động gọi API xác thực khi nhập đủ 6 chữ số.',
            code: `<erp-otp-input label="Nhập mã 6 chữ số gửi qua SMS" [length]="6" (completed)="onVerifyOtp($event)" [(ngModel)]="otpCode"></erp-otp-input>`
        }
    ]
};
export const FILE_UPLOAD_DOC = {
    id: 'file-upload',
    name: 'FileUploadComponent',
    selector: 'erp-file-upload',
    category: 'Form & Inputs',
    description: 'Vùng tải tệp tin và hình ảnh hỗ trợ kéo & thả (Drag & Drop), xem trước ảnh và danh sách tệp đính kèm có nút xóa.',
    importStatement: `import { FileUploadComponent, UploadedFile } from '@open-erp/shared';`,
    props: [
        { name: 'label', type: 'string', default: 'undefined', description: 'Nhãn trường.' },
        { name: 'accept', type: 'string', default: `'*'`, description: 'Định dạng tệp cho phép (VD: image/*, .pdf, .xlsx).' },
        { name: 'multiple', type: 'boolean', default: 'false', description: 'Cho phép tải lên nhiều tệp cùng lúc.' },
        { name: 'maxFileSizeMb', type: 'number', default: '10', description: 'Dung lượng tối đa của mỗi tệp (MB).' },
        { name: 'hint', type: 'string', default: `'Kéo và thả tệp tin vào đây, hoặc duyệt tệp'`, description: 'Dòng văn bản hướng dẫn trong khung upload.' },
        { name: 'disabled', type: 'boolean', default: 'false', description: 'Khóa thao tác tải tệp.' },
        { name: 'loading', type: 'boolean', default: 'false', description: 'Chế độ Skeleton Loading.' },
        { name: 'filesChange', type: 'EventEmitter<UploadedFile[]>', default: 'event', description: 'Sự kiện phát ra mảng danh sách tệp đã tải lên.' }
    ],
    examples: [
        {
            title: 'Tải lên hóa đơn chứng từ đính kèm',
            description: 'Kéo thả ảnh hoặc tệp PDF.',
            code: `<erp-file-upload label="Đính kèm hóa đơn chứng từ" accept="image/*,.pdf" [multiple]="true" [maxFileSizeMb]="15" [(ngModel)]="invoiceFileList"></erp-file-upload>`
        }
    ]
};
export const SUBMIT_BUTTON_DOC = {
    id: 'submit-button',
    name: 'SubmitButtonComponent',
    selector: 'erp-submit-button',
    category: 'General',
    description: 'Nút gửi biểu mẫu tích hợp sẵn vòng quay tiến trình đang gửi (submitting spinner), icon xác nhận và chế độ toàn chiều rộng.',
    importStatement: `import { SubmitButtonComponent, ButtonSize } from '@open-erp/shared';`,
    props: [
        { name: 'text', type: 'string', default: `'Lưu thông tin'`, description: 'Nội dung hiển thị trên nút.' },
        { name: 'size', type: `ButtonSize | 'sm' | 'md' | 'lg'`, default: `'md'`, description: 'Kích thước nút.', options: ['sm', 'md', 'lg'] },
        { name: 'submitting', type: 'boolean', default: 'false', description: 'Bật vòng quay loading và khóa tương tác khi đang gửi request.' },
        { name: 'icon', type: 'IconName', default: `'check'`, description: 'Icon Feather hiển thị phía trước văn bản.' },
        { name: 'fullWidth', type: 'boolean', default: 'false', description: 'Chiếm toàn bộ 100% chiều rộng container.' },
        { name: 'disabled', type: 'boolean', default: 'false', description: 'Khóa nút khi form không hợp lệ.' },
        { name: 'skeleton', type: 'boolean', default: 'false', description: 'Chế độ Skeleton Loading.' },
        { name: 'submitClick', type: 'EventEmitter<MouseEvent>', default: 'event', description: 'Sự kiện phát ra khi click vào nút submit.' }
    ],
    examples: [
        {
            title: 'Nút Submit biểu mẫu lưu dữ liệu',
            description: 'Tự động hiển thị trạng thái đang lưu.',
            code: `<erp-submit-button [submitting]="isSaving" (submitClick)="onSaveData()">Lưu thay đổi</erp-submit-button>`
        }
    ]
};
export const RESET_BUTTON_DOC = {
    id: 'reset-button',
    name: 'ResetButtonComponent',
    selector: 'erp-reset-button',
    category: 'General',
    description: 'Nút đặt lại hoặc hủy bỏ thao tác biểu mẫu với icon hoàn tác mượt mà.',
    importStatement: `import { ResetButtonComponent, ButtonSize } from '@open-erp/shared';`,
    props: [
        { name: 'text', type: 'string', default: `'Hủy bỏ / Đặt lại'`, description: 'Nội dung hiển thị trên nút.' },
        { name: 'size', type: `ButtonSize | 'sm' | 'md' | 'lg'`, default: `'md'`, description: 'Kích thước nút.', options: ['sm', 'md', 'lg'] },
        { name: 'icon', type: 'IconName', default: `'refresh-cw'`, description: 'Icon Feather hiển thị phía trước văn bản.' },
        { name: 'fullWidth', type: 'boolean', default: 'false', description: 'Chiếm 100% chiều ngang.' },
        { name: 'disabled', type: 'boolean', default: 'false', description: 'Vô hiệu hóa nút.' },
        { name: 'skeleton', type: 'boolean', default: 'false', description: 'Chế độ Skeleton Loading.' },
        { name: 'resetClick', type: 'EventEmitter<MouseEvent>', default: 'event', description: 'Sự kiện phát ra khi click nút reset.' }
    ],
    examples: [
        {
            title: 'Nút Đặt lại Form',
            description: 'Xóa toàn bộ giá trị đang nhập về mặc định.',
            code: `<erp-reset-button (resetClick)="onResetForm()">Đặt lại bộ lọc</erp-reset-button>`
        }
    ]
};
export const STEPPER_DOC = {
    id: 'stepper',
    name: 'StepperComponent',
    selector: 'erp-stepper',
    category: 'Data Display',
    description: 'Thanh chỉ báo và điều hướng cho quy trình/biểu mẫu nhiều bước (Multi-step Form) dạng ngang hoặc dọc có icon và mô tả.',
    importStatement: `import { StepperComponent, StepItem, StepperOrientation } from '@open-erp/shared';`,
    props: [
        { name: 'steps', type: '(string | StepItem)[]', default: '[]', description: 'Danh sách các bước trong quy trình { title, description?, icon?, disabled? }.', required: true },
        { name: 'currentStep', type: 'number', default: '0', description: 'Chỉ số bước đang thao tác hiện tại (0-indexed).' },
        { name: 'orientation', type: `StepperOrientation | 'horizontal' | 'vertical'`, default: `'horizontal'`, description: 'Chiều hiển thị thanh bước.', options: ['horizontal', 'vertical'] },
        { name: 'clickable', type: 'boolean', default: 'true', description: 'Cho phép click trực tiếp vào từng bước để điều hướng.' },
        { name: 'loading', type: 'boolean', default: 'false', description: 'Chế độ Skeleton Loading.' },
        { name: 'stepChange', type: 'EventEmitter<number>', default: 'event', description: 'Sự kiện phát ra khi người dùng chuyển sang bước mới.' }
    ],
    examples: [
        {
            title: 'Quy trình tạo đơn hàng 4 bước',
            description: 'Hiển thị bước hoàn thành (tích xanh), bước hiện tại và bước chờ.',
            code: `<erp-stepper [steps]="orderSteps" [currentStep]="activeStepIndex" (stepChange)="activeStepIndex = $event"></erp-stepper>`
        }
    ]
};
export const HELPER_TEXT_DOC = {
    id: 'helper-text',
    name: 'HelperTextComponent',
    selector: 'erp-helper-text',
    category: 'Feedback & Loading',
    description: 'Dòng hướng dẫn hoặc thông báo lỗi validation đỏ / cảnh báo vàng / thành công xanh có icon đồng bộ.',
    importStatement: `import { HelperTextComponent, ValidationStatus } from '@open-erp/shared';`,
    props: [
        { name: 'text', type: 'string', default: `''`, description: 'Nội dung thông báo hướng dẫn hoặc cảnh báo.' },
        { name: 'status', type: `ValidationStatus | 'none' | 'valid' | 'invalid' | 'warning'`, default: `'none'`, description: 'Mức độ cảnh báo và màu sắc tương ứng.', options: ['none', 'valid', 'invalid', 'warning'] }
    ],
    examples: [
        {
            title: 'Thông báo lỗi validation màu đỏ',
            description: 'Tự động đổi màu và hiển thị icon alert-circle.',
            code: `<erp-helper-text text="Email không đúng định dạng quy chuẩn" status="invalid"></erp-helper-text>`
        },
        {
            title: 'Thông báo xác thực thành công màu xanh',
            description: 'Tự động đổi màu và hiển thị icon check-circle.',
            code: `<erp-helper-text text="Tài khoản hợp lệ và sẵn sàng sử dụng" status="valid"></erp-helper-text>`
        }
    ]
};
//# sourceMappingURL=form-components.doc.js.map