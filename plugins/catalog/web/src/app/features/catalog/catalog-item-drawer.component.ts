import { ChangeDetectionStrategy, Component, computed, effect, inject, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  ApiErrorResponse,
  CatalogHierarchyMode,
  CatalogItemLink,
  CatalogItemRef,
  CatalogPickerComponent,
  CatalogRelationType,
  CatalogStatus,
  DrawerComponent,
  I18nService,
  SharpButtonComponent,
  SharpInputComponent,
  SharpSelectComponent,
  SharpTextareaComponent,
  SharpToggleComponent,
  TranslatePipe
} from '@shared';
import {
  CatalogAdminService,
  CatalogAttributeField,
  CatalogItemDto,
  CatalogItemPayload,
  CatalogScope,
  CatalogTypeDto,
  CatalogTypeRelationGroup
} from '../../core/services/catalog-admin.service';

/**
 * Create/edit a catalogue item (DES-UI-S05-001 §2, TASK-404). Editing is
 * version-creating; after the row is saved the drawer stays open and exposes
 * relation tabs with distinct parent/child sections grouped by child type.
 */
@Component({
  selector: 'app-catalog-item-drawer',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    DrawerComponent,
    CatalogPickerComponent,
    SharpButtonComponent,
    SharpInputComponent,
    SharpSelectComponent,
    SharpTextareaComponent,
    SharpToggleComponent,
    TranslatePipe
  ],
  templateUrl: './catalog-item-drawer.component.html'
})
export class CatalogItemDrawerComponent {
  private catalog = inject(CatalogAdminService);
  private i18n = inject(I18nService);

  isOpen = input<boolean>(false);
  item = input<CatalogItemDto | null>(null);
  type = input<CatalogTypeDto | null>(null);
  scope = input<CatalogScope>(CatalogScope.TENANT);

  close = output<void>();
  saved = output<string>();
  savedItem = output<CatalogItemDto>();

  readonly statusOptions = [
    { value: CatalogStatus.ACTIVE, labelKey: 'CATALOG_STATUS_ACTIVE' },
    { value: CatalogStatus.INACTIVE, labelKey: 'CATALOG_STATUS_INACTIVE' }
  ];

  readonly code = signal('');
  readonly name = signal('');
  readonly nameEn = signal('');
  readonly description = signal('');
  readonly sortOrder = signal('0');
  readonly status = signal<CatalogStatus>(CatalogStatus.ACTIVE);
  readonly attributes = signal<Record<string, unknown>>({});

  readonly saving = signal(false);
  readonly errorText = signal('');

  readonly relationGroups = signal<CatalogTypeRelationGroup[]>([]);
  readonly links = signal<{ parents: CatalogItemLink[]; children: CatalogItemLink[] }>({ parents: [], children: [] });
  readonly activeTab = signal<string>('info');
  readonly pickedParent = signal<CatalogItemRef | null>(null);
  readonly pickedChild = signal<CatalogItemRef | null>(null);
  readonly parentTypeByRelation = signal<Record<string, string>>({});
  readonly childTypeByRelation = signal<Record<string, string>>({});
  readonly parentNewCode = signal('');
  readonly parentNewName = signal('');
  readonly childNewCode = signal('');
  readonly childNewName = signal('');
  readonly groupState = signal<Record<string, {
    collapsed: boolean;
    page: number;
    quick: boolean;
    code: string;
    name: string;
  }>>({});
  readonly relationError = signal('');
  readonly relationBusy = signal(false);
  private justSaved = false;
  private readonly groupPageSize = 10;

  readonly isEdit = computed(() => !!this.item()?.id);
  readonly titleKey = computed(() => (this.isEdit() ? 'CATALOG_ITEM_FORM_EDIT_TITLE' : 'CATALOG_ITEM_FORM_CREATE_TITLE'));
  readonly fields = computed<CatalogAttributeField[]>(() => this.type()?.attributes_schema?.fields ?? []);
  readonly versionWarning = computed(() => this.isEdit() && (this.type()?.versioned ?? true));
  readonly relationTabs = computed<CatalogRelationType[]>(() => {
    const relations = new Set<CatalogRelationType>(this.type()?.allowed_relations ?? []);
    for (const group of this.relationGroups()) {
      relations.add(group.relation_type);
    }
    return [...relations];
  });
  readonly activeRelation = computed<CatalogRelationType | null>(() => {
    const tab = this.activeTab();
    return tab === 'info' ? null : (tab as CatalogRelationType);
  });

  constructor() {
    effect(() => {
      const open = this.isOpen();
      const item = this.item();
      if (!open) {
        return;
      }
      this.reset(item);
    });
  }

  private reset(item: CatalogItemDto | null): void {
    this.code.set(item?.code ?? '');
    this.name.set(item?.name ?? '');
    this.nameEn.set(item?.name_en ?? '');
    this.description.set(item?.description ?? '');
    this.sortOrder.set(String(item?.sort_order ?? 0));
    this.status.set(item?.status ?? CatalogStatus.ACTIVE);
    this.attributes.set(item?.attributes ? { ...item.attributes } : {});
    this.errorText.set('');
    this.relationError.set('');
    this.links.set({ parents: [], children: [] });
    this.relationGroups.set([]);
    this.activeTab.set('info');
    this.pickedParent.set(null);
    this.pickedChild.set(null);
    this.parentNewCode.set('');
    this.parentNewName.set('');
    this.childNewCode.set('');
    this.childNewName.set('');
    this.groupState.set({});
    if (item?.id && this.type()?.code) {
      this.loadRelations();
    }
  }

  private loadRelations(): void {
    const type = this.type();
    const item = this.item();
    if (!type?.code || !item?.id) {
      return;
    }
    this.catalog.getTypeRelations(type.code, this.scope()).subscribe({
      next: (res) => {
        const groups = res?.data?.relations ?? [];
        this.relationGroups.set(groups);
        const parents: Record<string, string> = {};
        const children: Record<string, string> = {};
        for (const group of groups) {
          parents[group.relation_type] = group.parents[0]?.code ?? '';
          children[group.relation_type] = group.children[0]?.code ?? '';
        }
        for (const relation of this.relationTabs()) {
          if (!parents[relation]) {
            parents[relation] = this.parentOptions(relation)[0]?.value ?? '';
          }
        }
        this.parentTypeByRelation.set(parents);
        this.childTypeByRelation.set(children);
        if (this.justSaved && groups.length) {
          this.activeTab.set(groups[0].relation_type);
          this.justSaved = false;
        }
      }
    });
    this.loadLinks();
  }

  private loadLinks(): void {
    const item = this.item();
    if (!item?.id) {
      return;
    }
    this.catalog.getItem(item.id, this.scope(), true).subscribe({
      next: (res) => {
        this.links.set({
          parents: res?.data?.parents ?? [],
          children: res?.data?.children ?? []
        });
      }
    });
  }

  // ---------------------------------------------------------------------
  // Relation helpers
  // ---------------------------------------------------------------------

  groupFor(relation: CatalogRelationType): CatalogTypeRelationGroup | undefined {
    return this.relationGroups().find((group) => group.relation_type === relation);
  }

  parentOptions(relation: CatalogRelationType): { value: string; label: string }[] {
    const parents = this.groupFor(relation)?.parents ?? [];
    const codes = parents.length
      ? parents.map((type) => type.code)
      : (this.type()?.allowed_parent_types?.length
        ? this.type()!.allowed_parent_types!
        : (this.type()?.code ? [this.type()!.code] : []));
    return codes.map((code) => ({ value: code, label: code }));
  }

  childOptions(relation: CatalogRelationType): { value: string; label: string }[] {
    return (this.groupFor(relation)?.children ?? []).map((type) => ({ value: type.code, label: type.code }));
  }

  parentsFor(relation: CatalogRelationType): CatalogItemLink[] {
    return this.links().parents.filter((link) => link.relation_type === relation);
  }

  childGroups(relation: CatalogRelationType): { typeCode: string; links: CatalogItemLink[] }[] {
    const groups = new Map<string, CatalogItemLink[]>();
    for (const option of this.childOptions(relation)) {
      groups.set(option.value, []);
    }
    for (const link of this.links().children.filter((entry) => entry.relation_type === relation)) {
      const code = link.type_code || '';
      const list = groups.get(code) ?? [];
      list.push(link);
      groups.set(code, list);
    }
    return [...groups.entries()].map(([typeCode, entries]) => ({ typeCode, links: entries }));
  }

  parentTypeOf(relation: CatalogRelationType): string {
    return this.parentTypeByRelation()[relation] ?? '';
  }

  childTypeOf(relation: CatalogRelationType): string {
    return this.childTypeByRelation()[relation] ?? '';
  }

  selectParentType(relation: CatalogRelationType, code: string): void {
    this.parentTypeByRelation.update((map) => ({ ...map, [relation]: code }));
    this.pickedParent.set(null);
  }

  selectChildType(relation: CatalogRelationType, code: string): void {
    this.childTypeByRelation.update((map) => ({ ...map, [relation]: code }));
    this.pickedChild.set(null);
  }

  onParentPicked(ref: CatalogItemRef | CatalogItemRef[] | null): void {
    this.pickedParent.set(Array.isArray(ref) ? ref[0] ?? null : ref);
  }

  onChildPicked(ref: CatalogItemRef | CatalogItemRef[] | null): void {
    this.pickedChild.set(Array.isArray(ref) ? ref[0] ?? null : ref);
  }

  addParent(relation: CatalogRelationType): void {
    const item = this.item();
    const picked = this.pickedParent();
    if (!item?.id || !picked?.catalog_item_id) {
      this.relationError.set(this.i18n.t('CATALOG_EDGE_PARENT_REQUIRED'));
      return;
    }
    this.createEdge(picked.catalog_item_id, item.id, relation);
  }

  addChild(relation: CatalogRelationType): void {
    const item = this.item();
    const picked = this.pickedChild();
    if (!item?.id || !picked?.catalog_item_id) {
      this.relationError.set(this.i18n.t('CATALOG_EDGE_CHILD_REQUIRED'));
      return;
    }
    this.createEdge(item.id, picked.catalog_item_id, relation);
  }

  private createEdge(parentId: string, childId: string, relation: CatalogRelationType): void {
    this.relationBusy.set(true);
    this.relationError.set('');
    this.catalog.createEdge({ parent_item_id: parentId, child_item_id: childId, relation_type: relation }, this.scope()).subscribe({
      next: () => {
        this.relationBusy.set(false);
        this.pickedParent.set(null);
        this.pickedChild.set(null);
        this.loadLinks();
      },
      error: (err) => {
        this.relationBusy.set(false);
        const apiError = err as ApiErrorResponse;
        this.relationError.set(this.i18n.t(apiError?.code || 'INTERNAL_SERVER_ERROR', apiError?.params));
      }
    });
  }

  removeLink(link: CatalogItemLink): void {
    this.relationBusy.set(true);
    this.relationError.set('');
    this.catalog.deleteEdge(link.edge_id, this.scope()).subscribe({
      next: () => {
        this.relationBusy.set(false);
        this.loadLinks();
      },
      error: (err) => {
        this.relationBusy.set(false);
        const apiError = err as ApiErrorResponse;
        this.relationError.set(this.i18n.t(apiError?.code || 'INTERNAL_SERVER_ERROR', apiError?.params));
      }
    });
  }

  // ---------------------------------------------------------------------
  // Relation groups: collapse / pagination / quick create
  // ---------------------------------------------------------------------

  groupKey(relation: CatalogRelationType, typeCode: string): string {
    return `${relation}|${typeCode}`;
  }

  groupStateFor(key: string): { collapsed: boolean; page: number; quick: boolean; code: string; name: string } {
    return this.groupState()[key] ?? { collapsed: false, page: 1, quick: false, code: '', name: '' };
  }

  private updateGroup(key: string, patch: Partial<{ collapsed: boolean; page: number; quick: boolean; code: string; name: string }>): void {
    this.groupState.update((map) => ({ ...map, [key]: { ...this.groupStateFor(key), ...patch } }));
  }

  toggleGroup(key: string): void {
    this.updateGroup(key, { collapsed: !this.groupStateFor(key).collapsed });
  }

  groupPages(links: CatalogItemLink[]): number {
    return Math.max(1, Math.ceil(links.length / this.groupPageSize));
  }

  groupPage(key: string): number {
    return this.groupStateFor(key).page;
  }

  pagedGroupLinks(key: string, links: CatalogItemLink[]): CatalogItemLink[] {
    const page = Math.min(this.groupPage(key), this.groupPages(links));
    const start = (page - 1) * this.groupPageSize;
    return links.slice(start, start + this.groupPageSize);
  }

  changeGroupPage(key: string, links: CatalogItemLink[], delta: number): void {
    const next = Math.min(Math.max(1, this.groupPage(key) + delta), this.groupPages(links));
    this.updateGroup(key, { page: next });
  }

  quickOpen(key: string): boolean {
    return this.groupStateFor(key).quick;
  }

  toggleQuick(key: string): void {
    this.updateGroup(key, { quick: !this.groupStateFor(key).quick });
  }

  quickCode(key: string): string {
    return this.groupStateFor(key).code;
  }

  quickName(key: string): string {
    return this.groupStateFor(key).name;
  }

  setQuick(key: string, field: 'code' | 'name', value: string): void {
    this.updateGroup(key, { [field]: value });
  }

  quickCreateGroupChild(relation: CatalogRelationType, typeCode: string, key: string): void {
    const item = this.item();
    const state = this.groupStateFor(key);
    const code = state.code.trim().toUpperCase();
    const name = state.name.trim();
    if (!item?.id || !code || !name) {
      this.relationError.set(this.i18n.t('CATALOG_ITEM_REQUIRED_FIELDS'));
      return;
    }
    this.relationBusy.set(true);
    this.relationError.set('');
    this.catalog.createItem(typeCode, { code, name, status: CatalogStatus.ACTIVE }, this.scope()).subscribe({
      next: (res) => {
        const childId = res?.data?.id;
        if (!childId) {
          this.relationBusy.set(false);
          this.relationError.set(this.i18n.t('INTERNAL_SERVER_ERROR'));
          return;
        }
        this.catalog.createEdge(
          { parent_item_id: item.id, child_item_id: childId, relation_type: relation },
          this.scope()
        ).subscribe({
          next: () => {
            this.relationBusy.set(false);
            this.updateGroup(key, { quick: false, code: '', name: '' });
            this.loadLinks();
          },
          error: (err) => {
            this.relationBusy.set(false);
            const apiError = err as ApiErrorResponse;
            this.relationError.set(this.i18n.t(apiError?.code || 'INTERNAL_SERVER_ERROR', apiError?.params));
          }
        });
      },
      error: (err) => {
        this.relationBusy.set(false);
        const apiError = err as ApiErrorResponse;
        this.relationError.set(this.i18n.t(apiError?.code || 'INTERNAL_SERVER_ERROR', apiError?.params));
      }
    });
  }

  requestChildType(relation: CatalogRelationType): void {
    const parent = this.type();
    const code = this.childNewCode().trim().toUpperCase();
    const name = this.childNewName().trim() || code;
    if (!parent?.code || !code) {
      this.relationError.set(this.i18n.t('CATALOG_TYPE_REQUIRED_FIELDS'));
      return;
    }
    this.relationBusy.set(true);
    this.relationError.set('');
    this.catalog.createType({
      code,
      name_key: name,
      hierarchy_mode: CatalogHierarchyMode.TREE,
      allowed_relations: [relation],
      allow_free_text: false,
      status: CatalogStatus.ACTIVE
    }, this.scope()).subscribe({
      next: () => {
        this.catalog.replaceTypeRelations(code, {
          relation_type: relation,
          parent_codes: [parent.code],
          child_codes: []
        }, this.scope()).subscribe({
          next: () => {
            this.relationBusy.set(false);
            this.childNewCode.set('');
            this.childNewName.set('');
            this.loadRelations();
          },
          error: (err) => {
            this.relationBusy.set(false);
            const apiError = err as ApiErrorResponse;
            this.relationError.set(this.i18n.t(apiError?.code || 'INTERNAL_SERVER_ERROR', apiError?.params));
          }
        });
      },
      error: (err) => {
        this.relationBusy.set(false);
        const apiError = err as ApiErrorResponse;
        this.relationError.set(this.i18n.t(apiError?.code || 'INTERNAL_SERVER_ERROR', apiError?.params));
      }
    });
  }

  requestParentType(relation: CatalogRelationType): void {
    const child = this.type();
    const code = this.parentNewCode().trim().toUpperCase();
    const name = this.parentNewName().trim() || code;
    if (!child?.code || !code) {
      this.relationError.set(this.i18n.t('CATALOG_TYPE_REQUIRED_FIELDS'));
      return;
    }
    this.relationBusy.set(true);
    this.relationError.set('');
    this.catalog.createType({
      code,
      name_key: name,
      hierarchy_mode: CatalogHierarchyMode.TREE,
      allowed_relations: [relation],
      allow_free_text: false,
      status: CatalogStatus.ACTIVE
    }, this.scope()).subscribe({
      next: () => {
        this.catalog.replaceTypeRelations(code, {
          relation_type: relation,
          parent_codes: [],
          child_codes: [child.code]
        }, this.scope()).subscribe({
          next: () => {
            this.relationBusy.set(false);
            this.parentNewCode.set('');
            this.parentNewName.set('');
            this.loadRelations();
          },
          error: (err) => {
            this.relationBusy.set(false);
            const apiError = err as ApiErrorResponse;
            this.relationError.set(this.i18n.t(apiError?.code || 'INTERNAL_SERVER_ERROR', apiError?.params));
          }
        });
      },
      error: (err) => {
        this.relationBusy.set(false);
        const apiError = err as ApiErrorResponse;
        this.relationError.set(this.i18n.t(apiError?.code || 'INTERNAL_SERVER_ERROR', apiError?.params));
      }
    });
  }

  // ---------------------------------------------------------------------
  // Item fields
  // ---------------------------------------------------------------------

  attrText(key: string): string {
    const value = this.attributes()[key];
    return value === null || value === undefined ? '' : String(value);
  }

  attrBoolean(key: string): boolean {
    return this.attributes()[key] === true;
  }

  setAttr(field: CatalogAttributeField, value: string): void {
    this.attributes.update((attributes) => ({
      ...attributes,
      [field.key]: field.type === 'NUMBER' && value !== '' ? Number(value) : value
    }));
  }

  setAttrBoolean(key: string, checked: boolean): void {
    this.attributes.update((attributes) => ({ ...attributes, [key]: checked }));
  }

  save(): void {
    if (this.saving()) {
      return;
    }
    if (!this.code().trim() || !this.name().trim()) {
      this.errorText.set(this.i18n.t('CATALOG_ITEM_REQUIRED_FIELDS'));
      return;
    }
    const payload: CatalogItemPayload = {
      code: this.code().trim().toUpperCase(),
      name: this.name().trim(),
      name_en: this.nameEn().trim() || null,
      description: this.description().trim() || null,
      attributes: Object.keys(this.attributes()).length ? this.attributes() : null,
      sort_order: Number(this.sortOrder()) || 0,
      status: this.status()
    };

    this.saving.set(true);
    this.errorText.set('');
    const typeCode = this.type()?.code;
    if (!typeCode) {
      this.saving.set(false);
      this.errorText.set(this.i18n.t('INTERNAL_SERVER_ERROR'));
      return;
    }
    const request = this.isEdit()
      ? this.catalog.updateItem(this.item()!.id, payload, this.scope())
      : this.catalog.createItem(typeCode, payload, this.scope());
    request.subscribe({
      next: (res) => {
        this.saving.set(false);
        this.justSaved = true;
        this.savedItem.emit(res.data);
        this.saved.emit(res.code);
      },
      error: (err) => {
        this.saving.set(false);
        const apiError = err as ApiErrorResponse;
        this.errorText.set(this.i18n.t(apiError?.code || 'INTERNAL_SERVER_ERROR', apiError?.params));
      }
    });
  }
}
