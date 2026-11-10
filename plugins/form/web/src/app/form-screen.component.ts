import {
  Component,
  ElementRef,
  Input,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import {
  BadgeComponent,
  ColorVariant,
  DrawerComponent,
  I18nService,
  IconComponent,
  SelectOption,
  SharpButtonComponent,
  SharpInputComponent,
  SharpSelectComponent,
  SharpTextareaComponent,
  SharpToggleComponent,
  TabItem,
  TableColumn,
  TableComponent,
  TranslatePipe,
} from '@shared';
import {
  EntityRegistryEntry,
  FormContainerType,
  FormDefinition,
  FormEntityMapping,
  FormItem,
  FormItemType,
  FormLayoutConfig,
  FormLogicAction,
  FormOption,
  FormOptionSourceType,
  FormStructureMode,
  FormSummary,
  GridColumnDef,
  GridColumnType,
  GridSummaryType,
} from './form.model';
import { FormService } from './form.service';
import { evaluateColumnSummary, evaluateRowFormula, formatGridNumber } from './grid-formula.util';

interface PluginContext {
  theme?: string;
  language?: string;
  permissions?: string[];
  tenant?: { id: string; name: string } | null;
  user?: { id: string; name: string; email: string } | null;
  navigate?: (path: string) => void;
  notify?: (code: string) => void;
}

type FormTab = 'forms' | 'builder' | 'responses' | 'summary';

interface FormMetaDraft {
  slug: string;
  title: string;
  description: string;
}

export interface ContainerGroup {
  groupId: string;
  order: number;
  containerIndex: number | null;
  container: FormItem | null;
  containerType: FormContainerType;
  title: string;
  description: string;
  desktopCols: 1 | 2 | 3 | 4;
  mobileCols: 1 | 2;
  fields: Array<{ index: number; item: FormItem }>;
}

const CONTAINER_TYPES: FormContainerType[] = ['SECTION', 'PAGE', 'STEP'];

const FIELD_TYPES: FormItemType[] = [
  'SHORT_TEXT',
  'LONG_TEXT',
  'NUMBER',
  'DATE',
  'SINGLE_CHOICE',
  'MULTI_CHOICE',
  'DROPDOWN',
  'RATING',
  'MATRIX',
  'GRID',
  'FILE_UPLOAD',
];

const ITEM_TYPES: FormItemType[] = [...CONTAINER_TYPES, ...FIELD_TYPES];

const CHOICE_TYPES: FormItemType[] = ['SINGLE_CHOICE', 'MULTI_CHOICE', 'DROPDOWN'];

const FALLBACK_ENTITIES: EntityRegistryEntry[] = [
  {
    pluginId: 'employee',
    entityName: 'Employee',
    table: 'plg_emp_employees',
    storageType: 'postgres',
    schemaDefinition: {
      fields: ['code', 'full_name', 'work_email', 'personal_email', 'phone', 'job_title', 'department_id', 'branch_id', 'status'],
    },
  },
  {
    pluginId: 'catalog',
    entityName: 'CatalogItem',
    table: 'plg_cat_items',
    storageType: 'postgres',
    schemaDefinition: {
      fields: ['code', 'name', 'description', 'category_code', 'status'],
    },
  },
  {
    pluginId: 'org-structure',
    entityName: 'Department',
    table: 'departments',
    storageType: 'postgres',
    schemaDefinition: {
      fields: ['code', 'name', 'description', 'branch_id'],
    },
  },
];

@Component({
  selector: 'app-form-screen',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TranslatePipe,
    DrawerComponent,
    SharpButtonComponent,
    SharpInputComponent,
    SharpSelectComponent,
    SharpTextareaComponent,
    SharpToggleComponent,
    BadgeComponent,
    IconComponent,
    TableComponent,
  ],
  templateUrl: './form-screen.component.html',
})
export class FormScreenComponent implements OnInit {
  private host = inject<ElementRef<HTMLElement>>(ElementRef);
  private api = inject(FormService);
  private i18n = inject(I18nService);

  private _context: PluginContext | null = null;

  @Input()
  get context(): PluginContext | null {
    return this._context;
  }
  set context(val: PluginContext | null) {
    this._context = val;
    if (val?.language) {
      this.i18n.setLanguage(val.language as never);
    }
  }

  @Input()
  set language(lang: string | undefined) {
    if (lang) {
      this.i18n.setLanguage(lang as never);
    }
  }

  @Input() route = '';

  readonly tab = signal<FormTab>('forms');
  readonly forms = signal<FormDefinition[]>([]);
  readonly listLoading = signal(false);
  readonly listSearch = signal('');
  readonly statusFilter = signal('ALL');
  readonly addType = signal<FormItemType>('SHORT_TEXT');

  readonly containerTypes = CONTAINER_TYPES;
  readonly fieldTypes = FIELD_TYPES;

  // Builder Live Preview state
  readonly layoutConfig = signal<FormLayoutConfig>({
    mode: 'SECTION',
    columns: 2,
    mobile_columns: 1,
    row_gap: 'normal',
  });
  readonly previewViewport = signal<'desktop' | 'mobile'>('desktop');
  readonly activeContainerGroup = signal<number | 'ALL'>('ALL');
  readonly paletteDragType = signal<FormItemType | null>(null);
  readonly entityMapping = signal<Record<string, FormEntityMapping>>({});
  readonly registeredEntities = signal<EntityRegistryEntry[]>(FALLBACK_ENTITIES);
  readonly entitySearch = signal('');

  readonly publishedCount = computed(
    () => this.forms().filter((f) => f.publish_status === 'PUBLISHED').length,
  );
  readonly intakeRate = computed(() => {
    const total = this.forms().length;
    if (!total) return '0%';
    return `${Math.round((this.publishedCount() / total) * 100)}%`;
  });

  get permissions(): string[] {
    return this.context?.permissions ?? [];
  }

  can(permission: string): boolean {
    if (!this.permissions.length) {
      return true;
    }
    return (
      this.permissions.includes('*') ||
      this.permissions.includes('form:*') ||
      this.permissions.includes(permission)
    );
  }

  get screenTabs(): Array<{ key: FormTab; labelKey: string; icon: string; count?: number; disabled?: boolean }> {
    return [
      { key: 'forms', labelKey: 'PLUGIN_FORM_TAB_FORMS', icon: 'file-text', count: this.forms().length },
      {
        key: 'builder',
        labelKey: 'PLUGIN_FORM_TAB_BUILDER',
        icon: 'edit-2',
        count: this.selected() ? this.questionCount() : undefined,
        disabled: !this.selected(),
      },
      {
        key: 'responses',
        labelKey: 'PLUGIN_FORM_TAB_RESPONSES',
        icon: 'check',
        count: this.selected() ? this.responses().length : undefined,
        disabled: !this.selected(),
      },
      {
        key: 'summary',
        labelKey: 'PLUGIN_FORM_TAB_SUMMARY',
        icon: 'grid',
        disabled: !this.selected(),
      },
    ];
  }

  selectTab(key: FormTab): void {
    this.setTab(key);
  }

  readonly selected = signal<FormDefinition | null>(null);
  readonly items = signal<FormItem[]>([]);
  readonly selectedIndex = signal<number | null>(null);
  readonly slugInput = signal('');
  readonly titleInput = signal('');
  readonly descriptionInput = signal('');
  readonly dirty = signal(false);
  readonly saving = signal(false);

  readonly formDrawerOpen = signal(false);
  readonly editingForm = signal<FormDefinition | null>(null);
  readonly draft = signal<FormMetaDraft>({ slug: '', title: '', description: '' });

  readonly publishOpen = signal(false);
  readonly publishCaptcha = signal('none');
  readonly publishCloseAt = signal('');
  readonly publishLimit = signal('');
  readonly previewOpen = signal(false);

  readonly responses = signal<Record<string, unknown>[]>([]);
  readonly responsesLoading = signal(false);
  readonly responseSearch = signal('');
  readonly selectedResponse = signal<Record<string, unknown> | null>(null);

  readonly summary = signal<FormSummary | null>(null);
  readonly summaryLoading = signal(false);

  readonly error = signal('');
  readonly success = signal('');
  readonly busy = signal(false);
  readonly dragIndex = signal<number | null>(null);
  readonly dragOverIndex = signal<number | null>(null);

  readonly tabs = computed<TabItem[]>(() => [
    { id: 'forms', labelKey: 'PLUGIN_FORM_TAB_FORMS' },
    { id: 'builder', labelKey: 'PLUGIN_FORM_TAB_BUILDER' },
    { id: 'responses', labelKey: 'PLUGIN_FORM_TAB_RESPONSES' },
    { id: 'summary', labelKey: 'PLUGIN_FORM_TAB_SUMMARY' },
  ]);

  readonly statusOptions: SelectOption[] = [
    { value: 'ALL', labelKey: 'COMMON_ALL' },
    { value: 'DRAFT', labelKey: 'PLUGIN_FORM_STATUS_DRAFT' },
    { value: 'PUBLISHED', labelKey: 'PLUGIN_FORM_STATUS_PUBLISHED' },
    { value: 'CLOSED', labelKey: 'PLUGIN_FORM_STATUS_CLOSED' },
  ];

  readonly typeOptions: SelectOption[] = ITEM_TYPES.map((type) => ({
    value: type,
    labelKey: this.itemTypeKey(type),
  }));

  readonly structureModeOptions: SelectOption[] = [
    { value: 'SECTION', labelKey: 'PLUGIN_FORM_MODE_SECTION' },
    { value: 'PAGE', labelKey: 'PLUGIN_FORM_MODE_PAGE' },
    { value: 'STEP', labelKey: 'PLUGIN_FORM_MODE_STEP' },
  ];

  readonly desktopColOptions: SelectOption[] = [
    { value: '1', labelKey: 'PLUGIN_FORM_COLS_1' },
    { value: '2', labelKey: 'PLUGIN_FORM_COLS_2' },
    { value: '3', labelKey: 'PLUGIN_FORM_COLS_3' },
    { value: '4', labelKey: 'PLUGIN_FORM_COLS_4' },
  ];

  readonly mobileColOptions: SelectOption[] = [
    { value: '1', labelKey: 'PLUGIN_FORM_MOBILE_COLS_1' },
    { value: '2', labelKey: 'PLUGIN_FORM_MOBILE_COLS_2' },
  ];

  readonly colSpanOptions: SelectOption[] = [
    { value: '1', labelKey: 'PLUGIN_FORM_SPAN_1' },
    { value: '2', labelKey: 'PLUGIN_FORM_SPAN_2' },
    { value: '3', labelKey: 'PLUGIN_FORM_SPAN_3' },
    { value: '4', labelKey: 'PLUGIN_FORM_SPAN_4' },
  ];

  readonly rowSpanOptions: SelectOption[] = [
    { value: '1', labelKey: 'PLUGIN_FORM_ROW_SPAN_1' },
    { value: '2', labelKey: 'PLUGIN_FORM_ROW_SPAN_2' },
    { value: '3', labelKey: 'PLUGIN_FORM_ROW_SPAN_3' },
  ];

  readonly mobileSpanOptions: SelectOption[] = [
    { value: '1', labelKey: 'PLUGIN_FORM_MOBILE_SPAN_1' },
    { value: '2', labelKey: 'PLUGIN_FORM_MOBILE_SPAN_2' },
  ];

  readonly captchaOptions: SelectOption[] = [
    { value: 'none', labelKey: 'PLUGIN_FORM_CAPTCHA_NONE' },
    { value: 'recaptcha-v3', labelKey: 'PLUGIN_FORM_CAPTCHA_RECAPTCHA' },
  ];

  readonly logicActionOptions: SelectOption[] = [
    { value: '', labelKey: 'PLUGIN_FORM_LOGIC_NONE' },
    { value: 'GOTO_REF', labelKey: 'PLUGIN_FORM_LOGIC_GOTO' },
    { value: 'NEXT_SECTION', labelKey: 'PLUGIN_FORM_LOGIC_NEXT_SECTION' },
    { value: 'NEXT_PAGE', labelKey: 'PLUGIN_FORM_LOGIC_NEXT_PAGE' },
    { value: 'NEXT_STEP', labelKey: 'PLUGIN_FORM_LOGIC_NEXT_STEP' },
    { value: 'SUBMIT_FORM', labelKey: 'PLUGIN_FORM_LOGIC_SUBMIT' },
  ];

  readonly optionSourceOptions: SelectOption[] = [
    { value: 'STATIC', labelKey: 'PLUGIN_FORM_OPTION_SOURCE_STATIC' },
    { value: 'CATALOG', labelKey: 'PLUGIN_FORM_OPTION_SOURCE_CATALOG' },
    { value: 'EXTERNAL_API', labelKey: 'PLUGIN_FORM_OPTION_SOURCE_API' },
  ];

  readonly catalogTypes = signal<Array<{ code: string; name: string }>>([]);
  readonly catalogTypesLoading = signal<boolean>(false);

  readonly catalogTypeOptions = computed<SelectOption[]>(() => {
    const list = this.catalogTypes();
    if (list.length > 0) {
      return list.map((t) => ({
        value: t.code,
        label: `${t.name || t.code} (${t.code})`,
      }));
    }
    // Initial dynamic fallback until plugin types load
    return [
      { value: 'PROVINCE', label: 'Tỉnh / Thành phố (PROVINCE)' },
      { value: 'DISTRICT', label: 'Quận / Huyện (DISTRICT)' },
      { value: 'COMMUNE', label: 'Xã / Phường (COMMUNE)' },
      { value: 'DEPARTMENT', label: 'Phòng ban (DEPARTMENT)' },
      { value: 'JOB_TITLE', label: 'Chức danh (JOB_TITLE)' },
      { value: 'CONTRACT_TYPE', label: 'Loại hợp đồng (CONTRACT_TYPE)' },
      { value: 'EDUCATION_LEVEL', label: 'Trình độ học vấn (EDUCATION_LEVEL)' },
      { value: 'INDUSTRY', label: 'Ngành nghề (INDUSTRY)' },
      { value: 'SHIFT', label: 'Ca làm việc (SHIFT)' },
    ];
  });

  readonly apiMethodOptions: SelectOption[] = [
    { value: 'GET', label: 'GET' },
    { value: 'POST', label: 'POST' },
  ];

  readonly resolvedOptionsMap = signal<Record<string, FormOption[]>>({});
  readonly optionFetchStatus = signal<{ ref: string; loading: boolean; message: string; error?: boolean } | null>(null);

  potentialParentOptions(currentItem: FormItem): SelectOption[] {
    const opts: SelectOption[] = [
      {
        value: '',
        label: this.i18n.t('PLUGIN_FORM_DEPENDS_ON_NONE') || '-- Không phụ thuộc (Hiển thị tất cả) --',
      },
    ];
    for (const item of this.items()) {
      if (item !== currentItem && !this.isContainer(item) && item.ref) {
        opts.push({
          value: item.ref,
          label: `${item.label || item.ref} (${item.ref})`,
        });
      }
    }
    return opts;
  }

  readonly listColumns: TableColumn[] = [
    { key: 'title', labelKey: 'PLUGIN_FORM_FIELD_TITLE', width: '34%' },
    { key: 'status', labelKey: 'PLUGIN_FORM_STATUS', width: '12%' },
    { key: 'version', labelKey: 'PLUGIN_FORM_VERSION', width: '10%' },
    { key: 'updated', labelKey: 'PLUGIN_FORM_UPDATED_AT', width: '18%' },
    { key: 'actions', labelKey: 'COMMON_ACTIONS', align: 'right', width: '26%' },
  ];

  readonly responseColumns: TableColumn[] = [
    { key: 'submitted', labelKey: 'PLUGIN_FORM_RESPONSE_SUBMITTED', width: '36%' },
    { key: 'email', labelKey: 'PLUGIN_FORM_RESPONSE_EMAIL', width: '34%' },
    { key: 'version', labelKey: 'PLUGIN_FORM_VERSION', width: '12%' },
    { key: 'entity', labelKey: 'PLUGIN_FORM_RESPONSE_ENTITY', width: '18%' },
  ];

  readonly filteredForms = computed(() => {
    const term = this.listSearch().trim().toLowerCase();
    const status = this.statusFilter();
    return this.forms().filter((form) => {
      const matchesStatus = status === 'ALL' || form.publish_status === status;
      const matchesTerm =
        !term ||
        (form.title_text ?? '').toLowerCase().includes(term) ||
        (form.slug ?? '').toLowerCase().includes(term);
      return matchesStatus && matchesTerm;
    });
  });

  readonly selectedItem = computed<FormItem | null>(() => {
    const index = this.selectedIndex();
    return index == null ? null : this.items()[index] ?? null;
  });

  readonly selectedItemIsChoice = computed(() => {
    const item = this.selectedItem();
    return !!item && CHOICE_TYPES.includes(item.type);
  });

  /**
   * Groups flat `items()` into visual containers (`SECTION`, `PAGE`, `STEP`)
   * so the Builder Canvas renders a true multi-column WYSIWYG preview.
   */
  readonly containerGroups = computed<ContainerGroup[]>(() => {
    const all = this.items();
    const defaultMode = this.layoutConfig().mode ?? 'SECTION';
    const defaultDesktopCols = (this.layoutConfig().columns ?? 2) as 1 | 2 | 3 | 4;
    const defaultMobileCols = (this.layoutConfig().mobile_columns ?? 1) as 1 | 2;
    const groups: ContainerGroup[] = [];
    let current: ContainerGroup | null = null;

    for (let i = 0; i < all.length; i++) {
      const item = all[i];
      if (this.isContainer(item)) {
        current = {
          groupId: `grp-${i}`,
          order: groups.length + 1,
          containerIndex: i,
          container: item,
          containerType: item.type as FormContainerType,
          title: item.title || `${this.i18n.t(this.itemTypeKey(item.type))} ${groups.length + 1}`,
          description: item.description ?? '',
          desktopCols: (item.grid_columns ?? defaultDesktopCols) as 1 | 2 | 3 | 4,
          mobileCols: (item.mobile_columns ?? defaultMobileCols) as 1 | 2,
          fields: [],
        };
        groups.push(current);
      } else {
        if (!current) {
          current = {
            groupId: 'grp-root',
            order: 1,
            containerIndex: null,
            container: null,
            containerType: defaultMode,
            title: this.titleInput() || this.i18n.t('PLUGIN_FORM_NEW_SECTION'),
            description: this.descriptionInput() ?? '',
            desktopCols: defaultDesktopCols,
            mobileCols: defaultMobileCols,
            fields: [],
          };
          groups.push(current);
        }
        current.fields.push({ index: i, item });
      }
    }

    if (groups.length === 0) {
      groups.push({
        groupId: 'grp-empty',
        order: 1,
        containerIndex: null,
        container: null,
        containerType: defaultMode,
        title: this.titleInput() || this.i18n.t('PLUGIN_FORM_NEW_SECTION'),
        description: '',
        desktopCols: defaultDesktopCols,
        mobileCols: defaultMobileCols,
        fields: [],
      });
    }
    return groups;
  });

  readonly visibleContainerGroups = computed<ContainerGroup[]>(() => {
    const groups = this.containerGroups();
    const active = this.activeContainerGroup();
    if (active === 'ALL' || active < 0 || active >= groups.length) {
      return groups;
    }
    return [groups[active]];
  });

  readonly laterRefs = computed(() => {
    const index = this.selectedIndex();
    const all = this.items();
    if (index == null) {
      return [] as { ref: string; label: string }[];
    }
    return all
      .slice(index + 1)
      .filter((item) => !!item.ref)
      .map((item) => ({
        ref: item.ref as string,
        label: this.isContainer(item)
          ? `[${item.type}] ${item.title || item.ref}`
          : `${item.label || item.ref} (${item.ref})`,
      }));
  });

  readonly entityOptions = computed<SelectOption[]>(() => {
    const list = this.registeredEntities();
    return [
      { value: '', labelKey: 'PLUGIN_FORM_ENTITY_NONE' },
      ...list.map((entry) => ({
        value: `${entry.pluginId}:${entry.entityName}`,
        label: `${entry.entityName} (${entry.pluginId} · ${entry.table})`,
      })),
    ];
  });

  readonly filteredResponses = computed(() => {
    const term = this.responseSearch().trim().toLowerCase();
    if (!term) {
      return this.responses();
    }
    return this.responses().filter((response) =>
      Object.values(response).some((value) => String(value ?? '').toLowerCase().includes(term)),
    );
  });

  readonly questionCount = computed(
    () => this.items().filter((item) => !this.isContainer(item)).length,
  );

  readonly containerCount = computed(
    () => this.items().filter((item) => this.isContainer(item)).length,
  );

  readonly answeredRefs = computed(() => {
    const summary = this.summary();
    if (!summary) {
      return [] as { ref: string; label: string; type: FormItemType | 'UNKNOWN' }[];
    }
    const refs = new Set<string>();
    for (const key of Object.keys(summary.choice_counts ?? {})) {
      refs.add(key.split(':')[0]);
    }
    for (const key of Object.keys(summary.numeric_averages ?? {})) {
      refs.add(key);
    }
    return [...refs].map((ref) => {
      const item = this.findItemByRef(ref);
      return {
        ref,
        label: item?.label || ref,
        type: item?.type ?? 'UNKNOWN',
      };
    });
  });

  readonly summaryTotal = computed(() => this.summary()?.total_responses ?? 0);

  readonly publishLimitNumber = computed(() => {
    const raw = this.publishLimit().trim();
    if (!raw) {
      return null;
    }
    const parsed = Number(raw);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
  });

  ngOnInit(): void {
    if (this.context?.language) {
      this.i18n.setLanguage(this.context.language as never);
    }
    const origin = this.host.nativeElement.getAttribute('runtime-origin');
    if (origin) {
      this.api.setRuntimeOrigin(origin);
    }
    this.loadForms();
    this.loadRegisteredEntities();
    this.loadCatalogTypes();
  }

  loadCatalogTypes(): void {
    this.catalogTypesLoading.set(true);
    this.api.getCatalogTypes().subscribe({
      next: (res) => {
        const items = res.data?.items ?? [];
        if (items.length > 0) {
          this.catalogTypes.set(items);
        }
        this.catalogTypesLoading.set(false);
      },
      error: () => {
        this.catalogTypesLoading.set(false);
      },
    });
  }

  loadRegisteredEntities(): void {
    this.api.listRegisteredEntities().subscribe({
      next: (res) => {
        const items = res.data?.items ?? [];
        if (items.length > 0) {
          this.registeredEntities.set(items);
        }
      },
      error: () => {
        // Keep FALLBACK_ENTITIES if caller lacks core:plugin:read
      },
    });
  }

  // ------------------------------------------------------------------
  // Navigation
  // ------------------------------------------------------------------

  setTab(id: string): void {
    const next = id as FormTab;
    if (next !== 'forms' && !this.selected()) {
      return;
    }
    if (this.tab() === 'builder' && next !== 'builder' && this.dirty()) {
      const discard = window.confirm(this.i18n.t('PLUGIN_FORM_DISCARD_CONFIRM'));
      if (!discard) {
        return;
      }
      this.dirty.set(false);
    }
    this.tab.set(next);
    if (next === 'responses') {
      this.loadResponses();
    } else if (next === 'summary') {
      this.loadSummary();
    }
  }

  loadForms(): void {
    this.listLoading.set(true);
    this.api.list().subscribe({
      next: (result) => {
        this.listLoading.set(false);
        this.forms.set(result.data?.items ?? []);
      },
      error: () => {
        this.listLoading.set(false);
        this.error.set('PLUGIN_FORM_ERROR_LOAD');
      },
    });
  }

  // ------------------------------------------------------------------
  // Create / edit metadata drawer
  // ------------------------------------------------------------------

  openCreate(): void {
    this.editingForm.set(null);
    this.draft.set({ slug: '', title: '', description: '' });
    this.error.set('');
    this.formDrawerOpen.set(true);
  }

  editMeta(form: FormDefinition): void {
    this.editingForm.set(form);
    this.draft.set({
      slug: form.slug ?? '',
      title: form.title_text ?? '',
      description: form.description ?? '',
    });
    this.error.set('');
    this.formDrawerOpen.set(true);
  }

  closeFormDrawer(): void {
    this.formDrawerOpen.set(false);
  }

  patchDraft(patch: Partial<FormMetaDraft>): void {
    const current = this.draft();
    const next = { ...current, ...patch };
    if (patch.title !== undefined && !this.editingForm()) {
      const autoSlug = this.sanitizeSlug(patch.title);
      if (!current.slug || current.slug === this.sanitizeSlug(current.title)) {
        next.slug = autoSlug;
      }
    }
    this.draft.set(next);
  }

  saveMeta(): void {
    const draft = this.draft();
    if (!draft.title.trim() || !draft.slug.trim()) {
      this.error.set('PLUGIN_FORM_ERROR_REQUIRED');
      return;
    }
    const editing = this.editingForm();
    const payload: Record<string, unknown> = editing
      ? { title: draft.title.trim(), description: draft.description.trim() }
      : {
          slug: draft.slug.trim().toLowerCase(),
          title: draft.title.trim(),
          description: draft.description.trim(),
          document: defaultDocument(draft.title),
        };
    this.busy.set(true);
    this.error.set('');
    const request$ = editing ? this.api.update(editing.id, payload) : this.api.create(payload);
    request$.subscribe({
      next: (result) => {
        this.busy.set(false);
        this.formDrawerOpen.set(false);
        this.success.set('PLUGIN_FORM_SAVED');
        this.loadForms();
        if (!editing && result.data) {
          this.openForm(result.data);
        }
      },
      error: (err) => {
        this.busy.set(false);
        this.error.set(err?.code ?? 'PLUGIN_FORM_ERROR_SAVE');
      },
    });
  }

  // ------------------------------------------------------------------
  // Builder (Live Visual Preview + Multi-Column Grid + Containers)
  // ------------------------------------------------------------------

  openForm(form: FormDefinition, target: FormTab = 'builder'): void {
    this.api.get(form.id).subscribe({
      next: (result) => {
        const full = result.data ?? form;
        this.selected.set(full);
        this.slugInput.set(full.slug);
        this.titleInput.set(full.title_text ?? '');
        this.descriptionInput.set(full.description ?? '');
        const loadedItems = structuredClone(full.document?.items ?? []);
        this.items.set(loadedItems);
        const docLayout = full.document?.layout;
        const detectedMode: FormStructureMode =
          docLayout?.mode ??
          (loadedItems.some((i) => i.type === 'STEP')
            ? 'STEP'
            : loadedItems.some((i) => i.type === 'PAGE')
              ? 'PAGE'
              : 'SECTION');
        this.layoutConfig.set({
          mode: detectedMode,
          columns: (docLayout?.columns ?? 2) as 1 | 2 | 3 | 4,
          mobile_columns: (docLayout?.mobile_columns ?? 1) as 1 | 2,
          row_gap: docLayout?.row_gap ?? 'normal',
        });
        this.entityMapping.set(structuredClone(full.entity_mapping ?? {}));
        this.activeContainerGroup.set('ALL');
        const firstQuestionIdx = loadedItems.findIndex((i) => !this.isContainer(i));
        this.selectedIndex.set(firstQuestionIdx >= 0 ? firstQuestionIdx : loadedItems.length > 0 ? 0 : null);
        this.dirty.set(false);
        this.publishCaptcha.set(full.captcha ?? 'none');
        this.publishCloseAt.set(toLocalInput(full.close_at));
        this.publishLimit.set(full.response_limit ? String(full.response_limit) : '');
        this.tab.set(target);
        if (target === 'responses') {
          this.loadResponses();
        } else if (target === 'summary') {
          this.loadSummary();
        }
      },
      error: () => this.error.set('PLUGIN_FORM_ERROR_LOAD'),
    });
  }

  refreshSelected(): void {
    const form = this.selected();
    if (!form) {
      return;
    }
    this.openForm(form);
  }

  setStructureMode(mode: string): void {
    const validMode = (mode === 'PAGE' || mode === 'STEP' ? mode : 'SECTION') as FormStructureMode;
    this.layoutConfig.set({ ...this.layoutConfig(), mode: validMode });
    // Convert existing containers if user switches structure mode so preview reflects it immediately
    const next = this.items().map((item) =>
      this.isContainer(item) ? { ...item, type: validMode } : item,
    );
    this.items.set(next);
    this.dirty.set(true);
  }

  setDefaultDesktopCols(cols: string): void {
    const n = Math.min(Math.max(Number(cols) || 2, 1), 4) as 1 | 2 | 3 | 4;
    this.layoutConfig.set({ ...this.layoutConfig(), columns: n });
    const next = this.items().map((item) =>
      this.isContainer(item) ? { ...item, grid_columns: n } : item,
    );
    this.items.set(next);
    this.dirty.set(true);
  }

  setDefaultMobileCols(cols: string): void {
    const n = (Number(cols) === 2 ? 2 : 1) as 1 | 2;
    this.layoutConfig.set({ ...this.layoutConfig(), mobile_columns: n });
    const next = this.items().map((item) =>
      this.isContainer(item) ? { ...item, mobile_columns: n } : item,
    );
    this.items.set(next);
    this.dirty.set(true);
  }

  setContainerCols(containerIndex: number | null, desktopCols: 1 | 2 | 3 | 4): void {
    if (containerIndex == null) {
      this.setDefaultDesktopCols(String(desktopCols));
      return;
    }
    const next = [...this.items()];
    next[containerIndex] = { ...next[containerIndex], grid_columns: desktopCols };
    this.items.set(next);
    this.dirty.set(true);
  }

  setContainerMobileCols(containerIndex: number | null, mobileCols: 1 | 2): void {
    if (containerIndex == null) {
      this.setDefaultMobileCols(String(mobileCols));
      return;
    }
    const next = [...this.items()];
    next[containerIndex] = { ...next[containerIndex], mobile_columns: mobileCols };
    this.items.set(next);
    this.dirty.set(true);
  }

  addContainer(type?: FormContainerType): void {
    const containerType: FormContainerType = type ?? this.layoutConfig().mode ?? 'SECTION';
    const next = [...this.items()];
    const count = next.filter((i) => this.isContainer(i)).length + 1;
    const labelKey =
      containerType === 'PAGE'
        ? 'PLUGIN_FORM_NEW_PAGE'
        : containerType === 'STEP'
          ? 'PLUGIN_FORM_NEW_STEP'
          : 'PLUGIN_FORM_NEW_SECTION';
    next.push({
      type: containerType,
      ref: `${containerType.toLowerCase()}_${count}`,
      title: `${this.i18n.t(labelKey)} ${count}`,
      description: '',
      grid_columns: this.layoutConfig().columns ?? 2,
      mobile_columns: this.layoutConfig().mobile_columns ?? 1,
    });
    this.items.set(next);
    this.selectedIndex.set(next.length - 1);
    this.dirty.set(true);
  }

  addSection(): void {
    this.addContainer('SECTION');
  }

  addQuestion(type: FormItemType = 'SHORT_TEXT', targetContainerIndex?: number | null): void {
    if (this.isContainerType(type)) {
      this.addContainer(type as FormContainerType);
      return;
    }
    const next = [...this.items()];
    const question = this.buildNewField(type);
    let insertAt = next.length;

    if (targetContainerIndex != null && targetContainerIndex >= 0) {
      // Find the end of that container group
      insertAt = targetContainerIndex + 1;
      while (insertAt < next.length && !this.isContainer(next[insertAt])) {
        insertAt++;
      }
    }

    next.splice(insertAt, 0, question);
    this.items.set(next);
    this.selectedIndex.set(insertAt);
    this.dirty.set(true);
  }

  private buildNewField(type: FormItemType): FormItem {
    const ref = this.nextRef(type);
    const defaultLabel = `${this.i18n.t(this.itemTypeKey(type))} ${ref.split('_').pop()}`;
    const question: FormItem = {
      type,
      ref,
      label: defaultLabel,
      required: false,
      col_span: type === 'LONG_TEXT' || type === 'MATRIX' || type === 'GRID' || type === 'FILE_UPLOAD' ? 2 : 1,
      row_span: 1,
      mobile_span: 1,
    };
    if (CHOICE_TYPES.includes(type)) {
      question.option_source = 'STATIC';
      question.options = [
        { value: 'option_1', label: `${this.i18n.t('PLUGIN_FORM_OPTION_DEFAULT')} 1` },
        { value: 'option_2', label: `${this.i18n.t('PLUGIN_FORM_OPTION_DEFAULT')} 2` },
      ];
    }
    if (type === 'MATRIX') {
      question.rows = [`${this.i18n.t('PLUGIN_FORM_MATRIX_ROW_DEFAULT')} 1`, `${this.i18n.t('PLUGIN_FORM_MATRIX_ROW_DEFAULT')} 2`];
      question.columns = [`${this.i18n.t('PLUGIN_FORM_MATRIX_COLUMN_DEFAULT')} 1`, `${this.i18n.t('PLUGIN_FORM_MATRIX_COLUMN_DEFAULT')} 2`];
    }
    if (type === 'GRID') {
      question.col_span = 2;
      question.default_rows = 2;
      question.allow_add_row = true;
      question.allow_delete_row = true;
      question.columns_def = [
        { key: 'item', label: 'Tên hàng / Mục', type: 'TEXT' },
        { key: 'qty', label: 'Số lượng', type: 'NUMBER', summary: 'SUM' },
        { key: 'price', label: 'Đơn giá', type: 'NUMBER' },
        { key: 'total', label: 'Thành tiền', type: 'FORMULA', formula: 'qty * price', summary: 'SUM' },
      ];
      question.columns = question.columns_def.map((c) => c.label);
    }
    if (type === 'FILE_UPLOAD') {
      question.file_limits = { max_files: 3, max_size_mb: 10 };
    }
    if (type === 'RATING') {
      question.grading = { points: 5, correct: [] };
    }
    return question;
  }

  duplicateItem(index: number): void {
    const source = this.items()[index];
    if (!source) return;
    const copy = structuredClone(source);
    if (!this.isContainer(copy)) {
      copy.ref = this.nextRef(copy.type);
      copy.label = `${copy.label || copy.ref} (Copy)`;
    } else {
      copy.title = `${copy.title || ''} (Copy)`;
    }
    const next = [...this.items()];
    next.splice(index + 1, 0, copy);
    this.items.set(next);
    this.selectedIndex.set(index + 1);
    this.dirty.set(true);
  }

  setFieldColSpan(index: number, span: 1 | 2 | 3 | 4): void {
    const next = [...this.items()];
    if (!next[index]) return;
    next[index] = { ...next[index], col_span: span };
    this.items.set(next);
    this.selectedIndex.set(index);
    this.dirty.set(true);
  }

  setFieldMobileSpan(index: number, span: 1 | 2): void {
    const next = [...this.items()];
    if (!next[index]) return;
    next[index] = { ...next[index], mobile_span: span };
    this.items.set(next);
    this.selectedIndex.set(index);
    this.dirty.set(true);
  }

  toggleFieldRowBreak(index: number): void {
    const next = [...this.items()];
    if (!next[index]) return;
    next[index] = { ...next[index], row_break: !next[index].row_break };
    this.items.set(next);
    this.selectedIndex.set(index);
    this.dirty.set(true);
  }

  fieldGridStyle(item: FormItem, group: ContainerGroup): Record<string, string> {
    const isMobile = this.previewViewport() === 'mobile';
    const maxCols = isMobile ? group.mobileCols : group.desktopCols;
    const span = isMobile
      ? Math.min(item.mobile_span ?? 1, maxCols)
      : Math.min(item.col_span ?? 1, maxCols);
    const rowSpan = Math.min(Math.max(item.row_span ?? 1, 1), 3);
    const style: Record<string, string> = {
      'grid-column': item.row_break ? `1 / span ${span}` : `span ${span} / span ${span}`,
    };
    if (rowSpan > 1) {
      style['grid-row'] = `span ${rowSpan} / span ${rowSpan}`;
    }
    return style;
  }

  containerGridStyle(group: ContainerGroup): Record<string, string> {
    const cols = this.previewViewport() === 'mobile' ? group.mobileCols : group.desktopCols;
    return {
      display: 'grid',
      'grid-template-columns': `repeat(${cols}, minmax(0, 1fr))`,
      gap: '0.5rem',
    };
  }

  selectItem(index: number): void {
    this.selectedIndex.set(index);
  }

  deleteItem(index: number): void {
    const removed = this.items()[index];
    const next = [...this.items()];
    next.splice(index, 1);
    if (removed?.ref) {
      const mapping = { ...this.entityMapping() };
      delete mapping[removed.ref];
      this.entityMapping.set(mapping);
    }
    this.items.set(next);
    this.selectedIndex.set(next.length === 0 ? null : Math.min(index, next.length - 1));
    this.dirty.set(true);
  }

  moveItem(index: number, delta: number): void {
    const target = index + delta;
    if (target < 0 || target >= this.items().length) {
      return;
    }
    const next = [...this.items()];
    const [moved] = next.splice(index, 1);
    next.splice(target, 0, moved);
    this.items.set(next);
    this.selectedIndex.set(target);
    this.dirty.set(true);
  }

  // Palette & Canvas Drag-and-Drop
  onPaletteDragStart(type: FormItemType): void {
    this.paletteDragType.set(type);
    this.dragIndex.set(null);
  }

  onDragStart(index: number): void {
    this.paletteDragType.set(null);
    this.dragIndex.set(index);
  }

  onDragOver(event: DragEvent, index: number): void {
    event.preventDefault();
    this.dragOverIndex.set(index);
  }

  onDrop(targetIndex: number): void {
    const paletteType = this.paletteDragType();
    if (paletteType) {
      this.paletteDragType.set(null);
      this.dragOverIndex.set(null);
      const next = [...this.items()];
      if (this.isContainerType(paletteType)) {
        const count = next.filter((i) => this.isContainer(i)).length + 1;
        next.splice(targetIndex, 0, {
          type: paletteType,
          ref: `${paletteType.toLowerCase()}_${count}`,
          title: `${this.i18n.t(this.itemTypeKey(paletteType))} ${count}`,
          grid_columns: this.layoutConfig().columns ?? 2,
          mobile_columns: this.layoutConfig().mobile_columns ?? 1,
        });
      } else {
        next.splice(targetIndex, 0, this.buildNewField(paletteType));
      }
      this.items.set(next);
      this.selectedIndex.set(targetIndex);
      this.dirty.set(true);
      return;
    }

    const from = this.dragIndex();
    this.dragIndex.set(null);
    this.dragOverIndex.set(null);
    if (from == null || from === targetIndex) {
      return;
    }
    const next = [...this.items()];
    const [moved] = next.splice(from, 1);
    next.splice(targetIndex, 0, moved);
    this.items.set(next);
    this.selectedIndex.set(targetIndex);
    this.dirty.set(true);
  }

  onDropIntoContainer(group: ContainerGroup): void {
    const paletteType = this.paletteDragType();
    if (paletteType) {
      this.paletteDragType.set(null);
      this.dragOverIndex.set(null);
      this.addQuestion(paletteType, group.containerIndex);
      return;
    }
    const from = this.dragIndex();
    this.dragIndex.set(null);
    this.dragOverIndex.set(null);
    if (from == null) return;
    const next = [...this.items()];
    const [moved] = next.splice(from, 1);
    let insertAt = next.length;
    if (group.containerIndex != null) {
      const adjustedContainerIdx = from < group.containerIndex ? group.containerIndex - 1 : group.containerIndex;
      insertAt = adjustedContainerIdx + 1;
      while (insertAt < next.length && !this.isContainer(next[insertAt])) {
        insertAt++;
      }
    }
    next.splice(insertAt, 0, moved);
    this.items.set(next);
    this.selectedIndex.set(insertAt);
    this.dirty.set(true);
  }

  onDragEnd(): void {
    this.paletteDragType.set(null);
    this.dragIndex.set(null);
    this.dragOverIndex.set(null);
  }

  updateItem(patch: Partial<FormItem>): void {
    const index = this.selectedIndex();
    if (index == null) {
      return;
    }
    const next = [...this.items()];
    const current = next[index];
    const updated = { ...current, ...patch };

    // When switching type to MATRIX, ensure default rows and columns exist if empty
    if (patch.type === 'MATRIX') {
      if (!updated.rows || updated.rows.length === 0) {
        updated.rows = [
          `${this.i18n.t('PLUGIN_FORM_MATRIX_ROW_DEFAULT')} 1`,
          `${this.i18n.t('PLUGIN_FORM_MATRIX_ROW_DEFAULT')} 2`,
        ];
      }
      if (!updated.columns || updated.columns.length === 0) {
        updated.columns = [
          `${this.i18n.t('PLUGIN_FORM_MATRIX_COLUMN_DEFAULT')} 1`,
          `${this.i18n.t('PLUGIN_FORM_MATRIX_COLUMN_DEFAULT')} 2`,
        ];
      }
      if (!updated.col_span || updated.col_span < 2) {
        updated.col_span = 2;
      }
    } else if (patch.type === 'GRID') {
      if (!updated.columns_def || updated.columns_def.length === 0) {
        updated.columns_def = [
          { key: 'item', label: 'Tên hàng / Mục', type: 'TEXT' },
          { key: 'qty', label: 'Số lượng', type: 'NUMBER', summary: 'SUM' },
          { key: 'price', label: 'Đơn giá', type: 'NUMBER' },
          { key: 'total', label: 'Thành tiền', type: 'FORMULA', formula: 'qty * price', summary: 'SUM' },
        ];
        updated.columns = updated.columns_def.map((c) => c.label);
      }
      if (updated.default_rows == null) updated.default_rows = 2;
      if (updated.allow_add_row == null) updated.allow_add_row = true;
      if (updated.allow_delete_row == null) updated.allow_delete_row = true;
      if (!updated.col_span || updated.col_span < 2) {
        updated.col_span = 2;
      }
    } else if (patch.type && CHOICE_TYPES.includes(patch.type as FormItemType)) {
      if (!updated.option_source) {
        updated.option_source = 'STATIC';
      }
      if (!updated.options || updated.options.length === 0) {
        updated.options = [
          { value: 'option_1', label: `${this.i18n.t('PLUGIN_FORM_OPTION_DEFAULT')} 1` },
          { value: 'option_2', label: `${this.i18n.t('PLUGIN_FORM_OPTION_DEFAULT')} 2` },
        ];
      }
    } else if (patch.type === 'FILE_UPLOAD') {
      if (!updated.file_limits) {
        updated.file_limits = { max_files: 3, max_size_mb: 10 };
      }
    } else if (patch.type === 'RATING') {
      if (!updated.grading) {
        updated.grading = { points: 5, correct: [] };
      }
    }

    if (patch.option_source === 'CATALOG' && !updated.catalog_type) {
      updated.catalog_type = 'PROVINCE';
    } else if (patch.option_source === 'EXTERNAL_API') {
      if (!updated.api_method) updated.api_method = 'GET';
      if (!updated.api_value_key) updated.api_value_key = 'id';
      if (!updated.api_label_key) updated.api_label_key = 'name';
    }

    next[index] = updated;
    this.items.set(next);
    this.dirty.set(true);
  }

  autoGenerateRefFromLabel(): void {
    const item = this.selectedItem();
    if (!item || !item.label) return;
    const base = this.sanitizeRef(item.label) || item.type.toLowerCase();
    this.updateItem({ ref: base });
  }

  // Entity Mapping helpers (No raw strings)
  currentFieldEntityKey(ref: string | undefined): string {
    if (!ref) return '';
    const m = this.entityMapping()[ref];
    return m ? `${m.target_plugin}:${m.target_entity}` : '';
  }

  currentFieldTargetField(ref: string | undefined): string {
    if (!ref) return '';
    return this.entityMapping()[ref]?.target_field ?? '';
  }

  targetFieldOptionsFor(ref: string | undefined): SelectOption[] {
    const key = this.currentFieldEntityKey(ref);
    if (!key) return [];
    const [pluginId, entityName] = key.split(':');
    const found = this.registeredEntities().find(
      (e) => e.pluginId === pluginId && e.entityName === entityName,
    );
    const fields = found?.schemaDefinition?.fields ?? ['code', 'name', 'description'];
    return fields.map((f) => ({ value: f, label: f }));
  }

  setFieldEntityTarget(ref: string | undefined, entityKey: string): void {
    if (!ref) return;
    const next = { ...this.entityMapping() };
    if (!entityKey) {
      delete next[ref];
    } else {
      const [target_plugin, target_entity] = entityKey.split(':');
      const found = this.registeredEntities().find(
        (e) => e.pluginId === target_plugin && e.entityName === target_entity,
      );
      const firstField = found?.schemaDefinition?.fields?.[0] ?? ref;
      next[ref] = { target_plugin, target_entity, target_field: firstField };
    }
    this.entityMapping.set(next);
    this.dirty.set(true);
  }

  setFieldEntityColumn(ref: string | undefined, targetField: string): void {
    if (!ref) return;
    const current = this.entityMapping()[ref];
    if (!current) return;
    this.entityMapping.set({
      ...this.entityMapping(),
      [ref]: { ...current, target_field: targetField },
    });
    this.dirty.set(true);
  }

  updateOption(index: number, patch: Partial<NonNullable<FormItem['options']>[number]>): void {
    const options = [...(this.selectedItem()?.options ?? [])];
    options[index] = { ...options[index], ...patch };
    this.updateItem({ options });
  }

  addOption(): void {
    const options = [...(this.selectedItem()?.options ?? [])];
    const num = options.length + 1;
    options.push({
      value: `option_${num}`,
      label: `${this.i18n.t('PLUGIN_FORM_OPTION_DEFAULT')} ${num}`,
    });
    this.updateItem({ options });
  }

  removeOption(index: number): void {
    const options = [...(this.selectedItem()?.options ?? [])];
    if (options.length <= 1) {
      return;
    }
    options.splice(index, 1);
    this.updateItem({ options });
  }

  logicTargetOptions(): SelectOption[] {
    return this.laterRefs().map((entry) => ({ value: entry.ref, label: entry.label }));
  }

  updateOptionLogic(index: number, action: string): void {
    if (!action) {
      this.updateOption(index, { logic: undefined });
      return;
    }
    const current = this.selectedItem()?.options?.[index]?.logic;
    this.updateOption(index, {
      logic: {
        action: action as FormLogicAction,
        goto_ref: action === 'GOTO_REF' ? current?.goto_ref ?? (this.laterRefs()[0]?.ref ?? '') : undefined,
      },
    });
  }

  updateOptionGoto(index: number, ref: string): void {
    this.updateOption(index, { logic: { action: 'GOTO_REF', goto_ref: ref } });
  }

  updateListField(field: 'rows' | 'columns', value: string): void {
    const list = value
      .split('\n')
      .map((entry) => entry.trim())
      .filter((entry) => !!entry);
    this.updateItem({ [field]: list } as Partial<FormItem>);
  }

  readonly gridColumnTypes: SelectOption[] = [
    { value: 'TEXT', label: this.i18n.t('PLUGIN_FORM_GRID_TYPE_TEXT') },
    { value: 'NUMBER', label: this.i18n.t('PLUGIN_FORM_GRID_TYPE_NUMBER') },
    { value: 'DATE', label: this.i18n.t('PLUGIN_FORM_GRID_TYPE_DATE') },
    { value: 'SELECT', label: this.i18n.t('PLUGIN_FORM_GRID_TYPE_SELECT') },
    { value: 'FORMULA', label: this.i18n.t('PLUGIN_FORM_GRID_TYPE_FORMULA') },
  ];

  readonly gridSummaryTypes: SelectOption[] = [
    { value: 'NONE', label: this.i18n.t('PLUGIN_FORM_GRID_SUMMARY_NONE') },
    { value: 'SUM', label: this.i18n.t('PLUGIN_FORM_GRID_SUMMARY_SUM') },
    { value: 'AVG', label: this.i18n.t('PLUGIN_FORM_GRID_SUMMARY_AVG') },
    { value: 'COUNT', label: this.i18n.t('PLUGIN_FORM_GRID_SUMMARY_COUNT') },
    { value: 'MIN', label: this.i18n.t('PLUGIN_FORM_GRID_SUMMARY_MIN') },
    { value: 'MAX', label: this.i18n.t('PLUGIN_FORM_GRID_SUMMARY_MAX') },
  ];

  gridColumns(item: FormItem): GridColumnDef[] {
    if (item.columns_def && item.columns_def.length > 0) {
      return item.columns_def;
    }
    if (item.columns && item.columns.length > 0) {
      return item.columns.map((c, idx) => ({
        key: `col_${idx + 1}`,
        label: c,
        type: 'TEXT' as GridColumnType,
        summary: 'NONE' as GridSummaryType,
      }));
    }
    return [
      { key: 'item', label: 'Tên hàng / Mục', type: 'TEXT' },
      { key: 'qty', label: 'Số lượng', type: 'NUMBER', summary: 'SUM' },
      { key: 'price', label: 'Đơn giá', type: 'NUMBER' },
      { key: 'total', label: 'Thành tiền', type: 'FORMULA', formula: 'qty * price', summary: 'SUM' },
    ];
  }

  addGridColumn(item: FormItem): void {
    const current = this.gridColumns(item);
    const nextIdx = current.length + 1;
    const nextCols: GridColumnDef[] = [
      ...current,
      {
        key: `col_${nextIdx}`,
        label: `Cột ${nextIdx}`,
        type: 'TEXT',
        summary: 'NONE',
      },
    ];
    this.updateItem({
      columns_def: nextCols,
      columns: nextCols.map((c) => c.label || c.key),
    });
  }

  removeGridColumn(item: FormItem, colIndex: number): void {
    const current = this.gridColumns(item);
    if (current.length <= 1) return;
    const nextCols = current.filter((_, idx) => idx !== colIndex);
    this.updateItem({
      columns_def: nextCols,
      columns: nextCols.map((c) => c.label || c.key),
    });
  }

  updateGridColumn(item: FormItem, colIndex: number, patch: Partial<GridColumnDef>): void {
    const current = this.gridColumns(item);
    const nextCols = current.map((col, idx) => {
      if (idx !== colIndex) return col;
      return { ...col, ...patch };
    });
    this.updateItem({
      columns_def: nextCols,
      columns: nextCols.map((c) => c.label || c.key),
    });
  }

  updateGridColumnType(item: FormItem, colIndex: number, type: string): void {
    this.updateGridColumn(item, colIndex, { type: type as GridColumnType });
  }

  updateGridColumnSummary(item: FormItem, colIndex: number, summary: string): void {
    this.updateGridColumn(item, colIndex, { summary: summary as GridSummaryType });
  }

  updateGridColumnOptionSource(item: FormItem, colIndex: number, source: string): void {
    this.updateGridColumn(item, colIndex, { option_source: source as FormOptionSourceType });
  }

  potentialGridParentColumnOptions(gridItem: FormItem, currentColumn: GridColumnDef): SelectOption[] {
    const opts: SelectOption[] = [
      {
        value: '',
        label: this.i18n.t('PLUGIN_FORM_GRID_COLUMN_DEPENDS_ON_NONE') || '-- Không phụ thuộc (Hiển thị tất cả) --',
      },
    ];
    // Sibling columns in the same grid
    const cols = this.gridColumns(gridItem);
    for (const c of cols) {
      if (c.key !== currentColumn.key) {
        opts.push({
          value: c.key,
          label: `[Cột dòng] ${c.label || c.key} (${c.key})`,
        });
      }
    }
    // Questions in outer form
    for (const it of this.items()) {
      if (it !== gridItem && !this.isContainer(it) && it.ref) {
        opts.push({
          value: it.ref,
          label: `[Trường Form] ${it.label || it.ref} (${it.ref})`,
        });
      }
    }
    return opts;
  }

  async testFetchGridColumnOptions(gridItem: FormItem, colIndex: number): Promise<void> {
    const col = this.gridColumns(gridItem)[colIndex];
    if (!col) return;
    const ref = `${gridItem.ref || 'grid'}:${col.key}`;
    this.optionFetchStatus.set({ ref, loading: true, message: '' });
    try {
      let opts: FormOption[] = [];
      if (col.option_source === 'CATALOG' && col.catalog_type) {
        const res = await firstValueFrom(this.api.getCatalogOptions(col.catalog_type));
        opts = res?.data?.items?.map((x: any) => ({
          value: String(x.code ?? x.id ?? x.value),
          label: String(x.name ?? x.label ?? x.title ?? x.code ?? x.value),
          parent_code: x.parent_code ? String(x.parent_code) : undefined,
        })) ?? [];
      } else if (col.option_source === 'EXTERNAL_API' && col.api_url) {
        const data: any = await firstValueFrom(this.api.testExternalApi(col.api_url, col.api_method || 'GET'));
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
        opts = raw.map((x: any) => ({
          value: String(x[valKey] ?? x['value'] ?? x['code'] ?? JSON.stringify(x)),
          label: String(x[lblKey] ?? x['label'] ?? x['title'] ?? x[valKey] ?? 'Option'),
        }));
      }
      this.optionFetchStatus.set({
        ref,
        loading: false,
        message: `Đã nạp thành công ${opts.length} tùy chọn (${col.catalog_type || 'API'}).`,
      });
    } catch (e: any) {
      this.optionFetchStatus.set({
        ref,
        loading: false,
        message: `Lỗi khi tải: ${e?.message || 'Không thể kết nối nguồn dữ liệu'}`,
        error: true,
      });
    }
  }

  formatOptionsText(options?: Array<{ value: string; label?: string } | string>): string {
    if (!options || options.length === 0) return '';
    return options.map((opt) => (typeof opt === 'string' ? opt : opt.label || opt.value)).join(', ');
  }

  setGridColumnOptions(item: FormItem, colIndex: number, rawText: string): void {
    const tokens = rawText
      .split(',')
      .map((s) => s.trim())
      .filter((s) => !!s);
    const options = tokens.map((t) => ({ value: t, label: t }));
    this.updateGridColumn(item, colIndex, { options });
  }

  dummyGridRows(item: FormItem): Array<Record<string, any>> {
    const cols = this.gridColumns(item);
    const rowCount = Math.max(item.default_rows ?? 2, 1);
    const sampleRows: Array<Record<string, any>> = [];
    const sampleNames = ['MacBook Pro M3', 'Màn hình Dell 4K', 'Bàn phím Keychron', 'Chuột Logitech'];
    for (let r = 0; r < rowCount; r++) {
      const row: Record<string, any> = {};
      for (let c = 0; c < cols.length; c++) {
        const col = cols[c];
        if (col.type === 'NUMBER') {
          row[col.key] = c === 1 ? (r + 1) * 2 : (r + 1) * 500000;
        } else if (col.type === 'DATE') {
          row[col.key] = '2026-11-10';
        } else if (col.type === 'SELECT') {
          const opts = col.options ?? [];
          const firstOpt = opts[0];
          row[col.key] = typeof firstOpt === 'string' ? firstOpt : firstOpt?.label || firstOpt?.value || 'Loại A';
        } else if (col.type === 'FORMULA') {
          // Handled via canvasRowFormula
        } else {
          row[col.key] = sampleNames[r % sampleNames.length] || `Mục ${r + 1}`;
        }
      }
      sampleRows.push(row);
    }
    return sampleRows;
  }

  canvasRowFormula(item: FormItem, row: Record<string, any>, col: GridColumnDef): string {
    const val = evaluateRowFormula(col.formula, row, this.gridColumns(item));
    return formatGridNumber(val);
  }

  canvasColSummary(item: FormItem, col: GridColumnDef): string {
    const rows = this.dummyGridRows(item);
    return evaluateColumnSummary(col, rows, this.gridColumns(item));
  }

  updateFileLimit(field: 'max_files' | 'max_size_mb', value: string): void {
    const limits = { ...(this.selectedItem()?.file_limits ?? {}) };
    const parsed = Number(value);
    limits[field] = Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
    this.updateItem({ file_limits: limits });
  }

  updateGrading(field: 'points', value: string): void {
    const grading = { ...(this.selectedItem()?.grading ?? { points: 0, correct: [] }) };
    const parsed = Number(value);
    grading.points = Number.isFinite(parsed) ? parsed : 0;
    this.updateItem({ grading });
  }

  updateOptionSource(source: string): void {
    this.updateItem({ option_source: source as FormOptionSourceType });
  }

  updateApiMethod(method: string): void {
    this.updateItem({ api_method: method === 'POST' ? 'POST' : 'GET' });
  }

  isFetching(ref?: string): boolean {
    const s = this.optionFetchStatus();
    return !!s?.loading && s?.ref === ref;
  }

  async fetchApiOptions(item: FormItem): Promise<FormOption[]> {
    if (!item.api_url) return [];
    const method = item.api_method || 'GET';
    const data: any = await firstValueFrom(this.api.testExternalApi(item.api_url, method));
    let list: any[] = [];
    if (item.api_items_path) {
      const parts = item.api_items_path.split('.');
      let cur = data;
      for (const p of parts) {
        cur = cur?.[p];
      }
      list = Array.isArray(cur) ? cur : [];
    } else if (Array.isArray(data)) {
      list = data;
    } else if (Array.isArray(data?.items)) {
      list = data.items;
    } else if (Array.isArray(data?.data)) {
      list = data.data;
    }
    const valKey = item.api_value_key || 'id';
    const lblKey = item.api_label_key || 'name';
    return list.map((x) => ({
      value: String(x[valKey] ?? x['value'] ?? x['code'] ?? JSON.stringify(x)),
      label: String(x[lblKey] ?? x['label'] ?? x['title'] ?? x[valKey] ?? 'Option'),
    }));
  }

  ensureCatalogOptionsLoaded(ref: string, typeCode: string): void {
    if (!ref || !typeCode || this.catalogLoading.has(ref)) return;
    this.catalogLoading.add(ref);
    this.fetchCatalogOptions(typeCode)
      .then((opts) => {
        if (opts.length > 0) {
          const map = { ...this.resolvedOptionsMap() };
          map[ref] = opts;
          this.resolvedOptionsMap.set(map);
        }
      })
      .finally(() => {
        this.catalogLoading.delete(ref);
      });
  }

  ensureApiOptionsLoaded(item: FormItem): void {
    const ref = item.ref;
    if (!ref || !item.api_url || this.apiLoading.has(ref)) return;
    this.apiLoading.add(ref);
    this.fetchApiOptions(item)
      .then((opts) => {
        if (opts.length > 0) {
          const map = { ...this.resolvedOptionsMap() };
          map[ref] = opts;
          this.resolvedOptionsMap.set(map);
        }
      })
      .catch(() => {})
      .finally(() => {
        this.apiLoading.delete(ref);
      });
  }

  async testFetchOptions(item: FormItem): Promise<void> {
    const ref = item.ref ?? '';
    this.optionFetchStatus.set({ ref, loading: true, message: '' });
    try {
      let opts: FormOption[] = [];
      if (item.option_source === 'CATALOG') {
        const typeCode = item.catalog_type || 'PROVINCE';
        opts = await this.fetchCatalogOptions(typeCode);
      } else if (item.option_source === 'EXTERNAL_API') {
        opts = await this.fetchApiOptions(item);
      } else {
        opts = item.options ?? [];
      }
      const map = { ...this.resolvedOptionsMap() };
      map[ref] = opts;
      this.resolvedOptionsMap.set(map);
      const previewText = opts.slice(0, 3).map((o) => o.label || o.value).join(', ');
      this.optionFetchStatus.set({
        ref,
        loading: false,
        message: `${this.i18n.t('PLUGIN_FORM_FETCH_SUCCESS', { count: opts.length })}: ${previewText}${opts.length > 3 ? '...' : ''}`,
      });
    } catch (err: any) {
      this.optionFetchStatus.set({
        ref,
        loading: false,
        error: true,
        message: this.i18n.t('PLUGIN_FORM_FETCH_FAILED', { error: err?.message || 'Error' }),
      });
    }
  }

  private readonly catalogLoading = new Set<string>();
  private readonly apiLoading = new Set<string>();

  getItemOptions(item: FormItem): FormOption[] {
    const source = item.option_source || 'STATIC';
    if (source === 'STATIC') {
      return item.options ?? [];
    }
    const cached = this.resolvedOptionsMap()[item.ref ?? ''];
    if (cached && cached.length > 0) {
      return cached;
    }
    if (source === 'CATALOG') {
      const typeCode = item.catalog_type || 'PROVINCE';
      this.ensureCatalogOptionsLoaded(item.ref ?? '', typeCode);
      return this.getFallbackCatalogOptions(typeCode);
    }
    if (source === 'EXTERNAL_API') {
      this.ensureApiOptionsLoaded(item);
      return [
        { value: 'api_1', label: `${item.label || 'API'} (Mục 1)` },
        { value: 'api_2', label: `${item.label || 'API'} (Mục 2)` },
        { value: 'api_3', label: `${item.label || 'API'} (Mục 3)` },
      ];
    }
    return item.options ?? [];
  }

  getFallbackCatalogOptions(typeCode: string): FormOption[] {
    const code = (typeCode || '').toUpperCase();
    switch (code) {
      case 'PROVINCE':
        return [
          { value: 'HN', label: 'Hà Nội' },
          { value: 'HCM', label: 'TP. Hồ Chí Minh' },
          { value: 'DN', label: 'Đà Nẵng' },
          { value: 'HP', label: 'Hải Phòng' },
          { value: 'CT', label: 'Cần Thơ' },
        ];
      case 'DISTRICT':
        return [
          { value: 'BA_DINH', label: 'Quận Ba Đình', parent_code: 'HN' },
          { value: 'CAU_GIAY', label: 'Quận Cầu Giấy', parent_code: 'HN' },
          { value: 'DONG_DA', label: 'Quận Đống Đa', parent_code: 'HN' },
          { value: 'Q1', label: 'Quận 1', parent_code: 'HCM' },
          { value: 'Q3', label: 'Quận 3', parent_code: 'HCM' },
          { value: 'BINH_THANH', label: 'Quận Bình Thạnh', parent_code: 'HCM' },
          { value: 'HAI_CHAU', label: 'Quận Hải Châu', parent_code: 'DN' },
          { value: 'THANH_KHE', label: 'Quận Thanh Khê', parent_code: 'DN' },
          { value: 'SON_TRA', label: 'Quận Sơn Trà', parent_code: 'DN' },
        ];
      case 'COMMUNE':
      case 'WARD':
        return [
          { value: 'DOI_CAN', label: 'Phường Đội Cấn', parent_code: 'BA_DINH' },
          { value: 'KIM_MA', label: 'Phường Kim Mã', parent_code: 'BA_DINH' },
          { value: 'DICH_VONG', label: 'Phường Dịch Vọng', parent_code: 'CAU_GIAY' },
          { value: 'BEN_NGHE', label: 'Phường Bến Nghé', parent_code: 'Q1' },
          { value: 'BEN_THANH', label: 'Phường Bến Thành', parent_code: 'Q1' },
          { value: 'THACH_THANG', label: 'Phường Thạch Thang', parent_code: 'HAI_CHAU' },
        ];
      case 'DEPARTMENT':
        return [
          { value: 'DEPT_IT', label: 'Khối Công nghệ & Sản phẩm' },
          { value: 'DEPT_HR', label: 'Phòng Nhân sự' },
          { value: 'DEPT_ACC', label: 'Phòng Kế toán - Tài chính' },
          { value: 'DEPT_SALES', label: 'Khối Kinh doanh & Marketing' },
        ];
      case 'JOB_TITLE':
        return [
          { value: 'DEV_SR', label: 'Kỹ sư Phần mềm Senior' },
          { value: 'DEV_LEAD', label: 'Trưởng nhóm Kỹ thuật (Tech Lead)' },
          { value: 'PRODUCT_OWNER', label: 'Chuyên viên Sản phẩm (PO)' },
          { value: 'QA_LEAD', label: 'Trưởng nhóm Đảm bảo Chất lượng' },
        ];
      case 'CONTRACT_TYPE':
        return [
          { value: 'FULL_TIME', label: 'Hợp đồng Chính thức' },
          { value: 'PROBATION', label: 'Hợp đồng Thử việc' },
          { value: 'PART_TIME', label: 'Hợp đồng Bán thời gian' },
          { value: 'FREELANCE', label: 'Hợp đồng Cộng tác viên' },
        ];
      case 'EDUCATION_LEVEL':
        return [
          { value: 'BACHELOR', label: 'Đại học / Cử nhân' },
          { value: 'MASTER', label: 'Thạc sĩ' },
          { value: 'DOCTOR', label: 'Tiến sĩ' },
          { value: 'COLLEGE', label: 'Cao đẳng / Trung cấp' },
        ];
      default:
        return [
          { value: `${typeCode.toLowerCase()}_1`, label: `${typeCode} 01` },
          { value: `${typeCode.toLowerCase()}_2`, label: `${typeCode} 02` },
          { value: `${typeCode.toLowerCase()}_3`, label: `${typeCode} 03` },
        ];
    }
  }

  fetchCatalogOptions(catalogType: string): Promise<FormOption[]> {
    if (!catalogType) return Promise.resolve([]);
    return new Promise((resolve) => {
      this.api.getCatalogOptions(catalogType).subscribe({
        next: (res) => {
          const items = res.data?.items ?? [];
          if (items.length > 0) {
            resolve(
              items.map((it: any) => ({
                value: it.code,
                label: it.name || it.code,
                parent_code: it.parent_code ? String(it.parent_code) : undefined,
              })),
            );
          } else {
            resolve(this.getFallbackCatalogOptions(catalogType));
          }
        },
        error: () => {
          resolve(this.getFallbackCatalogOptions(catalogType));
        },
      });
    });
  }

  saveDocument(): void {
    const form = this.selected();
    if (!form) {
      return;
    }
    if (!this.titleInput().trim()) {
      this.error.set('PLUGIN_FORM_ERROR_REQUIRED');
      return;
    }
    const invalid = this.items().find(
      (item) =>
        (this.isContainer(item) && !item.title?.trim()) ||
        (!this.isContainer(item) && (!item.ref?.trim() || !item.label?.trim())),
    );
    if (invalid || this.items().length === 0) {
      this.error.set('PLUGIN_FORM_ERROR_ITEM_REQUIRED');
      return;
    }
    this.saving.set(true);
    this.error.set('');
    this.api
      .update(form.id, {
        title: this.titleInput().trim(),
        description: this.descriptionInput().trim(),
        document: {
          layout: this.layoutConfig(),
          items: this.items(),
        },
        entity_mapping: Object.keys(this.entityMapping()).length > 0 ? this.entityMapping() : null,
      })
      .subscribe({
        next: (result) => {
          this.saving.set(false);
          this.selected.set(result.data ?? form);
          this.dirty.set(false);
          this.success.set('PLUGIN_FORM_SAVED');
          this.loadForms();
        },
        error: (err) => {
          this.saving.set(false);
          this.error.set(err?.code ?? 'PLUGIN_FORM_ERROR_SAVE');
        },
      });
  }

  openPublish(): void {
    const form = this.selected();
    this.publishCaptcha.set(form?.captcha ?? 'none');
    this.publishCloseAt.set(toLocalInput(form?.close_at));
    this.publishLimit.set(form?.response_limit ? String(form.response_limit) : '');
    this.publishOpen.set(true);
  }

  confirmPublish(): void {
    const form = this.selected();
    if (!form) {
      return;
    }
    this.busy.set(true);
    this.api
      .publish(form.id, {
        captcha: this.publishCaptcha(),
        close_at: this.publishCloseAt() ? new Date(this.publishCloseAt()).toISOString() : undefined,
        response_limit: this.publishLimitNumber() ?? undefined,
      })
      .subscribe({
        next: (result) => {
          this.busy.set(false);
          this.publishOpen.set(false);
          this.selected.set(result.data ?? form);
          this.success.set('PLUGIN_FORM_PUBLISHED');
          this.loadForms();
        },
        error: (err) => {
          this.busy.set(false);
          this.error.set(err?.code ?? 'PLUGIN_FORM_ERROR_SAVE');
        },
      });
  }

  closeIntake(): void {
    const form = this.selected();
    if (!form) {
      return;
    }
    this.api.close(form.id).subscribe({
      next: (result) => {
        this.selected.set(result.data ?? form);
        this.success.set('PLUGIN_FORM_CLOSED_TOAST');
        this.loadForms();
      },
      error: (err) => this.error.set(err?.code ?? 'PLUGIN_FORM_ERROR_SAVE'),
    });
  }

  // ------------------------------------------------------------------
  // Responses
  // ------------------------------------------------------------------

  loadResponses(): void {
    const form = this.selected();
    if (!form) {
      return;
    }
    this.responsesLoading.set(true);
    this.api.responses(form.id).subscribe({
      next: (result) => {
        this.responsesLoading.set(false);
        this.responses.set((result.data?.items ?? []) as unknown as Record<string, unknown>[]);
        if (!this.selectedResponse()) {
          const first = this.responses()[0];
          if (first) {
            this.selectedResponse.set(first);
          }
        }
      },
      error: () => {
        this.responsesLoading.set(false);
        this.error.set('PLUGIN_FORM_ERROR_LOAD');
      },
    });
  }

  selectResponse(response: Record<string, unknown>): void {
    this.selectedResponse.set(response);
  }

  exportCsv(): void {
    const form = this.selected();
    if (!form) {
      return;
    }
    this.api.exportCsv(form.id).subscribe({
      next: (blob) => {
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = `${form.slug}-responses.csv`;
        anchor.click();
        URL.revokeObjectURL(url);
      },
      error: () => this.error.set('PLUGIN_FORM_ERROR_EXPORT'),
    });
  }

  // ------------------------------------------------------------------
  // Summary
  // ------------------------------------------------------------------

  loadSummary(): void {
    const form = this.selected();
    if (!form) {
      return;
    }
    this.summaryLoading.set(true);
    this.api.summary(form.id).subscribe({
      next: (result) => {
        this.summaryLoading.set(false);
        this.summary.set(result.data ?? null);
      },
      error: () => {
        this.summaryLoading.set(false);
        this.error.set('PLUGIN_FORM_ERROR_LOAD');
      },
    });
  }

  choiceRows(ref: string): { value: string; count: number; percent: number; label: string }[] {
    const summary = this.summary();
    const total = Math.max(summary?.total_responses ?? 0, 1);
    const rows = Object.entries(summary?.choice_counts ?? {})
      .filter(([key]) => key.startsWith(`${ref}:`))
      .map(([key, count]) => {
        const value = key.slice(ref.length + 1);
        const option = this.findItemByRef(ref)?.options?.find((entry) => entry.value === value);
        return {
          value,
          count: Number(count),
          percent: Math.round((Number(count) / total) * 100),
          label: option?.label || value,
        };
      })
      .sort((left, right) => right.count - left.count);
    return rows;
  }

  numericAverage(ref: string): number | null {
    const value = this.summary()?.numeric_averages?.[ref];
    return typeof value === 'number' ? Math.round(value * 10) / 10 : null;
  }

  // ------------------------------------------------------------------
  // Helpers
  // ------------------------------------------------------------------

  findItemByRef(ref: string): FormItem | undefined {
    return (this.selected()?.document?.items ?? []).find((item) => item.ref === ref);
  }

  answerLabel(ref: string): string {
    return this.findItemByRef(ref)?.label || ref;
  }

  answerValue(value: unknown): string {
    if (value == null || value === '') {
      return '—';
    }
    if (Array.isArray(value)) {
      if (value.length > 0 && typeof value[0] === 'object' && value[0] !== null) {
        return value.map((r, i) => `#${i + 1}: {${Object.entries(r).map(([k, v]) => `${k}: ${v}`).join(', ')}}`).join(' | ');
      }
      return value.map((entry) => String(entry)).join(', ');
    }
    if (typeof value === 'object') {
      return Object.entries(value as Record<string, unknown>)
        .map(([key, entry]) => `${key}: ${String(entry)}`)
        .join(' · ');
    }
    return String(value);
  }

  answerEntries(response: Record<string, unknown> | null): [string, unknown][] {
    const answers = (response?.['answers'] ?? {}) as Record<string, unknown>;
    return Object.entries(answers);
  }

  itemTypeKey(type: string): string {
    return `PLUGIN_FORM_TYPE_${type}`;
  }

  itemIcon(type: FormItemType): string {
    switch (type) {
      case 'SECTION':
      case 'PAGE':
      case 'STEP':
      case 'MATRIX':
      case 'GRID':
        return 'grid';
      case 'SINGLE_CHOICE':
      case 'MULTI_CHOICE':
      case 'DROPDOWN':
        return 'check';
      case 'FILE_UPLOAD':
        return 'upload';
      default:
        return 'file-text';
    }
  }

  sanitizeRef(value: string): string {
    return value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/Đ/g, 'd')
      .toLowerCase()
      .replace(/[^a-z0-9_]+/g, '_')
      .replace(/^_+|_+$/g, '')
      .slice(0, 60);
  }

  sanitizeSlug(value: string): string {
    return value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/Đ/g, 'd')
      .toLowerCase()
      .replace(/[^a-z0-9-]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 80);
  }

  numText(value: unknown): string {
    return value == null ? '' : `${value}`;
  }

  numVal(value: unknown, fallback: number = 0): number {
    const n = Number(value);
    return Number.isFinite(n) ? n : fallback;
  }

  statusVariant(status: string | undefined): ColorVariant {
    switch (status) {
      case 'PUBLISHED':
        return ColorVariant.SUCCESS;
      case 'CLOSED':
        return ColorVariant.WARNING;
      case 'DRAFT':
        return ColorVariant.DEFAULT;
      default:
        return ColorVariant.DEFAULT;
    }
  }

  entityVariant(status: string | undefined): ColorVariant {
    switch (status) {
      case 'OK':
        return ColorVariant.SUCCESS;
      case 'FAILED':
        return ColorVariant.DANGER;
      default:
        return ColorVariant.DEFAULT;
    }
  }

  formatDate(value: unknown): string {
    if (!value) {
      return '—';
    }
    const date = new Date(String(value));
    if (Number.isNaN(date.getTime())) {
      return String(value);
    }
    return new Intl.DateTimeFormat(this.i18n.currentLang(), {
      dateStyle: 'short',
      timeStyle: 'short',
    }).format(date);
  }

  isContainer(item: FormItem | null | undefined): boolean {
    return !!item && this.isContainerType(item.type);
  }

  isContainerType(type: FormItemType | string): boolean {
    return type === 'SECTION' || type === 'PAGE' || type === 'STEP';
  }

  isQuestion(item: FormItem): boolean {
    return !this.isContainer(item);
  }

  isChoice(item: FormItem): boolean {
    return CHOICE_TYPES.includes(item.type);
  }

  canManage(): boolean {
    return this.can('form:definition:manage');
  }

  canReadResponses(): boolean {
    return this.can('form:response:read');
  }

  clearMessages(): void {
    this.error.set('');
    this.success.set('');
  }

  private nextRef(type: FormItemType): string {
    const base = type.toLowerCase();
    const refs = new Set(this.items().map((item) => item.ref));
    let counter = 1;
    while (refs.has(`${base}_${counter}`)) {
      counter += 1;
    }
    return `${base}_${counter}`;
  }
}

function defaultDocument(title: string): Record<string, unknown> {
  return {
    layout: {
      mode: 'SECTION',
      columns: 2,
      mobile_columns: 1,
      row_gap: 'normal',
    },
    items: [
      { type: 'SECTION', ref: 'section_1', title, grid_columns: 2, mobile_columns: 1 },
      {
        type: 'SHORT_TEXT',
        ref: 'question_1',
        label: 'Question 1',
        required: true,
        col_span: 1,
        row_span: 1,
        mobile_span: 1,
      },
    ],
  };
}

function toLocalInput(value: string | undefined): string {
  if (!value) {
    return '';
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '';
  }
  const pad = (part: number) => String(part).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}
