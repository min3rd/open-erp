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
  SpinnerVariant
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
    FileUploadComponent
  ],
  templateUrl: './component-showcase.component.html'
})
export class ComponentShowcaseComponent {
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
  interactiveValue = signal<string>('485.900.000 ₫');
  interactiveIcon = signal<IconName>('bell');

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
    const categories = ['General', 'Data Display', 'Form & Inputs', 'Feedback & Loading', 'Navigation & Utility'] as const;
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
