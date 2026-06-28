import {
  Component,
  input,
  output,
  OnInit,
  OnDestroy,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup, FormControl } from '@angular/forms';
import { Subscription } from 'rxjs';
import { TranslocoPipe } from '@jsverse/transloco';

import { FormSchema, FormField, FieldType } from '../../models/dynamic-form.model';
import { FormEngineService } from '../../services/form-engine.service';

// Components
import { InputComponent } from '../input/input.component';
import { TextareaComponent } from '../textarea/textarea.component';
import { SelectComponent } from '../select/select.component';
import { CheckboxComponent } from '../checkbox/checkbox.component';
import { RadioComponent } from '../radio/radio.component';
import { SwitchComponent } from '../switch/switch.component';
import { FormNumberComponent } from '../form-number/form-number.component';
import { FormDateComponent } from '../form-date/form-date.component';
import { FormFileComponent } from '../form-file/form-file.component';
import { FormFieldWrapperComponent } from '../form-field-wrapper/form-field-wrapper.component';
import { IconComponent } from '../icon/icon.component';

/**
 * oerp-form-renderer
 *
 * Component chính của Form Library. Nhận vào một `FormSchema` JSON
 * và tự động render toàn bộ form với layout, fields, conditional rules.
 *
 * Usage:
 *   <oerp-form-renderer
 *     [schema]="myFormSchema"
 *     (formChange)="onFormChange($event)"
 *     (formSubmit)="onSubmit($event)"
 *   />
 *
 * Hoặc với FormGroup bên ngoài (controlled mode):
 *   <oerp-form-renderer
 *     [schema]="myFormSchema"
 *     [formGroup]="myFormGroup"
 *   />
 */
@Component({
  selector: 'oerp-form-renderer',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    TranslocoPipe,
    FormFieldWrapperComponent,
    InputComponent,
    TextareaComponent,
    SelectComponent,
    CheckboxComponent,
    RadioComponent,
    SwitchComponent,
    FormNumberComponent,
    FormDateComponent,
    FormFileComponent,
    IconComponent,
  ],
  templateUrl: './form-renderer.component.html',
})
export class FormRendererComponent implements OnInit, OnDestroy {
  private readonly formEngine = inject(FormEngineService);

  schema = input.required<FormSchema>();
  /** Nếu cung cấp, dùng FormGroup này thay vì tự tạo (controlled mode) */
  externalFormGroup = input<FormGroup | null>(null);
  /** Nếu true: chỉ hiển thị, không cho chỉnh sửa */
  readOnly = input<boolean>(false);
  /** Breakpoint giả lập cho preview (desktop | tablet | mobile) */
  previewMode = input<'desktop' | 'tablet' | 'mobile' | null>(null);

  /** Emit mỗi khi giá trị form thay đổi */
  formChange = output<Record<string, unknown>>();
  /** Emit khi user submit (nếu dùng built-in submit button) */
  formSubmit = output<Record<string, unknown>>();

  formGroup: FormGroup = new FormGroup({});
  readonly FieldType = FieldType;

  activeTabs: Record<string, string> = {};

  get meta() {
    return this.schema().meta || {};
  }

  get panels(): any[] {
    return this.meta.panels || [];
  }

  get rootItems(): any[] {
    if (this.meta.rootItems) {
      return this.meta.rootItems;
    }
    const items: any[] = [];
    const rootPanels = this.meta.rootPanelOrder || [];
    const topFields = this.meta.topLevelFieldOrder || [];
    rootPanels.forEach((id: string) => items.push({ kind: 'panel', id }));
    topFields.forEach((id: string) => items.push({ kind: 'field', id }));
    return items;
  }

  hasPanelLayout(): boolean {
    return this.panels.length > 0 && this.rootItems.length > 0;
  }

  getPanelById(id: string): any {
    return this.panels.find(p => p.id === id);
  }

  getFieldById(id: string): FormField | undefined {
    const f = this.schema().fields.find(x => x.id === id);
    if (f && f.type) {
      f.type = f.type.toUpperCase() as FieldType;
    }
    return f;
  }

  getPanelCols(panel: any): number {
    const mode = this.previewMode() || 'desktop';
    if (mode === 'mobile') return 1;
    return 12; // Always use 12-column layout grid on desktop and tablet
  }

  getPanelColSpan(panel: any): number {
    const mode = this.previewMode() || 'desktop';
    const layout = panel.layout;
    if (!layout) return 12;
    if (mode === 'mobile') return 12;
    if (mode === 'tablet') return layout.tablet?.colSpan ?? 12;
    return layout.desktop?.colSpan ?? 12;
  }

  getColumnSpan(col: any, panel: any): number {
    const mode = this.previewMode() || 'desktop';
    if (mode === 'mobile') return 1;
    return col.colSpan || 12;
  }

  getActiveColumns(panel: any): any[] {
    if (panel.type === 'tab' && panel.tabs) {
      const activeTabId = this.getActiveTabId(panel);
      const active = panel.tabs.find((t: any) => t.id === activeTabId) ?? panel.tabs[0];
      return active?.columns ?? [];
    }
    return panel.columns || [];
  }

  getPanelGridStyle(panel: any): Record<string, string> {
    const cols = this.getActiveColumns(panel);
    if (!cols.length) return {};
    return { 'grid-template-columns': cols.map(c => `${c.colSpan}fr`).join(' ') };
  }

  setActiveTab(panelId: string, tabId: string): void {
    this.activeTabs[panelId] = tabId;
  }

  getActiveTabId(panel: any): string {
    if (!panel.tabs || panel.tabs.length === 0) return '';
    if (!this.activeTabs[panel.id]) {
      this.activeTabs[panel.id] = panel.activeTabId || panel.tabs[0].id;
    }
    return this.activeTabs[panel.id];
  }

  private conditionSub?: Subscription;
  private changeSub?: Subscription;

  ngOnInit(): void {
    // Normalize field types to uppercase
    (this.schema().fields || []).forEach(f => {
      if (f.type) f.type = f.type.toUpperCase() as FieldType;
    });

    const external = this.externalFormGroup();
    if (external) {
      this.formGroup = external;
    } else {
      this.formGroup = this.formEngine.buildFormGroup(this.schema());
    }

    if (this.readOnly()) {
      this.formGroup.disable({ emitEvent: false });
    }

    // Áp dụng conditional rules
    this.conditionSub = this.formEngine.applyConditionalRules(this.schema(), this.formGroup);

    // Emit valueChanges ra ngoài
    this.changeSub = this.formGroup.valueChanges.subscribe(() => {
      this.formChange.emit(
        this.formEngine.serializeFormValue(this.schema(), this.formGroup),
      );
    });
  }

  ngOnDestroy(): void {
    this.conditionSub?.unsubscribe();
    this.changeSub?.unsubscribe();
  }

  /** Lấy FormControl theo tên field */
  getControl(fieldName: string): FormControl {
    return (this.formGroup?.get(fieldName) as FormControl) || new FormControl();
  }

  /** Kiểm tra field có bị ẩn (disabled bởi conditional rule) không */
  isFieldVisible(field: FormField): boolean {
    const ctrl = this.formGroup.get(field.name);
    return !ctrl?.disabled || !!field.readOnly;
  }

  /** Lấy error message đầu tiên của field */
  getErrorMessage(field: FormField): string {
    const ctrl = this.getControl(field.name);
    if (!ctrl || !ctrl.invalid || (!ctrl.dirty && !ctrl.touched)) return '';
    return this.formEngine.getFirstErrorMessage(ctrl, this.schema(), field.name);
  }

  /** Tính col span class theo previewMode */
  getColSpanClass(field: FormField): string {
    const layout = field.layout;
    if (!layout) return 'col-span-12';

    const mode = this.previewMode();
    if (mode === 'mobile') {
      return `col-span-${layout.colSpanMobile ?? 12}`;
    }
    if (mode === 'tablet') {
      return `col-span-${layout.colSpanTablet ?? layout.colSpanDesktop ?? 12}`;
    }
    // Desktop (default)
    const desktop = layout.colSpanDesktop ?? 12;
    const tablet  = layout.colSpanTablet  ?? desktop;
    const mobile  = layout.colSpanMobile  ?? 12;
    return `col-span-${mobile} sm:col-span-${tablet} lg:col-span-${desktop}`;
  }

  onSubmit(): void {
    this.formGroup.markAllAsTouched();
    if (this.formGroup.valid) {
      this.formSubmit.emit(
        this.formEngine.serializeFormValue(this.schema(), this.formGroup, true),
      );
    }
  }
}
