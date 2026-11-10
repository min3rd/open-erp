import {
  Component,
  ElementRef,
  Input,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { firstValueFrom, forkJoin } from 'rxjs';
import {
  I18nService,
  IconComponent,
  SharpButtonComponent,
  TranslatePipe,
} from '@shared';
import { FormDocument, FormItem, FormLayoutConfig, FormOption, FormStructureMode, GridColumnDef, GridColumnOption } from './form.model';
import { FormService } from './form.service';
import { evaluateColumnSummary, evaluateRowFormula, formatGridNumber } from './grid-formula.util';

export interface FillStepGroup {
  index: number;
  title: string;
  description?: string;
  container?: FormItem | null;
  items: FormItem[];
}

interface UploadedFile {
  file_id: string;
  url: string;
  original_name: string;
}

/**
 * Public fill renderer (op-form-fill, route /public/forms/{tenant}/{slug} —
 * ADR-S08-003). Renders the published document snapshot, applies forward-only
 * skip logic client-side and submits idempotently.
 */
@Component({
  selector: 'app-form-fill',
  standalone: true,
  imports: [FormsModule, TranslatePipe, IconComponent, SharpButtonComponent],
  templateUrl: './form-fill.component.html',
})
export class FormFillComponent implements OnInit {
  private host = inject<ElementRef<HTMLElement>>(ElementRef);
  private api = inject(FormService);
  private http = inject(HttpClient);
  private i18n = inject(I18nService);

  @Input() formSlug = '';
  @Input() tenantSlug = '';
  @Input() pluginToken = '';

  readonly title = signal('');
  readonly description = signal('');
  readonly items = signal<FormItem[]>([]);
  readonly answers = signal<Record<string, unknown>>({});
  readonly visibleRefs = signal<Set<string>>(new Set());
  readonly submitted = signal<string>('');
  readonly error = signal('');
  readonly busy = signal(false);
  readonly loading = signal(true);
  readonly forceSubmit = signal(false);
  readonly email = signal('');
  readonly invalidRefs = signal<Set<string>>(new Set());
  readonly uploadingRef = signal('');
  readonly fileError = signal('');
  readonly layoutMode = signal<FormStructureMode>('SECTION');
  readonly currentStepIndex = signal(0);

  readonly isWizard = computed(() => this.layoutMode() === 'STEP' || this.layoutMode() === 'PAGE');

  readonly stepGroups = computed<FillStepGroup[]>(() => {
    const all = this.items();
    const mode = this.layoutMode();
    if (mode !== 'STEP' && mode !== 'PAGE') {
      return [];
    }
    const containerType = mode;
    const groups: FillStepGroup[] = [];
    let current: FillStepGroup | null = null;

    for (const item of all) {
      if (item.type === containerType || item.type === 'STEP' || item.type === 'PAGE') {
        current = {
          index: groups.length,
          title: item.title || `${mode === 'STEP' ? 'Bước' : 'Trang'} ${groups.length + 1}`,
          description: item.description,
          container: item,
          items: [],
        };
        groups.push(current);
      } else {
        if (!current) {
          current = {
            index: 0,
            title: `${mode === 'STEP' ? 'Bước' : 'Trang'} 1`,
            description: '',
            container: null,
            items: [],
          };
          groups.push(current);
        }
        current.items.push(item);
      }
    }
    return groups.length > 0
      ? groups
      : [
          {
            index: 0,
            title: `${mode === 'STEP' ? 'Bước' : 'Trang'} 1`,
            container: null,
            items: all.filter((i) => !this.isContainer(i)),
          },
        ];
  });

  readonly currentStep = computed(() => {
    const g = this.stepGroups();
    return g[this.currentStepIndex()] ?? g[0];
  });

  readonly totalSteps = computed(() => this.stepGroups().length);
  readonly isFirstStep = computed(() => this.currentStepIndex() === 0);
  readonly isLastStep = computed(() => this.currentStepIndex() >= this.totalSteps() - 1);

  readonly activeItems = computed<FormItem[]>(() => {
    if (this.isWizard()) {
      return this.currentStep()?.items ?? [];
    }
    return this.items();
  });

  readonly layoutConfig = signal<FormLayoutConfig>({ columns: 2, mode: 'SECTION' });

  readonly currentCols = computed<number>(() => {
    if (this.isWizard()) {
      const cur = this.currentStep();
      const containerCols = cur?.container?.grid_columns;
      if (containerCols) return containerCols;
    }
    return (this.layoutConfig().columns ?? 2) as number;
  });

  fieldSpan(item: FormItem): number {
    const maxCols = this.currentCols();
    if (item.type === 'MATRIX' || item.type === 'GRID' || item.type === 'LONG_TEXT' || item.type === 'FILE_UPLOAD') {
      return item.col_span ? Math.min(item.col_span, maxCols) : maxCols;
    }
    return Math.min(item.col_span ?? 1, maxCols);
  }

  ngOnInit(): void {
    if (!this.formSlug) {
      this.formSlug = this.host.nativeElement.getAttribute('form-slug') ?? '';
    }
    if (!this.pluginToken) {
      this.pluginToken = this.host.nativeElement.getAttribute('plugin-token') ?? '';
    }
    // BUG-177 fix: the public page has no plugin-host i18n bootstrap — load the
    // dictionary from the plugin runtime path and register it with the shared
    // service before rendering translated labels.
    void this.loadDictionary().then(() => {
      this.api.publicView(this.formSlug, this.pluginToken).subscribe({
        next: (result) => {
          const data = (result.data ?? {}) as Record<string, unknown>;
          this.title.set(String(data['title'] ?? ''));
          this.description.set(String(data['description'] ?? ''));
          const document = (data['document'] ?? { items: [] }) as FormDocument;
          this.layoutConfig.set(document.layout ?? { columns: 2, mode: 'SECTION' });
          const declaredMode = document.layout?.mode;
          if (declaredMode === 'PAGE' || declaredMode === 'STEP') {
            this.layoutMode.set(declaredMode);
          } else if (document.items?.some((i) => i.type === 'STEP')) {
            this.layoutMode.set('STEP');
          } else if (document.items?.some((i) => i.type === 'PAGE')) {
            this.layoutMode.set('PAGE');
          } else {
            this.layoutMode.set('SECTION');
          }
          this.items.set(document.items ?? []);
          void this.resolveDynamicOptions(document.items ?? []);
          this.recomputeVisibility();
          this.loading.set(false);
        },
        error: (err) => {
          this.loading.set(false);
          this.error.set(err?.error?.code ?? 'PLUGIN_FORM_FILL_UNAVAILABLE');
        },
      });
    });
  }

  private async loadDictionary(): Promise<void> {
    const lang = (navigator.language || 'vi').startsWith('vi') ? 'vi' : 'en';
    try {
      const dict = await firstValueFrom(
        this.http.get<Record<string, string>>(
          `/api/v1/plugins/runtime/form/i18n/${lang}.json?plugin_token=${encodeURIComponent(this.pluginToken)}`,
        ),
      );
      if (dict) {
        this.i18n.setDictionary(lang as never, dict);
        this.i18n.setLanguage(lang as never);
      }
    } catch {
      // Labels fall back to keys; the form stays functional.
    }
  }

  private async resolveDynamicOptions(items: FormItem[]): Promise<void> {
    const next = [...items];
    let changed = false;
    for (let i = 0; i < next.length; i++) {
      const item = next[i];
      if (item.type === 'GRID') {
        const cols = item.columns_def ?? [];
        let colsChanged = false;
        const nextCols = [...cols];
        for (let cIdx = 0; cIdx < nextCols.length; cIdx++) {
          const col = nextCols[cIdx];
          if (col.type === 'SELECT') {
            if (col.option_source === 'CATALOG' && col.catalog_type) {
              try {
                const res = await firstValueFrom(this.api.getCatalogOptions(col.catalog_type, this.pluginToken));
                const raw = res?.data?.items ?? [];
                if (Array.isArray(raw) && raw.length > 0) {
                  const opts = raw.map((x: any) => ({
                    value: String(x.code ?? x.id ?? x.value),
                    label: String(x.name ?? x.label ?? x.title ?? x.code ?? x.value),
                    parent_code: x.parent_code ? String(x.parent_code) : (x.parent ? String(x.parent) : undefined),
                  }));
                  nextCols[cIdx] = { ...col, options: opts };
                  colsChanged = true;
                }
              } catch {
                /* keep existing */
              }
            } else if (col.option_source === 'EXTERNAL_API' && col.api_url) {
              try {
                const method = col.api_method || 'GET';
                const data: any = await firstValueFrom(this.api.testExternalApi(col.api_url, method));
                let raw: any[] = [];
                if (col.api_items_path) {
                  const parts = col.api_items_path.split('.');
                  let cur = data;
                  for (const p of parts) cur = cur?.[p];
                  raw = Array.isArray(cur) ? cur : [];
                } else if (Array.isArray(data)) {
                  raw = data;
                } else if (Array.isArray(data?.items)) {
                  raw = data.items;
                } else if (Array.isArray(data?.data)) {
                  raw = data.data;
                }
                const valKey = col.api_value_key || 'id';
                const lblKey = col.api_label_key || 'name';
                const opts = raw.map((x: any) => ({
                  value: String(x[valKey] ?? x['value'] ?? x['code'] ?? JSON.stringify(x)),
                  label: String(x[lblKey] ?? x['label'] ?? x['title'] ?? x[valKey] ?? 'Option'),
                }));
                if (opts.length > 0) {
                  nextCols[cIdx] = { ...col, options: opts };
                  colsChanged = true;
                }
              } catch {
                /* keep existing */
              }
            }
          }
        }
        if (colsChanged) {
          next[i] = { ...item, columns_def: nextCols };
          changed = true;
        }
      } else if (item.type === 'SINGLE_CHOICE' || item.type === 'MULTI_CHOICE' || item.type === 'DROPDOWN') {
        if (item.option_source === 'CATALOG' && item.catalog_type) {
          try {
            const res = await firstValueFrom(this.api.getCatalogOptions(item.catalog_type, this.pluginToken));
            const raw = res?.data?.items ?? [];
            if (Array.isArray(raw) && raw.length > 0) {
              const opts = raw.map((x: any) => ({
                value: String(x.code ?? x.id ?? x.value),
                label: String(x.name ?? x.label ?? x.title ?? x.code ?? x.value),
                parent_code: x.parent_code ? String(x.parent_code) : undefined,
              }));
              next[i] = { ...item, options: opts };
              changed = true;
            }
          } catch {
            /* keep existing options */
          }
        } else if (item.option_source === 'EXTERNAL_API' && item.api_url) {
          try {
            const method = item.api_method || 'GET';
            const data: any = await firstValueFrom(this.api.testExternalApi(item.api_url, method));
            let raw: any[] = [];
            if (item.api_items_path) {
              const parts = item.api_items_path.split('.');
              let cur = data;
              for (const p of parts) {
                cur = cur?.[p];
              }
              raw = Array.isArray(cur) ? cur : [];
            } else if (Array.isArray(data)) {
              raw = data;
            } else if (Array.isArray(data?.items)) {
              raw = data.items;
            } else if (Array.isArray(data?.data)) {
              raw = data.data;
            }
            const valKey = item.api_value_key || 'id';
            const lblKey = item.api_label_key || 'name';
            const opts = raw.map((x: any) => ({
              value: String(x[valKey] ?? x['value'] ?? x['code'] ?? JSON.stringify(x)),
              label: String(x[lblKey] ?? x['label'] ?? x['title'] ?? x[valKey] ?? 'Option'),
            }));
            if (opts.length > 0) {
              next[i] = { ...item, options: opts };
              changed = true;
            }
          } catch {
            /* keep existing options */
          }
        }
      }
    }
    if (changed) {
      this.items.set(next);
      this.recomputeVisibility();
    }
  }

  isContainer(item: FormItem): boolean {
    return item.type === 'SECTION' || item.type === 'PAGE' || item.type === 'STEP';
  }

  readonly visibleQuestions = computed(() =>
    this.items().filter((item) => !this.isContainer(item) && this.isVisible(item)),
  );

  readonly answeredCount = computed(
    () => this.visibleQuestions().filter((item) => this.hasAnswer(item)).length,
  );

  readonly progressPercent = computed(() => {
    const total = this.visibleQuestions().length;
    return total === 0 ? 0 : Math.round((this.answeredCount() / total) * 100);
  });

  recomputeVisibility(): void {
    const answers = this.answers();
    const visible = new Set<string>();
    let forceSubmit = false;
    for (const item of this.items()) {
      if (this.isContainer(item)) {
        continue;
      }
      const ref = item.ref ?? '';
      visible.add(ref);
      const chosen = item.options?.find((option) => option.value === answers[ref]);
      if (chosen?.logic) {
        if (chosen.logic.action === 'SUBMIT_FORM') {
          forceSubmit = true;
        }
        // GOTO_REF: hide everything strictly between this item and the target
        // (forward-only by validation); the target itself stays visible.
        const targetIndex = this.items().findIndex(
          (candidate) => candidate.ref === chosen.logic?.goto_ref,
        );
        const currentIndex = this.items().indexOf(item);
        if (targetIndex > currentIndex) {
          for (let between = currentIndex + 1; between < targetIndex; between++) {
            const skipped = this.items()[between];
            if (skipped.ref) {
              visible.delete(skipped.ref);
            }
          }
        }
      }
    }
    this.visibleRefs.set(visible);
    this.forceSubmit.set(forceSubmit);
  }

  isVisible(item: FormItem): boolean {
    return !item.ref || this.visibleRefs().has(item.ref);
  }

  setAnswer(ref: string, value: unknown): void {
    const nextAnswers = { ...this.answers(), [ref]: value };
    // Cascading child filter reset: if any item depends on this ref, check validity
    for (const item of this.items()) {
      if (item.depends_on === ref && item.ref) {
        const curChildVal = String(nextAnswers[item.ref] ?? '');
        if (curChildVal) {
          const validChildOptions = this.computeFilteredOptions(item, nextAnswers);
          if (!validChildOptions.some((o) => o.value === curChildVal)) {
            delete nextAnswers[item.ref];
          }
        }
      }
      // Cascading reset for grid columns depending on outer form item ref
      if (item.type === 'GRID' && item.ref) {
        const rows = this.gridRows[item.ref];
        if (Array.isArray(rows)) {
          let rowChanged = false;
          for (const col of this.gridColumns(item)) {
            if (col.depends_on === ref) {
              for (const row of rows) {
                const curVal = String(row[col.key] ?? '').trim();
                if (curVal) {
                  const valid = this.getGridColumnOptions(item, row, col);
                  if (!valid.some((o) => o.value === curVal)) {
                    row[col.key] = '';
                    rowChanged = true;
                  }
                }
              }
            }
          }
          if (rowChanged) {
            this.syncGridAnswer(item);
          }
        }
      }
    }
    this.answers.set(nextAnswers);
    this.recomputeVisibility();
  }

  filteredOptions(item: FormItem): FormOption[] {
    return this.computeFilteredOptions(item, this.answers());
  }

  private computeFilteredOptions(item: FormItem, answers: Record<string, unknown>): FormOption[] {
    const all = item.options ?? [];
    if (!item.depends_on) {
      return all;
    }
    const parentVal = String(answers[item.depends_on] ?? '').trim();
    if (!parentVal) {
      return [];
    }
    const key = item.parent_filter_key || 'parent_code';
    return all.filter((opt: any) => String(opt[key] ?? opt.parent_code ?? '') === parentVal);
  }

  nextStep(): void {
    const cur = this.currentStep();
    if (!cur) return;
    const missing = cur.items.filter(
      (item) => !this.isContainer(item) && this.isVisible(item) && item.required && !this.hasAnswer(item),
    );
    if (missing.length > 0) {
      const missingRefs = new Set(missing.map((item) => item.ref as string));
      this.invalidRefs.set(missingRefs);
      this.error.set('PLUGIN_FORM_FILL_REQUIRED');
      const first = missing[0].ref;
      if (first) {
        document.getElementById(`fill-${first}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }
    this.invalidRefs.set(new Set());
    this.error.set('');
    if (this.currentStepIndex() < this.totalSteps() - 1) {
      this.currentStepIndex.update((idx) => idx + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  prevStep(): void {
    if (this.currentStepIndex() > 0) {
      this.invalidRefs.set(new Set());
      this.error.set('');
      this.currentStepIndex.update((idx) => idx - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  goToStep(index: number): void {
    if (index === this.currentStepIndex()) return;
    if (index < this.currentStepIndex()) {
      this.invalidRefs.set(new Set());
      this.error.set('');
      this.currentStepIndex.set(index);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      this.nextStep();
    }
  }

  answerOf(item: FormItem): unknown {
    return item.ref ? this.answers()[item.ref] : undefined;
  }

  textAnswer(item: FormItem): string {
    const value = this.answerOf(item);
    return value == null ? '' : String(value);
  }

  isSelected(item: FormItem, optionValue: string): boolean {
    return this.answerOf(item) === optionValue;
  }

  isMultiSelected(item: FormItem, optionValue: string): boolean {
    const value = this.answerOf(item);
    return Array.isArray(value) && value.includes(optionValue);
  }

  toggleMulti(item: FormItem, optionValue: string, checked: boolean): void {
    if (!item.ref) {
      return;
    }
    const current = this.answerOf(item);
    const values = Array.isArray(current) ? [...(current as string[])] : [];
    const next = checked
      ? [...new Set([...values, optionValue])]
      : values.filter((entry) => entry !== optionValue);
    this.setAnswer(item.ref, next);
  }

  matrixValue(item: FormItem, row: string): string {
    const value = this.answerOf(item);
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      return '';
    }
    return String((value as Record<string, unknown>)[row] ?? '');
  }

  setMatrix(item: FormItem, row: string, column: string): void {
    if (!item.ref) {
      return;
    }
    const current = this.answerOf(item);
    const matrix =
      current && typeof current === 'object' && !Array.isArray(current)
        ? { ...(current as Record<string, string>) }
        : {};
    matrix[row] = column;
    this.setAnswer(item.ref, matrix);
  }

  private gridRows: Record<string, Array<Record<string, any>>> = {};

  gridColumns(item: FormItem): GridColumnDef[] {
    if (item.columns_def && item.columns_def.length > 0) {
      return item.columns_def;
    }
    if (item.columns && item.columns.length > 0) {
      return item.columns.map((c, idx) => ({
        key: `col_${idx + 1}`,
        label: c,
        type: 'TEXT',
        summary: 'NONE',
      }));
    }
    return [
      { key: 'item', label: 'Tên hàng / Mục', type: 'TEXT' },
      { key: 'qty', label: 'Số lượng', type: 'NUMBER', summary: 'SUM' },
      { key: 'price', label: 'Đơn giá', type: 'NUMBER' },
      { key: 'total', label: 'Thành tiền', type: 'FORMULA', formula: 'qty * price', summary: 'SUM' },
    ];
  }

  getColumnOptions(col: GridColumnDef): Array<{ value: string; label: string }> {
    if (!col.options || col.options.length === 0) return [];
    return col.options.map((opt) => {
      if (typeof opt === 'string') return { value: opt, label: opt };
      return { value: opt.value, label: opt.label || opt.value };
    });
  }

  getGridRows(item: FormItem): Array<Record<string, any>> {
    if (!item.ref) return [];
    if (!this.gridRows[item.ref]) {
      this.initGrid(item);
    }
    return this.gridRows[item.ref] ?? [];
  }

  private initGrid(item: FormItem): void {
    if (!item.ref) return;
    const existing = this.answers()[item.ref];
    if (Array.isArray(existing) && existing.length > 0) {
      this.gridRows[item.ref] = existing as Array<Record<string, any>>;
      return;
    }
    const rowCount = Math.max(item.default_rows ?? 2, 1);
    const initialRows: Array<Record<string, any>> = [];
    for (let i = 0; i < rowCount; i++) {
      initialRows.push(this.newEmptyRow(item));
    }
    this.gridRows[item.ref] = initialRows;
    this.syncGridAnswer(item);
  }

  private newEmptyRow(item: FormItem): Record<string, any> {
    const row: Record<string, any> = {};
    for (const col of this.gridColumns(item)) {
      row[col.key] = col.type === 'NUMBER' ? '' : (col.type === 'DATE' ? '' : '');
    }
    return row;
  }

  addGridRow(item: FormItem): void {
    if (!item.ref) return;
    const rows = this.getGridRows(item);
    rows.push(this.newEmptyRow(item));
    this.gridRows[item.ref] = [...rows];
    this.syncGridAnswer(item);
  }

  removeGridRow(item: FormItem, index: number): void {
    if (!item.ref) return;
    const rows = this.getGridRows(item);
    const minRows = item.min_rows ?? 1;
    if (rows.length <= minRows) return;
    rows.splice(index, 1);
    this.gridRows[item.ref] = [...rows];
    this.syncGridAnswer(item);
  }

  onGridCellChange(item: FormItem, row: Record<string, any>, col: GridColumnDef, value: any): void {
    if (!item.ref) return;
    row[col.key] = value;
    const cols = this.gridColumns(item);

    // Cascading child reset for other columns in this row that depend on col.key
    for (const child of cols) {
      if (child.depends_on === col.key) {
        const curChildVal = String(row[child.key] ?? '').trim();
        if (curChildVal) {
          const validOpts = this.getGridColumnOptions(item, row, child);
          if (!validOpts.some((o) => o.value === curChildVal)) {
            row[child.key] = '';
            // Reset grandchildren
            for (const grand of cols) {
              if (grand.depends_on === child.key) {
                row[grand.key] = '';
              }
            }
          }
        }
      }
    }

    for (const c of cols) {
      if (c.type === 'FORMULA') {
        row[c.key] = evaluateRowFormula(c.formula, row, cols);
      }
    }
    this.syncGridAnswer(item);
  }

  getGridColumnOptions(item: FormItem, row: Record<string, any>, col: GridColumnDef): FormOption[] {
    const raw = col.options ?? [];
    const all: FormOption[] = raw.map((opt: any) => {
      if (typeof opt === 'string') return { value: opt, label: opt };
      return {
        value: String(opt.value),
        label: String(opt.label || opt.value),
        parent_code: opt.parent_code ? String(opt.parent_code) : undefined,
      };
    });
    if (!col.depends_on) {
      return all;
    }
    let parentVal = '';
    if (row && col.depends_on in row) {
      parentVal = String(row[col.depends_on] ?? '').trim();
    } else if (col.depends_on in this.answers()) {
      parentVal = String(this.answers()[col.depends_on] ?? '').trim();
    }
    if (!parentVal) {
      return [];
    }
    const key = col.parent_filter_key || 'parent_code';
    return all.filter((opt: any) => String(opt[key] ?? opt.parent_code ?? '') === parentVal);
  }

  isGridColumnLocked(item: FormItem, row: Record<string, any>, col: GridColumnDef): boolean {
    if (!col.depends_on) return false;
    let parentVal = '';
    if (row && col.depends_on in row) {
      parentVal = String(row[col.depends_on] ?? '').trim();
    } else if (col.depends_on in this.answers()) {
      parentVal = String(this.answers()[col.depends_on] ?? '').trim();
    }
    return !parentVal;
  }

  syncGridAnswer(item: FormItem): void {
    if (!item.ref) return;
    const rows = this.gridRows[item.ref] ?? [];
    const cols = this.gridColumns(item);
    for (const row of rows) {
      for (const col of cols) {
        if (col.type === 'FORMULA') {
          row[col.key] = evaluateRowFormula(col.formula, row, cols);
        }
      }
    }
    this.setAnswer(item.ref, [...rows]);
  }

  gridRowFormulaValue(item: FormItem, row: Record<string, any>, col: GridColumnDef): string {
    const val = evaluateRowFormula(col.formula, row, this.gridColumns(item));
    return formatGridNumber(val);
  }

  gridColSummaryValue(item: FormItem, col: GridColumnDef): string {
    const rows = this.getGridRows(item);
    return evaluateColumnSummary(col, rows, this.gridColumns(item));
  }

  ratingMax(item: FormItem): number {
    const points = Number(item.grading?.points ?? 5);
    return Number.isFinite(points) && points > 0 ? Math.min(Math.round(points), 10) : 5;
  }

  ratingStars(item: FormItem): number[] {
    return Array.from({ length: this.ratingMax(item) }, (_, index) => index + 1);
  }

  ratingValue(item: FormItem): number {
    const value = Number(this.answerOf(item));
    return Number.isFinite(value) ? value : 0;
  }

  setRating(item: FormItem, value: number): void {
    if (item.ref) {
      this.setAnswer(item.ref, value);
    }
  }

  uploadedFiles(item: FormItem): UploadedFile[] {
    const value = this.answerOf(item);
    return Array.isArray(value) ? (value as UploadedFile[]) : [];
  }

  onFilesSelected(item: FormItem, event: Event): void {
    if (!item.ref) {
      return;
    }
    const input = event.target as HTMLInputElement;
    const files = Array.from(input.files ?? []);
    input.value = '';
    if (files.length === 0) {
      return;
    }
    const maxFiles = Number(item.file_limits?.max_files ?? 3);
    const maxBytes = Number(item.file_limits?.max_size_mb ?? 10) * 1024 * 1024;
    const current = this.uploadedFiles(item);
    this.fileError.set('');
    if (current.length + files.length > maxFiles) {
      this.fileError.set('PLUGIN_FORM_FILE_TOO_MANY');
      return;
    }
    const oversized = files.find((file) => file.size > maxBytes);
    if (oversized) {
      this.fileError.set('PLUGIN_FORM_FILE_TOO_LARGE');
      return;
    }
    this.uploadingRef.set(item.ref);
    forkJoin(files.map((file) => this.api.publicUpload(this.formSlug, this.pluginToken, file))).subscribe({
      next: (results) => {
        const uploaded = results
          .map((result) => result.data)
          .filter((entry): entry is UploadedFile => !!entry);
        this.setAnswer(item.ref as string, [...current, ...uploaded]);
        this.uploadingRef.set('');
      },
      error: () => {
        this.uploadingRef.set('');
        this.fileError.set('PLUGIN_FORM_FILL_SUBMIT_FAILED');
      },
    });
  }

  removeFile(item: FormItem, index: number): void {
    if (!item.ref) {
      return;
    }
    const next = this.uploadedFiles(item).filter((_, position) => position !== index);
    this.setAnswer(item.ref, next);
  }

  hasAnswer(item: FormItem): boolean {
    const value = this.answerOf(item);
    if (value == null || value === '') {
      return false;
    }
    if (Array.isArray(value)) {
      return value.length > 0;
    }
    if (typeof value === 'object') {
      return Object.keys(value).length > 0;
    }
    return true;
  }

  isInvalid(item: FormItem): boolean {
    return !!item.ref && this.invalidRefs().has(item.ref);
  }

  submit(): void {
    if (this.isWizard() && !this.isLastStep()) {
      this.nextStep();
      return;
    }
    const missing = this.visibleQuestions().filter((item) => item.required && !this.hasAnswer(item));
    if (missing.length > 0) {
      const missingRefs = new Set(missing.map((item) => item.ref as string));
      this.invalidRefs.set(missingRefs);
      this.error.set('PLUGIN_FORM_FILL_REQUIRED');
      const first = missing[0].ref;
      if (first) {
        document.getElementById(`fill-${first}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }
    this.invalidRefs.set(new Set());
    const answers: Record<string, unknown> = {};
    for (const item of this.visibleQuestions()) {
      if (item.ref && this.hasAnswer(item)) {
        answers[item.ref] = this.answerOf(item);
      }
    }
    this.busy.set(true);
    this.error.set('');
    const idempotencyKey =
      'fill:' + this.formSlug + ':' + Math.random().toString(36).slice(2) + Date.now().toString(36);
    const email = this.email().trim();
    this.api
      .publicSubmit(this.formSlug, this.pluginToken, {
        answers,
        responder_email: email || undefined,
        idempotency_key: idempotencyKey,
      })
      .subscribe({
        next: (result) => {
          this.busy.set(false);
          this.submitted.set(result.data?.id ?? '');
        },
        error: (err) => {
          this.busy.set(false);
          this.error.set(err?.error?.code ?? err?.code ?? 'PLUGIN_FORM_FILL_SUBMIT_FAILED');
        },
      });
  }
}
