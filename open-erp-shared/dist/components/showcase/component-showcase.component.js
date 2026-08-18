var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
// Import All Components for Live Preview Rendering
import { ButtonComponent } from '../button/button.component';
import { IconButtonComponent } from '../icon-button/icon-button.component';
import { TypographyComponent } from '../typography/typography.component';
import { LinkComponent } from '../link/link.component';
import { DividerComponent } from '../divider/divider.component';
import { BadgeComponent } from '../badge/badge.component';
import { TagComponent } from '../tag/tag.component';
import { SpinnerComponent } from '../spinner/spinner.component';
import { KbdComponent } from '../kbd/kbd.component';
import { SubmitButtonComponent } from '../form/submit-button/submit-button.component';
import { ResetButtonComponent } from '../form/reset-button/reset-button.component';
import { AvatarComponent } from '../avatar/avatar.component';
import { StatusBadgeComponent } from '../status-badge/status-badge.component';
import { KpiCardComponent } from '../kpi-card/kpi-card.component';
import { RatingComponent } from '../form/rating/rating.component';
import { StepperComponent } from '../navigation/stepper/stepper.component';
import { SkeletonComponent } from '../skeleton/skeleton.component';
import { IconComponent } from '../icon/icon.component';
import { EmptyStateComponent } from '../empty-state/empty-state.component';
import { HelperTextComponent } from '../form/helper-text/helper-text.component';
import { ThemeToggleComponent } from '../theme-toggle/theme-toggle.component';
import { LanguageSelectorComponent } from '../language-selector/language-selector.component';
import { LabelComponent } from '../form/label/label.component';
import { InputComponent } from '../form/input/input.component';
import { PasswordInputComponent } from '../form/password-input/password-input.component';
import { NumberInputComponent } from '../form/number-input/number-input.component';
import { TextareaComponent } from '../form/textarea/textarea.component';
import { SelectComponent } from '../form/select/select.component';
import { MultiSelectComponent } from '../form/multi-select/multi-select.component';
import { CheckboxComponent } from '../form/checkbox/checkbox.component';
import { RadioGroupComponent } from '../form/radio-group/radio-group.component';
import { SwitchComponent } from '../form/switch/switch.component';
import { DatePickerComponent } from '../form/date-picker/date-picker.component';
import { TimePickerComponent } from '../form/time-picker/time-picker.component';
import { DateRangePickerComponent } from '../form/date-range-picker/date-range-picker.component';
import { SliderComponent } from '../form/slider/slider.component';
import { ColorPickerComponent } from '../form/color-picker/color-picker.component';
import { AutocompleteComponent } from '../form/autocomplete/autocomplete.component';
import { TagInputComponent } from '../form/tag-input/tag-input.component';
import { RichTextEditorComponent } from '../form/rich-text-editor/rich-text-editor.component';
import { OtpInputComponent } from '../form/otp-input/otp-input.component';
import { FileUploadComponent } from '../form/file-upload/file-upload.component';
import { NavbarComponent } from '../navigation/navbar/navbar.component';
import { SidebarComponent } from '../navigation/sidebar/sidebar.component';
import { BreadcrumbComponent } from '../navigation/breadcrumb/breadcrumb.component';
import { PaginationComponent } from '../navigation/pagination/pagination.component';
import { TabsComponent } from '../navigation/tabs/tabs.component';
import { DropdownMenuComponent } from '../navigation/dropdown-menu/dropdown-menu.component';
import { BottomNavComponent } from '../navigation/bottom-nav/bottom-nav.component';
import { AnchorComponent } from '../navigation/anchor/anchor.component';
import { BackToTopComponent } from '../navigation/back-to-top/back-to-top.component';
import { SpeedDialComponent } from '../navigation/speed-dial/speed-dial.component';
import { SegmentedControlComponent } from '../navigation/segmented-control/segmented-control.component';
// Import Docs Registry & Enums
import { ALL_COMPONENT_DOCS } from '../../docs';
import { BadgeStatus, BadgeVariant, BadgeColor, TagVariant, TagColor, AvatarSize, AvatarShape, ButtonVariant, ButtonSize, InputSize, ValidationStatus, KpiTrendDirection, EmptyStateType, TypographyVariant, DividerOrientation, SpinnerSize, SpinnerVariant, NavbarPosition, SidebarMode, BreadcrumbSeparator, PaginationVariant, TabsVariant, TabsOrientation, DropdownPlacement, SpeedDialDirection, SpeedDialPosition, BackToTopShape } from '../../enums/component.enum';
let ComponentShowcaseComponent = class ComponentShowcaseComponent {
    // Enum references for template
    BadgeStatus = BadgeStatus;
    BadgeVariant = BadgeVariant;
    BadgeColor = BadgeColor;
    TagVariant = TagVariant;
    TagColor = TagColor;
    AvatarSize = AvatarSize;
    AvatarShape = AvatarShape;
    ButtonVariant = ButtonVariant;
    ButtonSize = ButtonSize;
    InputSize = InputSize;
    ValidationStatus = ValidationStatus;
    KpiTrendDirection = KpiTrendDirection;
    EmptyStateType = EmptyStateType;
    TypographyVariant = TypographyVariant;
    DividerOrientation = DividerOrientation;
    SpinnerSize = SpinnerSize;
    SpinnerVariant = SpinnerVariant;
    NavbarPosition = NavbarPosition;
    SidebarMode = SidebarMode;
    BreadcrumbSeparator = BreadcrumbSeparator;
    PaginationVariant = PaginationVariant;
    TabsVariant = TabsVariant;
    TabsOrientation = TabsOrientation;
    DropdownPlacement = DropdownPlacement;
    SpeedDialDirection = SpeedDialDirection;
    SpeedDialPosition = SpeedDialPosition;
    BackToTopShape = BackToTopShape;
    // Active Tab & Canvas State
    activeTab = signal('playground');
    canvasBg = signal('dots');
    // Search & Navigation State
    searchQuery = signal('');
    selectedComponentId = signal(ALL_COMPONENT_DOCS[0]?.id || 'button');
    copiedCode = signal(null);
    // Playground Interactive Controls
    interactiveLoading = signal(false);
    interactiveDisabled = signal(false);
    interactiveRequired = signal(false);
    interactiveClearable = signal(true);
    interactiveSearchable = signal(true);
    interactiveCardMode = signal(true);
    interactiveOrientation = signal('horizontal');
    interactiveStrengthMeter = signal(true);
    interactiveShowCount = signal(true);
    // Sizes & Variants
    interactiveSize = signal('md');
    interactiveButtonSize = signal('md');
    interactiveInputSize = signal('md');
    interactiveVariant = signal('primary');
    interactiveBadgeVariant = signal('subtle');
    interactiveBadgeColor = signal('primary');
    interactiveTagVariant = signal('subtle');
    interactiveTagColor = signal('purple');
    interactiveTypographyVariant = signal('h2');
    interactiveSpinnerVariant = signal('spin');
    interactiveSpinnerSize = signal('md');
    interactiveStatus = signal('COMPLETED');
    interactiveValidationStatus = signal('none');
    interactiveShape = signal('rounded');
    interactiveSkeletonShape = signal('rounded');
    interactiveTrend = signal('up');
    interactiveOnline = signal(true);
    interactiveText = signal('Nguyễn Văn Minh');
    interactiveButtonText = signal('Lưu thay đổi');
    interactiveValue = signal('485.900.000 ₫');
    interactiveIcon = signal('bell');
    // Form Sample Data
    sampleSelectOptions = [
        { label: 'Phòng Kỹ thuật & Công nghệ', value: 'tech', icon: 'server', description: 'Phát triển phần mềm và hệ thống' },
        { label: 'Phòng Tài chính - Kế toán', value: 'finance', icon: 'dollar-sign', description: 'Quản lý thu chi và ngân sách' },
        { label: 'Phòng Kinh doanh & Marketing', value: 'sales', icon: 'shopping-bag', description: 'Phát triển khách hàng' },
        { label: 'Phòng Nhân sự (HR)', value: 'hr', icon: 'users', description: 'Tuyển dụng và đào tạo' }
    ];
    sampleRadioOptions = [
        { label: 'Thanh toán Chuyển khoản', value: 'bank', description: 'Vietcombank, Techcombank', icon: 'credit-card' },
        { label: 'Thanh toán Tiền mặt', value: 'cash', description: 'Thanh toán trực tiếp tại quầy', icon: 'dollar-sign' },
        { label: 'Cổng thanh toán Online', value: 'online', description: 'VNPay, MoMo, ZaloPay', icon: 'globe' }
    ];
    sampleStepperSteps = [
        { title: 'Thông tin tài khoản', description: 'Email và mật khẩu' },
        { title: 'Hồ sơ doanh nghiệp', description: 'Mã số thuế, địa chỉ' },
        { title: 'Cấu hình phân quyền', description: 'Chọn vai trò truy cập' },
        { title: 'Hoàn tất', description: 'Kích hoạt tài khoản' }
    ];
    sampleAutocompleteItems = [
        { label: 'Giám đốc Điều hành (CEO)', value: 'ceo', category: 'Executive' },
        { label: 'Giám đốc Công nghệ (CTO)', value: 'cto', category: 'Executive' },
        { label: 'Kỹ sư Phần mềm Cao cấp (Senior Engineer)', value: 'sr_eng', category: 'Engineering' },
        { label: 'Chuyên viên Phân tích Nghiệp vụ (BA)', value: 'ba', category: 'Product' },
        { label: 'Kế toán trưởng', value: 'chief_acc', category: 'Finance' }
    ];
    // Navigation Samples
    sampleNavbarItems = [
        { id: 'dash', label: 'Bảng điều khiển', icon: 'grid', active: true },
        { id: 'orders', label: 'Đơn hàng', icon: 'shopping-cart', badge: '12' },
        { id: 'customers', label: 'Khách hàng', icon: 'users' },
        { id: 'reports', label: 'Báo cáo', icon: 'bar-chart-2' }
    ];
    sampleSidebarItems = [
        { sectionHeader: 'Tổng quan' },
        { id: 'dash', label: 'Bảng điều khiển', icon: 'activity', active: true },
        {
            id: 'sales',
            label: 'Kinh doanh & Bán hàng',
            icon: 'shopping-bag',
            expanded: true,
            children: [
                { id: 'orders', label: 'Đơn bán hàng', badge: '5' },
                { id: 'invoices', label: 'Hóa đơn VAT' },
                { id: 'quotes', label: 'Báo giá khách hàng' }
            ]
        },
        { sectionHeader: 'Quản lý kho' },
        { id: 'inventory', label: 'Tồn kho & Vật tư', icon: 'box' },
        { id: 'purchase', label: 'Mua hàng & NCC', icon: 'truck' },
        { sectionHeader: 'Cấu hình' },
        { id: 'settings', label: 'Thiết lập hệ thống', icon: 'settings' }
    ];
    sampleBreadcrumbItems = [
        { id: 'sales', label: 'Bán hàng', icon: 'shopping-bag' },
        { id: 'orders', label: 'Danh sách đơn đặt hàng' },
        { id: 'detail', label: 'Đơn hàng #DH-2026-889', active: true }
    ];
    sampleTabsItems = [
        { id: 'overview', label: 'Tổng quan thông tin', icon: 'grid' },
        { id: 'finance', label: 'Thu chi & Tài chính', icon: 'dollar-sign', badge: '3' },
        { id: 'activity', label: 'Nhật ký tác vụ', icon: 'clock' },
        { id: 'settings', label: 'Cấu hình phân quyền', icon: 'shield' }
    ];
    sampleDropdownItems = [
        { header: 'Tùy chọn thao tác' },
        { id: 'edit', label: 'Chỉnh sửa thông tin', icon: 'edit-2', shortcut: 'Ctrl+E' },
        { id: 'duplicate', label: 'Nhân bản bản ghi', icon: 'copy', shortcut: 'Ctrl+D' },
        { id: 'share', label: 'Chia sẻ liên kết', icon: 'share-2', badge: 'New' },
        { divider: true },
        { id: 'delete', label: 'Xóa vĩnh viễn', icon: 'trash-2', danger: true, shortcut: 'Del' }
    ];
    sampleBottomNavItems = [
        { id: 'home', label: 'Trang chủ', icon: 'home' },
        { id: 'orders', label: 'Đơn hàng', icon: 'shopping-bag', badge: '4' },
        { id: 'inventory', label: 'Kho hàng', icon: 'box' },
        { id: 'profile', label: 'Tài khoản', icon: 'user' }
    ];
    sampleAnchorItems = [
        { targetId: 'section-general', title: '1. Thông tin chung' },
        {
            targetId: 'section-finance',
            title: '2. Điều khoản thanh toán',
            children: [
                { targetId: 'section-payment', title: '2.1 Tiến độ giải ngân' },
                { targetId: 'section-tax', title: '2.2 Thuế VAT & Khấu trừ' }
            ]
        },
        { targetId: 'section-sign', title: '3. Phê duyệt & Ký số' }
    ];
    sampleSpeedDialActions = [
        { id: 'order', label: 'Tạo đơn bán hàng', icon: 'shopping-cart', color: 'bg-indigo-600 text-white' },
        { id: 'customer', label: 'Thêm khách hàng mới', icon: 'user-plus', color: 'bg-emerald-600 text-white' },
        { id: 'invoice', label: 'Xuất hóa đơn điện tử', icon: 'file-text', color: 'bg-amber-600 text-white' }
    ];
    sampleSegmentedOptions = [
        { label: 'Danh sách bảng', value: 'list', icon: 'list' },
        { label: 'Lưới thẻ Card', value: 'grid', icon: 'grid' },
        { label: 'Biểu đồ KPI', value: 'chart', icon: 'pie-chart', badge: '3' }
    ];
    // Navigation Interactive State Signals
    navActiveTabVal = signal('overview');
    navSegmentedVal = signal('list');
    navPaginationPage = signal(2);
    navBottomActiveId = signal('orders');
    navAnchorActiveId = signal('section-general');
    navDropdownOpen = signal(false);
    navSidebarCollapsed = signal(false);
    navSidebarOverlay = signal(false);
    navSpeedDialOpen = signal(false);
    // Form Value Signals for Testing
    formInputVal = signal('minh.nguyen@open-erp.vn');
    formPasswordVal = signal('Secret@2026');
    formNumberVal = signal(25);
    formTextareaVal = signal('Giao hàng vào giờ hành chính, gọi trước 15 phút.');
    formSelectVal = signal('tech');
    formMultiSelectVal = signal(['tech', 'finance']);
    formCheckboxVal = signal(true);
    formRadioVal = signal('bank');
    formSwitchVal = signal(true);
    formDateVal = signal('2026-08-16');
    formTimeVal = signal('09:30');
    formDateRangeVal = signal({ startDate: '2026-08-01', endDate: '2026-08-31' });
    formSliderVal = signal(65);
    formColorVal = signal('#4f46e5');
    formAutocompleteVal = signal('cto');
    formTagsVal = signal(['Angular', 'Ionic', 'Enterprise', 'Tailwind']);
    formRatingVal = signal(5);
    formOtpVal = signal('829104');
    formFilesVal = signal([]);
    formRichTextVal = signal('<h3>Báo cáo Quý III</h3><p>Hệ thống hoạt động <b>ổn định</b> 99.9% uptime.</p>');
    stepperIndexVal = signal(1);
    // Auto-loaded Component Registry
    allDocs = ALL_COMPONENT_DOCS;
    groupedCategories = computed(() => {
        const categories = ['General', 'Data Display', 'Form & Inputs', 'Feedback & Loading', 'Navigation & Utility'];
        const q = this.searchQuery().toLowerCase().trim();
        return categories.map(cat => {
            const items = this.allDocs.filter(d => {
                const matchCat = d.category === cat;
                const matchSearch = d.name.toLowerCase().includes(q) ||
                    d.selector.toLowerCase().includes(q) ||
                    d.description.toLowerCase().includes(q);
                return matchCat && matchSearch;
            });
            return { name: cat, items };
        }).filter(group => group.items.length > 0);
    });
    activeComponent = computed(() => {
        return this.allDocs.find(d => d.id === this.selectedComponentId()) || this.allDocs[0];
    });
    selectComponent(id) {
        this.selectedComponentId.set(id);
        this.interactiveLoading.set(false);
    }
    setTab(tab) {
        this.activeTab.set(tab);
    }
    setCanvasBg(bg) {
        this.canvasBg.set(bg);
    }
    setAvatarSize(sz) {
        this.interactiveSize.set(sz);
    }
    setButtonSize(sz) {
        this.interactiveButtonSize.set(sz);
    }
    setInputSize(sz) {
        this.interactiveInputSize.set(sz);
    }
    setAvatarShape(sh) {
        this.interactiveShape.set(sh);
    }
    copyToClipboard(text) {
        if (typeof navigator !== 'undefined' && navigator.clipboard) {
            navigator.clipboard.writeText(text);
            this.copiedCode.set(text);
            setTimeout(() => this.copiedCode.set(null), 2000);
        }
    }
};
ComponentShowcaseComponent = __decorate([
    Component({
        selector: 'erp-component-showcase',
        standalone: true,
        imports: [
            CommonModule,
            FormsModule,
            ButtonComponent,
            IconButtonComponent,
            TypographyComponent,
            LinkComponent,
            DividerComponent,
            BadgeComponent,
            TagComponent,
            SpinnerComponent,
            KbdComponent,
            SubmitButtonComponent,
            ResetButtonComponent,
            AvatarComponent,
            StatusBadgeComponent,
            KpiCardComponent,
            RatingComponent,
            StepperComponent,
            SkeletonComponent,
            IconComponent,
            EmptyStateComponent,
            HelperTextComponent,
            ThemeToggleComponent,
            LanguageSelectorComponent,
            LabelComponent,
            InputComponent,
            PasswordInputComponent,
            NumberInputComponent,
            TextareaComponent,
            SelectComponent,
            MultiSelectComponent,
            CheckboxComponent,
            RadioGroupComponent,
            SwitchComponent,
            DatePickerComponent,
            TimePickerComponent,
            DateRangePickerComponent,
            SliderComponent,
            ColorPickerComponent,
            AutocompleteComponent,
            TagInputComponent,
            RichTextEditorComponent,
            OtpInputComponent,
            FileUploadComponent,
            NavbarComponent,
            SidebarComponent,
            BreadcrumbComponent,
            PaginationComponent,
            TabsComponent,
            DropdownMenuComponent,
            BottomNavComponent,
            AnchorComponent,
            BackToTopComponent,
            SpeedDialComponent,
            SegmentedControlComponent
        ],
        templateUrl: './component-showcase.component.html'
    })
], ComponentShowcaseComponent);
export { ComponentShowcaseComponent };
//# sourceMappingURL=component-showcase.component.js.map