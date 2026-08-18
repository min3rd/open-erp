import { Component, signal, computed, inject } from '@angular/core';
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
import { IconComponent, IconName } from '../icon/icon.component';
import { EmptyStateComponent } from '../empty-state/empty-state.component';
import { HelperTextComponent } from '../form/helper-text/helper-text.component';
import { ThemeToggleComponent } from '../theme-toggle/theme-toggle.component';
import { LanguageSelectorComponent } from '../language-selector/language-selector.component';
import { LabelComponent } from '../form/label/label.component';
import { InputComponent } from '../form/input/input.component';
import { PasswordInputComponent } from '../form/password-input/password-input.component';
import { NumberInputComponent } from '../form/number-input/number-input.component';
import { TextareaComponent } from '../form/textarea/textarea.component';
import { SelectComponent, SelectOption } from '../form/select/select.component';
import { MultiSelectComponent } from '../form/multi-select/multi-select.component';
import { CheckboxComponent } from '../form/checkbox/checkbox.component';
import { RadioGroupComponent, RadioOption } from '../form/radio-group/radio-group.component';
import { SwitchComponent } from '../form/switch/switch.component';
import { DatePickerComponent } from '../form/date-picker/date-picker.component';
import { TimePickerComponent } from '../form/time-picker/time-picker.component';
import { DateRangePickerComponent, DateRange } from '../form/date-range-picker/date-range-picker.component';
import { SliderComponent } from '../form/slider/slider.component';
import { ColorPickerComponent } from '../form/color-picker/color-picker.component';
import { AutocompleteComponent } from '../form/autocomplete/autocomplete.component';
import { TagInputComponent } from '../form/tag-input/tag-input.component';
import { RichTextEditorComponent } from '../form/rich-text-editor/rich-text-editor.component';
import { OtpInputComponent } from '../form/otp-input/otp-input.component';
import { FileUploadComponent, UploadedFile } from '../form/file-upload/file-upload.component';
import { NavbarComponent, NavbarItem } from '../navigation/navbar/navbar.component';
import { SidebarComponent, SidebarItem } from '../navigation/sidebar/sidebar.component';
import { BreadcrumbComponent, BreadcrumbItem } from '../navigation/breadcrumb/breadcrumb.component';
import { PaginationComponent } from '../navigation/pagination/pagination.component';
import { TabsComponent, TabItem } from '../navigation/tabs/tabs.component';
import { DropdownMenuComponent, DropdownMenuItem } from '../navigation/dropdown-menu/dropdown-menu.component';
import { BottomNavComponent, BottomNavItem } from '../navigation/bottom-nav/bottom-nav.component';
import { AnchorComponent, AnchorItem } from '../navigation/anchor/anchor.component';
import { BackToTopComponent } from '../navigation/back-to-top/back-to-top.component';
import { SpeedDialComponent, SpeedDialAction } from '../navigation/speed-dial/speed-dial.component';
import { SegmentedControlComponent, SegmentedControlOption } from '../navigation/segmented-control/segmented-control.component';

// Import Data Display Components
import { TableComponent, TableColumn } from '../table/table.component';
import { CardComponent } from '../card/card.component';
import { ListComponent } from '../list/list.component';
import { ListItemComponent } from '../list/list-item.component';
import { AvatarGroupComponent, AvatarGroupUser } from '../avatar/avatar-group.component';
import { AccordionComponent, AccordionItem } from '../accordion/accordion.component';
import { TimelineComponent, TimelineItem } from '../timeline/timeline.component';
import { TreeViewComponent, TreeNode } from '../tree-view/tree-view.component';
import { StatisticComponent } from '../statistic/statistic.component';
import { CarouselComponent, CarouselSlide } from '../carousel/carousel.component';
import { DescriptionsComponent, DescriptionItem } from '../descriptions/descriptions.component';
import { DescriptionItemComponent } from '../descriptions/description-item.component';
import { ImageComponent } from '../image/image.component';
import { ImageGalleryComponent } from '../image/image-gallery.component';
import { CalendarComponent, CalendarEvent } from '../calendar/calendar.component';
import { TooltipComponent } from '../tooltip/tooltip.component';
import { TooltipDirective } from '../tooltip/tooltip.directive';

// Import Feedback, Overlay & Utility Components
import { AlertComponent } from '../alert/alert.component';
import { ToastComponent } from '../toast/toast.component';
import { ToastContainerComponent } from '../toast/toast-container.component';
import { ToastService } from '../toast/toast.service';
import { ProgressComponent } from '../progress/progress.component';
import { ResultComponent } from '../result/result.component';
import { WatermarkComponent } from '../watermark/watermark.component';
import { ModalComponent } from '../modal/modal.component';
import { DrawerComponent } from '../drawer/drawer.component';
import { PopoverComponent } from '../popover/popover.component';
import { PopconfirmComponent } from '../popconfirm/popconfirm.component';
import { ContextMenuComponent } from '../context-menu/context-menu.component';
import { LightboxComponent } from '../lightbox/lightbox.component';
import { PortalDirective } from '../portal/portal.directive';
import { AffixComponent } from '../affix/affix.component';
import { VirtualScrollComponent } from '../virtual-scroll/virtual-scroll.component';
import { ClickOutsideDirective } from '../directives/click-outside.directive';
import { FocusTrapDirective } from '../directives/focus-trap.directive';
import { TransitionComponent } from '../transition/transition.component';
import { CopyButtonComponent, CopyToClipboardDirective } from '../copy-to-clipboard/copy-button.component';
import { ResizableComponent } from '../resizable/resizable.component';

// Import Docs Registry & Enums
import { ALL_COMPONENT_DOCS, ComponentDoc } from '../../docs';
import {
  BadgeStatus,
  BadgeVariant,
  BadgeColor,
  TagVariant,
  TagColor,
  AvatarSize,
  AvatarShape,
  ButtonVariant,
  ButtonSize,
  InputSize,
  ValidationStatus,
  KpiTrendDirection,
  EmptyStateType,
  TypographyVariant,
  DividerOrientation,
  SpinnerSize,
  SpinnerVariant,
  NavbarPosition,
  SidebarMode,
  BreadcrumbSeparator,
  PaginationVariant,
  TabsVariant,
  TabsOrientation,
  DropdownPlacement,
  SpeedDialDirection,
  SpeedDialPosition,
  BackToTopShape,
  AlertVariant,
  ToastType,
  ProgressVariant,
  ProgressStatus,
  ResultStatus,
  ModalSize,
  DrawerPlacement,
  DrawerSize,
  PopoverPlacement,
  TransitionType
} from '../../enums/component.enum';

type ShowcaseTab = 'playground' | 'api' | 'examples';
type CanvasBackground = 'dots' | 'grid' | 'slate';

@Component({
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
    SegmentedControlComponent,
    TableComponent,
    CardComponent,
    ListComponent,
    ListItemComponent,
    AvatarGroupComponent,
    AccordionComponent,
    TimelineComponent,
    TreeViewComponent,
    StatisticComponent,
    CarouselComponent,
    DescriptionsComponent,
    ImageComponent,
    ImageGalleryComponent,
    CalendarComponent,
    TooltipDirective,
    AlertComponent,
    ToastContainerComponent,
    ProgressComponent,
    ResultComponent,
    WatermarkComponent,
    ModalComponent,
    DrawerComponent,
    PopoverComponent,
    PopconfirmComponent,
    ContextMenuComponent,
    LightboxComponent,
    PortalDirective,
    AffixComponent,
    VirtualScrollComponent,
    ClickOutsideDirective,
    FocusTrapDirective,
    TransitionComponent,
    CopyButtonComponent,
    CopyToClipboardDirective,
    ResizableComponent
  ],
  templateUrl: './component-showcase.component.html'
})
export class ComponentShowcaseComponent {
  toastService = inject(ToastService);

  // Enum references for template
  AlertVariant = AlertVariant;
  ToastType = ToastType;
  ProgressVariant = ProgressVariant;
  ProgressStatus = ProgressStatus;
  ResultStatus = ResultStatus;
  ModalSize = ModalSize;
  DrawerPlacement = DrawerPlacement;
  DrawerSize = DrawerSize;
  PopoverPlacement = PopoverPlacement;
  TransitionType = TransitionType;
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
  activeTab = signal<ShowcaseTab>('playground');
  canvasBg = signal<CanvasBackground>('dots');

  // Search & Navigation State
  searchQuery = signal<string>('');
  selectedComponentId = signal<string>(ALL_COMPONENT_DOCS[0]?.id || 'button');
  copiedCode = signal<string | null>(null);

  // Playground Interactive Controls
  interactiveLoading = signal<boolean>(false);
  interactiveDisabled = signal<boolean>(false);
  interactiveRequired = signal<boolean>(false);
  interactiveClearable = signal<boolean>(true);
  interactiveSearchable = signal<boolean>(true);
  interactiveCardMode = signal<boolean>(true);
  interactiveOrientation = signal<'horizontal' | 'vertical'>('horizontal');
  interactiveStrengthMeter = signal<boolean>(true);
  interactiveShowCount = signal<boolean>(true);

  // Sizes & Variants
  interactiveSize = signal<AvatarSize | 'xs' | 'sm' | 'md' | 'lg' | 'xl'>('md');
  interactiveButtonSize = signal<ButtonSize | 'sm' | 'md' | 'lg'>('md');
  interactiveInputSize = signal<InputSize | 'sm' | 'md' | 'lg'>('md');
  interactiveVariant = signal<ButtonVariant | 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost' | 'success'>('primary');
  interactiveBadgeVariant = signal<BadgeVariant | 'solid' | 'subtle' | 'outline' | 'dot'>('subtle');
  interactiveBadgeColor = signal<BadgeColor | 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'neutral'>('primary');
  interactiveTagVariant = signal<TagVariant | 'solid' | 'subtle' | 'outline'>('subtle');
  interactiveTagColor = signal<TagColor | 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'purple' | 'pink'>('purple');
  interactiveTypographyVariant = signal<TypographyVariant | 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'lead' | 'body' | 'small' | 'muted' | 'code'>('h2');
  interactiveSpinnerVariant = signal<SpinnerVariant | 'spin' | 'dots' | 'pulse'>('spin');
  interactiveSpinnerSize = signal<SpinnerSize | 'xs' | 'sm' | 'md' | 'lg' | 'xl'>('md');
  interactiveStatus = signal<BadgeStatus | string>('COMPLETED');
  interactiveValidationStatus = signal<ValidationStatus | 'none' | 'valid' | 'invalid' | 'warning'>('none');
  interactiveShape = signal<AvatarShape | 'circle' | 'rounded' | 'square'>('rounded');
  interactiveSkeletonShape = signal<'rect' | 'circle' | 'rounded' | 'pill'>('rounded');
  interactiveTrend = signal<KpiTrendDirection | 'up' | 'down' | 'neutral'>('up');
  interactiveOnline = signal<boolean>(true);
  interactiveText = signal<string>('Nguyễn Văn Minh');
  interactiveButtonText = signal<string>('Lưu thay đổi');

  // Data Display & Navigation Interactive Signals
  interactiveBordered = signal<boolean>(true);
  interactiveStriped = signal<boolean>(false);
  interactiveHoverable = signal<boolean>(true);
  interactiveCompact = signal<boolean>(false);
  interactiveSelectable = signal<boolean>(true);
  interactivePagination = signal<boolean>(true);
  interactiveCardVariant = signal<'elevated' | 'outlined' | 'filled' | 'ghost'>('elevated');
  interactiveCardPadded = signal<boolean>(true);
  interactiveAvatarGroupMax = signal<number>(4);
  interactiveBadgeCorner = signal<'none' | 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left'>('none');
  interactiveBadgeCount = signal<number>(5);
  interactiveBadgePill = signal<boolean>(true);
  interactiveTagRemovable = signal<boolean>(true);
  interactiveTagSelectable = signal<boolean>(true);
  interactiveTagSelected = signal<boolean>(false);
  interactiveAccordionMultiple = signal<boolean>(false);
  interactiveAccordionGhost = signal<boolean>(false);
  interactiveTimelinePosition = signal<'left' | 'right' | 'alternate'>('left');
  interactiveTimelineReverse = signal<boolean>(false);
  interactiveTreeCheckable = signal<boolean>(true);
  interactiveTreeSelectable = signal<boolean>(true);
  interactiveTreeSearchable = signal<boolean>(true);
  interactiveDescriptionsColumn = signal<number>(3);
  interactiveImageRounded = signal<'none' | 'sm' | 'md' | 'lg' | 'xl' | 'full'>('lg');
  interactiveImagePreview = signal<boolean>(true);
  interactiveTooltipPlacement = signal<'top' | 'bottom' | 'left' | 'right'>('top');
  interactiveBreadcrumbSep = signal<'chevron' | 'slash' | 'arrow' | 'dot'>('chevron');
  interactiveTabsVar = signal<'line' | 'pills' | 'enclosed' | 'segmented'>('pills');
  interactiveBackToTopShp = signal<'circle' | 'rounded' | 'pill'>('circle');
  interactiveValue = signal<string>('485.900.000 ₫');
  interactiveIcon = signal<IconName>('bell');

  // Feedback & Status Signals
  interactiveAlertVariant = signal<AlertVariant | 'info' | 'success' | 'warning' | 'error' | 'neutral'>('info');
  interactiveAlertClosable = signal<boolean>(true);
  interactiveAlertBanner = signal<boolean>(false);
  interactiveProgressPercent = signal<number>(68);
  interactiveProgressVariant = signal<'bar' | 'circle'>('bar');
  interactiveProgressStatus = signal<'normal' | 'success' | 'warning' | 'error' | 'active'>('active');
  interactiveResultStatus = signal<'403' | '404' | '500' | 'success' | 'error' | 'warning' | 'info'>('404');
  interactiveWatermarkText = signal<string>('OPEN ERP 2026');

  // Overlay & Popup Signals
  showModal = signal<boolean>(false);
  interactiveModalSize = signal<'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'full'>('md');
  showDrawer = signal<boolean>(false);
  interactiveDrawerPlacement = signal<'left' | 'right' | 'top' | 'bottom'>('right');
  interactiveDrawerSize = signal<'sm' | 'md' | 'lg' | 'xl' | 'full'>('md');
  showLightbox = signal<boolean>(false);
  selectedPhotoIndex = signal<number>(0);
  interactiveTransitionType = signal<'fade' | 'scale' | 'slide-up' | 'slide-down' | 'slide-left' | 'slide-right'>('scale');
  interactiveTransitionShow = signal<boolean>(true);
  interactiveAffixTop = signal<number>(20);

  // Sample Context Menu Items
  sampleContextMenuItems = [
    { label: 'Chỉnh sửa bản ghi', icon: 'edit' as IconName, shortcut: 'Ctrl+E' },
    { label: 'Sao chép ID', icon: 'copy' as IconName, shortcut: 'Ctrl+C' },
    { label: 'Tải xuống tệp', icon: 'download' as IconName },
    { divider: true, label: '' },
    { label: 'Xóa bản ghi', icon: 'trash-2' as IconName, danger: true, shortcut: 'Del' }
  ];

  // Sample Virtual Scroll Items (1,000 records)
  sampleVirtualItems = Array.from({ length: 1000 }, (_, i) => ({
    id: i + 1,
    name: `Tập đoàn / Khách hàng Doanh nghiệp #${i + 1}`,
    code: `ERP-KH-${1000 + i}`,
    phone: `0987 ${String(100 + (i % 900))} ${String(100 + (i % 900))}`
  }));

  // Sample Lightbox Gallery Images
  sampleLightboxImages: string[] = [
    'https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=1000',
    'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1000',
    'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=1000'
  ];

  // Form Sample Data
  sampleSelectOptions: SelectOption[] = [
    { label: 'Phòng Kỹ thuật & Công nghệ', value: 'tech', icon: 'server', description: 'Phát triển phần mềm và hệ thống' },
    { label: 'Phòng Tài chính - Kế toán', value: 'finance', icon: 'dollar-sign', description: 'Quản lý thu chi và ngân sách' },
    { label: 'Phòng Kinh doanh & Marketing', value: 'sales', icon: 'shopping-bag', description: 'Phát triển khách hàng' },
    { label: 'Phòng Nhân sự (HR)', value: 'hr', icon: 'users', description: 'Tuyển dụng và đào tạo' }
  ];

  sampleRadioOptions: RadioOption[] = [
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
  sampleNavbarItems: NavbarItem[] = [
    { id: 'dash', label: 'Bảng điều khiển', icon: 'grid', active: true },
    { id: 'orders', label: 'Đơn hàng', icon: 'shopping-cart', badge: '12' },
    { id: 'customers', label: 'Khách hàng', icon: 'users' },
    { id: 'reports', label: 'Báo cáo', icon: 'bar-chart-2' }
  ];

  sampleSidebarItems: SidebarItem[] = [
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

  sampleBreadcrumbItems: BreadcrumbItem[] = [
    { id: 'sales', label: 'Bán hàng', icon: 'shopping-bag' },
    { id: 'orders', label: 'Danh sách đơn đặt hàng' },
    { id: 'detail', label: 'Đơn hàng #DH-2026-889', active: true }
  ];

  sampleTabsItems: TabItem[] = [
    { id: 'overview', label: 'Tổng quan thông tin', icon: 'grid' },
    { id: 'finance', label: 'Thu chi & Tài chính', icon: 'dollar-sign', badge: '3' },
    { id: 'activity', label: 'Nhật ký tác vụ', icon: 'clock' },
    { id: 'settings', label: 'Cấu hình phân quyền', icon: 'shield' }
  ];

  sampleDropdownItems: DropdownMenuItem[] = [
    { header: 'Tùy chọn thao tác' },
    { id: 'edit', label: 'Chỉnh sửa thông tin', icon: 'edit-2', shortcut: 'Ctrl+E' },
    { id: 'duplicate', label: 'Nhân bản bản ghi', icon: 'copy', shortcut: 'Ctrl+D' },
    { id: 'share', label: 'Chia sẻ liên kết', icon: 'share-2', badge: 'New' },
    { divider: true },
    { id: 'delete', label: 'Xóa vĩnh viễn', icon: 'trash-2', danger: true, shortcut: 'Del' }
  ];

  sampleBottomNavItems: BottomNavItem[] = [
    { id: 'home', label: 'Trang chủ', icon: 'home' },
    { id: 'orders', label: 'Đơn hàng', icon: 'shopping-bag', badge: '4' },
    { id: 'inventory', label: 'Kho hàng', icon: 'box' },
    { id: 'profile', label: 'Tài khoản', icon: 'user' }
  ];

  sampleAnchorItems: AnchorItem[] = [
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

  sampleSpeedDialActions: SpeedDialAction[] = [
    { id: 'order', label: 'Tạo đơn bán hàng', icon: 'shopping-cart', color: 'bg-indigo-600 text-white' },
    { id: 'customer', label: 'Thêm khách hàng mới', icon: 'user-plus', color: 'bg-emerald-600 text-white' },
    { id: 'invoice', label: 'Xuất hóa đơn điện tử', icon: 'file-text', color: 'bg-amber-600 text-white' }
  ];

  sampleSegmentedOptions: SegmentedControlOption[] = [
    { label: 'Danh sách bảng', value: 'list', icon: 'list' },
    { label: 'Lưới thẻ Card', value: 'grid', icon: 'grid' },
    { label: 'Biểu đồ KPI', value: 'chart', icon: 'pie-chart', badge: '3' }
  ];

  // Data Display Sample Datasets
  sampleTableColumns: TableColumn[] = [
    { key: 'code', title: 'Mã đơn', sortable: true, width: '110px' },
    { key: 'customer', title: 'Khách hàng', sortable: true },
    { key: 'category', title: 'Danh mục', width: '130px' },
    { key: 'total', title: 'Tổng tiền (VNĐ)', align: 'right', sortable: true },
    { key: 'status', title: 'Trạng thái', align: 'center', width: '130px' }
  ];

  sampleTableData = [
    { code: 'ORD-2026-001', customer: 'Tập đoàn Vingroup', category: 'Bất động sản', total: '1.450.000.000', status: 'Hoàn tất' },
    { code: 'ORD-2026-002', customer: 'Công ty Viettel Telecom', category: 'Viễn thông', total: '820.000.000', status: 'Đang xử lý' },
    { code: 'ORD-2026-003', customer: 'Ngân hàng Techcombank', category: 'Tài chính', total: '2.100.000.000', status: 'Hoàn tất' },
    { code: 'ORD-2026-004', customer: 'FPT Software Global', category: 'Công nghệ', total: '670.000.000', status: 'Chờ duyệt' },
    { code: 'ORD-2026-005', customer: 'Masan Consumer Corp', category: 'Bán lẻ', total: '950.000.000', status: 'Hoàn tất' }
  ];

  sampleTableSelectedRows: any[] = [];

  sampleAvatarGroupUsers: AvatarGroupUser[] = [
    { name: 'Minh Nguyen', online: true },
    { name: 'Lan Anh', online: true },
    { name: 'Tuan Kiet', online: false },
    { name: 'Bao Ngoc', online: true },
    { name: 'Hoang Nam', online: false },
    { name: 'Phuong Thao', online: true }
  ];

  sampleAccordionItems: AccordionItem[] = [
    { id: 'acc-1', title: 'Quy trình xuất hóa đơn điện tử tự động', subtitle: 'Tích hợp phân hệ kế toán và hóa đơn theo Thông tư 78', content: 'Hệ thống tự động phát hành hóa đơn khi đơn hàng được đánh dấu hoàn tất và chuyển trực tiếp sang cơ quan thuế.', icon: 'file-text', badge: 'Mới', expanded: true },
    { id: 'acc-2', title: 'Thiết lập cảnh báo hạn mức công nợ khách hàng', subtitle: 'Tự động khóa tạo đơn mới khi vượt hạn mức', content: 'Thiết lập ngưỡng tín dụng theo từng phân hạng khách hàng (VIP: 1 tỷ, Tiêu chuẩn: 300 triệu).', icon: 'shield' },
    { id: 'acc-3', title: 'Chính sách bảo mật dữ liệu & Sao lưu', subtitle: 'Mã hóa AES-256 và lưu trữ đám mây đa vùng', content: 'Dữ liệu được backup tự động mỗi ngày vào 02:00 sáng và lưu trữ mã hóa 30 ngày gần nhất.', icon: 'lock' }
  ];

  sampleTimelineItems: TimelineItem[] = [
    { id: 'tl-1', title: 'Đơn hàng được khởi tạo', description: 'Nhân viên kinh doanh tạo báo giá số #BG-2026-89.', timestamp: '08:30 18/08/2026', color: 'primary', icon: 'file-plus', tag: 'Kinh doanh' },
    { id: 'tl-2', title: 'Khách hàng ký hợp đồng điện tử', description: 'Xác thực chữ ký số qua VNPT-CA thành công.', timestamp: '10:45 18/08/2026', color: 'success', icon: 'check-circle', tag: 'Pháp lý' },
    { id: 'tl-3', title: 'Xuất kho và bàn giao đơn vị vận chuyển', description: 'Đơn hàng đã bàn giao cho Viettel Post mã vận đơn #VP89218.', timestamp: '14:20 18/08/2026', color: 'warning', icon: 'truck', tag: 'Vận hành' },
    { id: 'tl-4', title: 'Giao hàng thành công & Hoàn tất thanh toán', description: 'Khách hàng đã nhận đủ chứng từ và hóa đơn VAT.', timestamp: '16:50 18/08/2026', color: 'success', icon: 'award', tag: 'Hoàn tất' }
  ];

  sampleTreeNodes: TreeNode[] = [
    {
      id: 'root-1',
      label: 'Tổng Công ty Open-ERP Group',
      expanded: true,
      children: [
        {
          id: 'dept-tech',
          label: 'Khối Công nghệ & Sản phẩm',
          expanded: true,
          badge: '18',
          children: [
            { id: 'team-fe', label: 'Frontend Team (Angular 22 / Tailwind CSS)', icon: 'layout' },
            { id: 'team-be', label: 'Backend Team (.NET Core / Microservices)', icon: 'server' },
            { id: 'team-qa', label: 'QA & Automation Testing Team', icon: 'check-square' }
          ]
        },
        {
          id: 'dept-sales',
          label: 'Khối Kinh doanh & Marketing',
          badge: '12',
          children: [
            { id: 'team-enterprise', label: 'Đội ngũ Khách hàng Doanh nghiệp (B2B)' },
            { id: 'team-smb', label: 'Đội ngũ Khách hàng Vừa & Nhỏ (SMB)' }
          ]
        },
        {
          id: 'dept-finance',
          label: 'Khối Tài chính Kế toán',
          badge: '6',
          children: [
            { id: 'team-acc', label: 'Phòng Kế toán Tổng hợp' },
            { id: 'team-tax', label: 'Phòng Kế toán Thuế & Kiểm toán' }
          ]
        }
      ]
    }
  ];

  sampleCarouselSlides: CarouselSlide[] = [
    {
      title: 'Phân hệ Kế toán & Quản trị Tài chính 2.0',
      subtitle: 'Tích hợp hóa đơn điện tử tự động, đối soát công nợ thời gian thực và báo cáo lưu chuyển tiền tệ.',
      tag: 'Phiên bản mới 2026',
      imageUrl: 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=1200&auto=format&fit=crop&q=80'
    },
    {
      title: 'Giải pháp Quản lý Kho & Chuỗi cung ứng Thông minh',
      subtitle: 'Tối ưu hóa vị trí lưu kho, mã vạch QR code tự động và dự báo nhu cầu nhập hàng bằng AI.',
      tag: 'Tối ưu Vận hành',
      imageUrl: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=1200&auto=format&fit=crop&q=80'
    },
    {
      title: 'Bảng tin Điều hành & Phân tích Dữ liệu BI',
      subtitle: 'Biểu đồ KPI trực quan hóa dữ liệu kinh doanh đa chiều, hỗ trợ ra quyết định tức thì.',
      tag: 'Executive Dashboard',
      imageUrl: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1200&auto=format&fit=crop&q=80'
    }
  ];

  sampleDescriptionItems: DescriptionItem[] = [
    { label: 'Tên Doanh nghiệp', value: 'Công ty Cổ phần Tập đoàn Open-ERP Việt Nam' },
    { label: 'Mã số Doanh nghiệp / MST', value: '0109928194' },
    { label: 'Người đại diện pháp luật', value: 'Nguyễn Văn Minh (CEO)' },
    { label: 'Gói dịch vụ bản quyền', value: 'Enterprise Ultimate Cloud', badge: 'Active VIP' },
    { label: 'Ngày kích hoạt hệ thống', value: '18/08/2026' },
    { label: 'Hạn sử dụng dịch vụ', value: '18/08/2030 (4 năm)' },
    { label: 'Hạn mức lưu trữ dữ liệu', value: '5 TB SSD NVMe' },
    { label: 'Số lượng tài khoản khả dụng', value: '500 / 500 User Slots' },
    { label: 'Khu vực máy chủ Data Center', value: 'VNPT IDC Hòa Lạc (Tier III+)' }
  ];

  sampleGalleryImages = [
    { src: 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=600', title: 'Kế toán & Tài chính' },
    { src: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=600', title: 'Kho bãi Logistics' },
    { src: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600', title: 'Báo cáo Dashboard' },
    { src: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600', title: 'Chứng từ số' }
  ];

  sampleCalendarEvents: CalendarEvent[] = [
    { date: '2026-08-18', title: 'Họp giao ban Quý III', color: 'bg-indigo-600' },
    { date: '2026-08-20', title: 'Chốt kỳ tính lương nhân viên', color: 'bg-emerald-600' },
    { date: '2026-08-25', title: 'Quyết toán thuế doanh nghiệp', color: 'bg-amber-600' }
  ];

  // Navigation Interactive State Signals
  navActiveTabVal = signal<string>('overview');
  navSegmentedVal = signal<string>('list');
  navPaginationPage = signal<number>(2);
  navBottomActiveId = signal<string>('orders');
  navAnchorActiveId = signal<string>('section-general');
  navDropdownOpen = signal<boolean>(false);
  navSidebarCollapsed = signal<boolean>(false);
  navSidebarOverlay = signal<boolean>(false);
  navSpeedDialOpen = signal<boolean>(false);

  // Form Value Signals for Testing
  formInputVal = signal<string>('minh.nguyen@open-erp.vn');
  formPasswordVal = signal<string>('Secret@2026');
  formNumberVal = signal<number>(25);
  formTextareaVal = signal<string>('Giao hàng vào giờ hành chính, gọi trước 15 phút.');
  formSelectVal = signal<string>('tech');
  formMultiSelectVal = signal<string[]>(['tech', 'finance']);
  formCheckboxVal = signal<boolean>(true);
  formRadioVal = signal<string>('bank');
  formSwitchVal = signal<boolean>(true);
  formDateVal = signal<string>('2026-08-16');
  formTimeVal = signal<string>('09:30');
  formDateRangeVal = signal<DateRange>({ startDate: '2026-08-01', endDate: '2026-08-31' });
  formSliderVal = signal<number>(65);
  formColorVal = signal<string>('#4f46e5');
  formAutocompleteVal = signal<string>('cto');
  formTagsVal = signal<string[]>(['Angular', 'Ionic', 'Enterprise', 'Tailwind']);
  formRatingVal = signal<number>(5);
  formOtpVal = signal<string>('829104');
  formFilesVal = signal<UploadedFile[]>([]);
  formRichTextVal = signal<string>('<h3>Báo cáo Quý III</h3><p>Hệ thống hoạt động <b>ổn định</b> 99.9% uptime.</p>');
  stepperIndexVal = signal<number>(1);

  // Auto-loaded Component Registry
  readonly allDocs: ComponentDoc[] = ALL_COMPONENT_DOCS;

  readonly groupedCategories = computed(() => {
    const categories = [
      'General',
      'Data Display',
      'Form & Inputs',
      'Feedback & Status',
      'Feedback & Loading',
      'Overlay & Popups',
      'Navigation & Utility',
      'Utilities & Misc'
    ] as const;
    const q = this.searchQuery().toLowerCase().trim();

    return categories.map(cat => {
      const items = this.allDocs.filter(d => {
        const matchCat = d.category === cat;
        const matchSearch = d.name.toLowerCase().includes(q) ||
                            (d.selector?.toLowerCase() || '').includes(q) ||
                            d.description.toLowerCase().includes(q);
        return matchCat && matchSearch;
      });
      return { name: cat, items };
    }).filter(group => group.items.length > 0);
  });

  readonly activeComponent = computed<ComponentDoc>(() => {
    return this.allDocs.find(d => d.id === this.selectedComponentId()) || this.allDocs[0];
  });

  selectComponent(id: string): void {
    this.selectedComponentId.set(id);
    this.interactiveLoading.set(false);
  }

  setTab(tab: ShowcaseTab): void {
    this.activeTab.set(tab);
  }

  setCanvasBg(bg: CanvasBackground): void {
    this.canvasBg.set(bg);
  }

  setAvatarSize(sz: any): void {
    this.interactiveSize.set(sz);
  }

  setButtonSize(sz: any): void {
    this.interactiveButtonSize.set(sz);
  }

  setInputSize(sz: any): void {
    this.interactiveInputSize.set(sz);
  }

  setAvatarShape(sh: any): void {
    this.interactiveShape.set(sh);
  }

  copyToClipboard(text: string): void {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      this.copiedCode.set(text);
      setTimeout(() => this.copiedCode.set(null), 2000);
    }
  }
}
