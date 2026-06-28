import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';
import {
  FormRendererComponent,
  DragPaletteComponent,
  IconComponent,
  DndItem,
  FormSchema,
  FormField,
  FieldType,
  GridColumnDef,
  ToastService,
} from '@open-erp/shared';
import {
  PANEL_TEMPLATES,
  FIELD_PALETTE_ITEMS,
  OPERATORS,
  ACTIONS,
  FIELD_TYPE_LABELS,
  FIELD_TYPE_ICONS,
  I18N_LABELS,
  PanelTemplateDef,
} from './dynamic-form-builder.constants';

// ─── Panel Layout Engine Models ───────────────────────────────────────────────

export interface PanelItem {
  kind: 'field' | 'panel';
  id: string;
}

export interface PanelColumn {
  id: string;
  colSpan: number;
  items: PanelItem[];
}

export interface PanelTab {
  id: string;
  label: string;
  icon: string;
  columns: PanelColumn[];
}

export interface DeviceLayout {
  cols: number;
  colSpan: number;
}

export interface FormPanel {
  id: string;
  name: string;
  type: 'default' | 'tab' | 'card';
  layout: {
    desktop: DeviceLayout;
    tablet: DeviceLayout;
    mobile: DeviceLayout;
  };
  columns: PanelColumn[];
  tabs?: PanelTab[];
  activeTabId?: string;
  parentPanelId?: string;
  parentColumnId?: string;
}

// ─── Component ────────────────────────────────────────────────────────────────

@Component({
  selector: 'app-dynamic-form-builder',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    FormRendererComponent,
    DragPaletteComponent,
    IconComponent,
    DragDropModule,
  ],
  templateUrl: './dynamic-form-builder.component.html',
  styleUrls: ['./dynamic-form-builder.component.css'],
})
export class DynamicFormBuilderComponent implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly toastService = inject(ToastService);

  // Expose constants to template
  readonly i18n = I18N_LABELS;
  readonly panelTemplates = PANEL_TEMPLATES;
  readonly fieldPaletteItems = FIELD_PALETTE_ITEMS;
  readonly operators = OPERATORS;
  readonly actions = ACTIONS;

  // ── Form metadata ─────────────────────────────────────────────────────
  formKey        = signal<string>('custom_dynamic_form');
  formTitle      = signal<string>(this.i18n.tabLabelDefault + '1');
  formDescription = signal<string>('');
  submitEndpoint = signal<string>('');

  // ── Canvas state ──────────────────────────────────────────────────────
  panels    = signal<FormPanel[]>([]);
  fields    = signal<FormField[]>([]);
  rootItems = signal<PanelItem[]>([]); // Unified list of root panels and fields

  // ── Selection & UI state ──────────────────────────────────────────────
  selectedPanel  = signal<FormPanel | null>(null);
  selectedField  = signal<FormField | null>(null);
  viewMode       = signal<'edit' | 'preview'>('edit');
  previewDevice  = signal<'desktop' | 'tablet' | 'mobile'>('desktop');
  activePropTab  = signal<'general' | 'layout' | 'data' | 'rules' | 'grid'>('general');

  // ── History ───────────────────────────────────────────────────────────
  private history: { fields: FormField[]; panels: FormPanel[]; rootItems: PanelItem[] }[] = [];
  private redoStack: typeof DynamicFormBuilderComponent.prototype.history = [];

  /** DndItems cho palette panel templates */
  panelTemplatePalette: DndItem[] = this.panelTemplates.map(t => ({
    id: t.id, type: 'panel-template', data: t.id, label: t.name, icon: t.icon,
  }));

  // ── Computed: All CDK drop list IDs (recursive through panels) ─────────
  allDropListIds = computed<string[]>(() => {
    const ids: string[] = ['workspace-main'];
    this.collectColumnIds(this.panels(), ids);
    return ids;
  });

  /** Map: columnId → { panelId, tabId? } — for quick lookup */
  columnLookupMap = computed<Map<string, { panelId: string; tabId?: string }>>(() => {
    const map = new Map<string, { panelId: string; tabId?: string }>();
    this.panels().forEach(p => {
      if (p.type === 'tab' && p.tabs) {
        p.tabs.forEach(tab => tab.columns.forEach(col => map.set(col.id, { panelId: p.id, tabId: tab.id })));
      } else {
        p.columns.forEach(col => map.set(col.id, { panelId: p.id }));
      }
    });
    return map;
  });

  /** Compiled schema for live form preview */
  compiledSchema = computed<FormSchema>(() => ({
    id: this.formKey(),
    title: this.formTitle(),
    description: this.formDescription(),
    fields: this.fields(),
    submitEndpoint: this.submitEndpoint(),
    meta: {
      panels: this.panels(),
      rootItems: this.rootItems(),
      // Tương thích ngược cho renderer cũ:
      rootPanelOrder: this.rootItems().filter(i => i.kind === 'panel').map(i => i.id),
      topLevelFieldOrder: this.rootItems().filter(i => i.kind === 'field').map(i => i.id),
    },
  }));

  ngOnInit(): void {
    this.loadFormDesign();
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // Load / Save
  // ═══════════════════════════════════════════════════════════════════════════

  loadFormDesign(): void {
    this.http.get<any>(`/api/v1/dynamic-forms/key/${this.formKey()}`).subscribe({
      next: (res) => {
        if (res?.success && res.data) {
          this.formTitle.set(res.data.name || this.i18n.title);
          this.formDescription.set(res.data.description || '');
          this.fields.set((res.data.fields || []).map((f: any) => ({
            ...f,
            type: f.type?.toUpperCase() as FieldType
          })));
          const meta = res.data.meta || {};
          this.panels.set(meta.panels || []);

          // Nâng cấp dữ liệu cũ sang cấu trúc rootItems
          if (meta.rootItems) {
            this.rootItems.set(meta.rootItems);
          } else {
            const rItems: PanelItem[] = [];
            (meta.rootPanelOrder || []).forEach((id: string) => rItems.push({ kind: 'panel', id }));
            (meta.topLevelFieldOrder || []).forEach((id: string) => rItems.push({ kind: 'field', id }));
            this.rootItems.set(rItems);
          }

          this.saveHistory();
          this.toastService.showSuccess(this.i18n.msgLoadSuccess);
        }
      },
      error: () => this.saveHistory(),
    });
  }

  saveFormDesign(): void {
    const payload = {
      formKey: this.formKey(),
      name: this.formTitle(),
      description: this.formDescription(),
      fields: this.fields(),
      meta: {
        panels: this.panels(),
        rootItems: this.rootItems(),
        rootPanelOrder: this.rootItems().filter(i => i.kind === 'panel').map(i => i.id),
        topLevelFieldOrder: this.rootItems().filter(i => i.kind === 'field').map(i => i.id),
      },
    };
    this.http.post<any>('/api/v1/dynamic-forms', payload).subscribe({
      next: (res) => {
        if (res?.success) {
          this.toastService.showSuccess(this.i18n.msgSaveSuccess);
        } else {
          this.toastService.showError(this.i18n.msgSaveFail + (res?.message ?? 'unknown'));
        }
      },
      error: () => this.toastService.showError(this.i18n.msgConnectionError),
    });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // Undo / Redo
  // ═══════════════════════════════════════════════════════════════════════════

  saveHistory(): void {
    this.history.push({
      fields:    JSON.parse(JSON.stringify(this.fields())),
      panels:    JSON.parse(JSON.stringify(this.panels())),
      rootItems: JSON.parse(JSON.stringify(this.rootItems())),
    });
    this.redoStack = [];
    if (this.history.length > 50) this.history.shift();
  }

  undo(): void {
    if (!this.history.length) return;
    const prev = this.history.pop()!;
    this.redoStack.push(prev);
    this.applySnapshot(prev);
    this.toastService.showSuccess(this.i18n.msgUndoSuccess);
  }

  redo(): void {
    if (!this.redoStack.length) return;
    const next = this.redoStack.pop()!;
    this.history.push(next);
    this.applySnapshot(next);
    this.toastService.showSuccess(this.i18n.msgRedoSuccess);
  }

  private applySnapshot(snap: typeof DynamicFormBuilderComponent.prototype.history[0]): void {
    this.fields.set(JSON.parse(JSON.stringify(snap.fields)));
    this.panels.set(JSON.parse(JSON.stringify(snap.panels)));
    this.rootItems.set(JSON.parse(JSON.stringify(snap.rootItems)));
    this.selectedField.set(null);
    this.selectedPanel.set(null);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // Panel Operations
  // ═══════════════════════════════════════════════════════════════════════════

  addPanel(template: PanelTemplateDef): void {
    const panel = this.buildPanelFromTemplate(template);
    this.panels.update(p => [...p, panel]);
    this.rootItems.update(items => [...items, { kind: 'panel', id: panel.id }]);
    this.selectPanel(panel);
    this.saveHistory();
    this.toastService.showSuccess(this.i18n.msgAddPanelSuccess.replace('{name}', template.name));
  }

  addNestedPanel(targetColumnId: string, template: PanelTemplateDef): void {
    const panel = this.buildPanelFromTemplate(template);
    const info = this.columnLookupMap().get(targetColumnId);
    panel.parentPanelId = info?.panelId;
    panel.parentColumnId = targetColumnId;

    this.panels.update(p => [...p, panel]);
    this.mutateColumn(targetColumnId, col => ({
      ...col, items: [...col.items, { kind: 'panel', id: panel.id }],
    }));
    this.selectPanel(panel);
    this.saveHistory();
    this.toastService.showSuccess(this.i18n.msgAddNestedPanelSuccess);
  }

  private buildPanelFromTemplate(t: PanelTemplateDef): FormPanel {
    const rand = Math.random().toString(36).substring(2, 7);
    if (t.type === 'tab') {
      const tabs: PanelTab[] = [0, 1, 2].map(i => ({
        id: `tab_${rand}_${i}`,
        label: `${this.i18n.tabLabelDefault}${i + 1}`,
        icon: 'file-text',
        columns: [{ id: `col_${rand}_t${i}`, colSpan: 12, items: [] }],
      }));
      return {
        id: `panel_${rand}`, name: this.i18n.propsPanelTabManage, type: 'tab',
        layout: {
          desktop: { cols: 1, colSpan: 12 },
          tablet:  { cols: 1, colSpan: 12 },
          mobile:  { cols: 1, colSpan: 12 },
        },
        columns: [], tabs, activeTabId: tabs[0].id,
      };
    }
    return {
      id: `panel_${rand}`, name: t.name, type: t.type,
      layout: {
        desktop: { cols: t.desktopCols, colSpan: 12 },
        tablet:  { cols: t.tabletCols,  colSpan: 12 },
        mobile:  { cols: t.mobileCols,  colSpan: 12 },
      },
      columns: t.colSpans.map((span, i) => ({ id: `col_${rand}_${i}`, colSpan: span, items: [] })),
    };
  }

  deletePanel(panelId: string, event?: MouseEvent): void {
    event?.stopPropagation();
    const toDelete = [panelId, ...this.collectNestedPanelIds(panelId)];

    this.fields.update(fs => fs.filter(f => !toDelete.includes(f.layout?.panelId ?? '')));
    this.panels.update(ps => ps
      .filter(p => !toDelete.includes(p.id))
      .map(p => this.removeItemsFromPanel(p, item => toDelete.includes(item.id) && item.kind === 'panel'))
    );
    this.rootItems.update(items => items.filter(i => !toDelete.includes(i.id)));
    if (this.selectedPanel()?.id && toDelete.includes(this.selectedPanel()!.id)) this.selectedPanel.set(null);
    this.saveHistory();
    this.toastService.showSuccess(this.i18n.msgDeletePanelSuccess);
  }

  selectPanel(panel: FormPanel): void {
    this.selectedPanel.set({ ...panel });
    this.selectedField.set(null);
  }

  clearSelection(event: MouseEvent): void {
    if ((event.target as HTMLElement).closest('[data-no-deselect]')) return;
    this.selectedPanel.set(null);
    this.selectedField.set(null);
  }

  updatePanelProp(prop: keyof FormPanel, value: any): void {
    const p = this.selectedPanel();
    if (!p) return;
    const updated = { ...p, [prop]: value };
    this.selectedPanel.set(updated);
    this.panels.update(ps => ps.map(x => x.id === p.id ? updated : x));
  }

  updatePanelLayout(device: 'desktop' | 'tablet' | 'mobile', prop: 'cols' | 'colSpan', value: number): void {
    const p = this.selectedPanel();
    if (!p) return;
    const updated: FormPanel = {
      ...p, layout: { ...p.layout, [device]: { ...p.layout[device], [prop]: value } },
    };
    this.selectedPanel.set(updated);
    this.panels.update(ps => ps.map(x => x.id === p.id ? updated : x));
  }

  mutateColumnSpan(panelId: string, columnId: string, colSpan: number): void {
    this.panels.update(ps => ps.map(p => {
      if (p.id !== panelId) return p;
      return {
        ...p,
        columns: p.columns.map(c => c.id === columnId ? { ...c, colSpan } : c),
        tabs: p.tabs?.map(t => ({
          ...t,
          columns: t.columns.map(c => c.id === columnId ? { ...c, colSpan } : c),
        })),
      };
    }));
    const updated = this.getPanelById(panelId);
    if (updated) this.selectedPanel.set(updated);
  }

  moveItemUp(itemId: string): void {
    this.rootItems.update(items => {
      const idx = items.findIndex(i => i.id === itemId);
      if (idx <= 0) return items;
      const copy = [...items];
      [copy[idx - 1], copy[idx]] = [copy[idx], copy[idx - 1]];
      return copy;
    });
    this.saveHistory();
  }

  moveItemDown(itemId: string): void {
    this.rootItems.update(items => {
      const idx = items.findIndex(i => i.id === itemId);
      if (idx < 0 || idx >= items.length - 1) return items;
      const copy = [...items];
      [copy[idx], copy[idx + 1]] = [copy[idx + 1], copy[idx]];
      return copy;
    });
    this.saveHistory();
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // Tab Operations
  // ═══════════════════════════════════════════════════════════════════════════

  addTabToPanel(panelId: string): void {
    const panel = this.getPanelById(panelId);
    if (!panel) return;
    const rand = Math.random().toString(36).substring(2, 7);
    const newTab: PanelTab = {
      id: `tab_${rand}`,
      label: `${this.i18n.tabLabelDefault}${(panel.tabs?.length ?? 0) + 1}`,
      icon: 'file-text',
      columns: [{ id: `col_${rand}`, colSpan: 12, items: [] }],
    };
    const updated: FormPanel = { ...panel, tabs: [...(panel.tabs ?? []), newTab] };
    this.panels.update(ps => ps.map(p => p.id === panelId ? updated : p));
    this.selectedPanel.set(updated);
  }

  removeTabFromPanel(panelId: string, tabId: string): void {
    const panel = this.getPanelById(panelId);
    if (!panel?.tabs || panel.tabs.length <= 1) return;
    const tab = panel.tabs.find(t => t.id === tabId);
    if (!tab) return;

    tab.columns.forEach(col => col.items
      .filter(i => i.kind === 'field')
      .forEach(i => this.clearFieldLayout(i.id))
    );

    const newTabs = panel.tabs.filter(t => t.id !== tabId);
    const updated: FormPanel = {
      ...panel, tabs: newTabs,
      activeTabId: panel.activeTabId === tabId ? newTabs[0]?.id : panel.activeTabId,
    };
    this.panels.update(ps => ps.map(p => p.id === panelId ? updated : p));
    this.selectedPanel.set(updated);
  }

  setActiveTab(panelId: string, tabId: string, event?: MouseEvent): void {
    event?.stopPropagation();
    this.panels.update(ps => ps.map(p => p.id === panelId ? { ...p, activeTabId: tabId } : p));
    const updated = this.getPanelById(panelId);
    if (updated && this.selectedPanel()?.id === panelId) this.selectedPanel.set(updated);
  }

  updateTabLabel(panelId: string, tabId: string, label: string): void {
    this.panels.update(ps => ps.map(p =>
      p.id !== panelId ? p : { ...p, tabs: p.tabs?.map(t => t.id === tabId ? { ...t, label } : t) }
    ));
    const updated = this.getPanelById(panelId);
    if (updated) this.selectedPanel.set(updated);
  }

  addColumnToPanel(panelId: string, tabId?: string): void {
    const rand = Math.random().toString(36).substring(2, 7);
    const newCol: PanelColumn = { id: `col_${rand}`, colSpan: 6, items: [] };
    this.panels.update(ps => ps.map(p => {
      if (p.id !== panelId) return p;
      if (tabId) return { ...p, tabs: p.tabs?.map(t => t.id === tabId ? { ...t, columns: [...t.columns, newCol] } : t) };
      return { ...p, columns: [...p.columns, newCol] };
    }));
    const updated = this.getPanelById(panelId);
    if (updated) this.selectedPanel.set(updated);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // Field Operations
  // ═══════════════════════════════════════════════════════════════════════════

  addFieldFromPalette(rawType: any): void {
    const type = (rawType && typeof rawType === 'object' && 'data' in rawType) ? rawType.data : rawType;
    const field = this.createNewField(type as FieldType);
    this.fields.update(fs => [...fs, field]);
    this.rootItems.update(items => [...items, { kind: 'field', id: field.id }]);
    this.selectField(field);
    this.saveHistory();
    this.toastService.showSuccess(this.i18n.msgAddFieldSuccess.replace('{name}', this.getFieldLabelText(type)));
  }

  createNewField(type: FieldType): FormField {
    const rand = Math.random().toString(36).substring(2, 7);
    const upperType = (type && typeof type === 'string' ? type.toUpperCase() : type) as FieldType;
    const labelText = this.getFieldLabelText(upperType);
    const field: FormField = {
      id: `field_${rand}`, name: `input_${rand}`,
      label: `${this.i18n.gridColLabelDefault}${labelText}`, type: upperType,
      required: false, readOnly: false, hidden: false,
      placeholder: '...',
      layout: { colSpanDesktop: 12, colSpanTablet: 12, colSpanMobile: 12 },
    };
    if (upperType === FieldType.SELECT) {
      field.options = [
        { label: `${this.i18n.optionLabelDefault}A`, value: 'a' },
        { label: `${this.i18n.optionLabelDefault}B`, value: 'b' },
      ];
    } else if (upperType === FieldType.GRID) {
      field.columns = [
        { name: 'col1', label: `${this.i18n.gridColLabelDefault}1`, type: FieldType.TEXT, required: false },
        { name: 'col2', label: `${this.i18n.gridColLabelDefault}2`, type: FieldType.NUMBER, required: false },
      ];
    }
    return field;
  }

  deleteField(fieldId: string, event?: MouseEvent): void {
    event?.stopPropagation();
    this.panels.update(ps => ps.map(p => this.removeItemsFromPanel(p, i => i.id === fieldId && i.kind === 'field')));
    this.fields.update(fs => fs.filter(f => f.id !== fieldId));
    this.rootItems.update(items => items.filter(i => i.id !== fieldId));
    if (this.selectedField()?.id === fieldId) this.selectedField.set(null);
    this.saveHistory();
    this.toastService.showSuccess(this.i18n.msgDeleteFieldSuccess);
  }

  selectField(field: FormField | undefined): void {
    if (!field) return;
    this.selectedField.set({ ...field });
    this.selectedPanel.set(null);
    this.activePropTab.set(
      field.type === FieldType.GRID ? 'grid' :
      field.type === FieldType.SELECT ? 'data' : 'general'
    );
  }

  updateFieldProperty(prop: keyof FormField, value: any): void {
    const f = this.selectedField();
    if (!f) return;
    const updated = { ...f, [prop]: value } as FormField;
    this.selectedField.set(updated);
    this.fields.update(fs => fs.map(x => x.id === f.id ? updated : x));
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // Drag-and-Drop Core
  // ═══════════════════════════════════════════════════════════════════════════

  onItemDropped(event: CdkDragDrop<PanelItem[]>): void {
    const sourceId = event.previousContainer.id;
    const targetId = event.container.id;

    // ── Kéo từ Left Palette ───────────────────────────────────────────
    if (sourceId === 'drag-palette' || sourceId === 'panel-palette') {
      const dndItem = event.item.data as DndItem;
      const rawData = dndItem?.data ?? dndItem;

      // 1. Kéo Panel Template
      if (dndItem?.type === 'panel-template' || sourceId === 'panel-palette') {
        const templateId = dndItem?.data ?? dndItem;
        const tpl = this.panelTemplates.find(t => t.id === templateId);
        if (tpl) {
          const panel = this.buildPanelFromTemplate(tpl);
          this.panels.update(p => [...p, panel]);

          if (targetId === 'workspace-main') {
            this.rootItems.update(items => this.insertAt(items, { kind: 'panel', id: panel.id }, event.currentIndex));
          } else {
            panel.parentPanelId = this.columnLookupMap().get(targetId)?.panelId;
            panel.parentColumnId = targetId;
            this.mutateColumn(targetId, col => ({
              ...col, items: this.insertAt(col.items, { kind: 'panel', id: panel.id }, event.currentIndex),
            }));
          }
          this.selectPanel(panel);
          this.saveHistory();
        }
        return;
      }

      // 2. Kéo Field linh kiện
      const field = this.createNewField(rawData as FieldType);
      this.fields.update(fs => [...fs, field]);

      if (targetId === 'workspace-main') {
        this.rootItems.update(items => this.insertAt(items, { kind: 'field', id: field.id }, event.currentIndex));
      } else {
        this.mutateColumn(targetId, col => ({
          ...col, items: this.insertAt(col.items, { kind: 'field', id: field.id }, event.currentIndex),
        }));
        this.setFieldPanelId(field.id, targetId);
      }
      this.selectField(field);
      this.saveHistory();
      return;
    }

    // ── Di chuyển trong cùng 1 list ─────────────────────────────────────
    if (sourceId === targetId) {
      if (sourceId === 'workspace-main') {
        this.rootItems.update(items => {
          const copy = [...items];
          moveItemInArray(copy, event.previousIndex, event.currentIndex);
          return copy;
        });
      } else {
        this.mutateColumn(sourceId, col => {
          const copy = [...col.items];
          moveItemInArray(copy, event.previousIndex, event.currentIndex);
          return { ...col, items: copy };
        });
      }
      this.saveHistory();
      return;
    }

    // ── Di chuyển giữa các list khác nhau ──────────────────────────────
    const draggedItem = event.item.data as PanelItem;
    if (!draggedItem?.kind) return;

    // Ngăn chặn panel lồng nhau vượt quá 2 cấp độ sâu
    if (draggedItem.kind === 'panel' && targetId !== 'workspace-main') {
      const targetColInfo = this.columnLookupMap().get(targetId);
      if (targetColInfo?.panelId) {
        const targetPanel = this.getPanelById(targetColInfo.panelId);
        // Nếu target panel đã là nested panel (có parentPanelId), không cho phép lồng thêm panel vào nó nữa
        if (targetPanel?.parentPanelId) {
          this.toastService.showError('Không thể lồng phân khu vượt quá 2 cấp!');
          return;
        }
      }
    }

    // Xóa khỏi nguồn
    if (sourceId === 'workspace-main') {
      this.rootItems.update(items => items.filter((_, i) => i !== event.previousIndex));
    } else {
      this.mutateColumn(sourceId, col => ({
        ...col, items: col.items.filter((_, i) => i !== event.previousIndex),
      }));
    }

    // Thêm vào đích
    if (targetId === 'workspace-main') {
      if (draggedItem.kind === 'field') {
        this.clearFieldLayout(draggedItem.id);
      } else if (draggedItem.kind === 'panel') {
        this.panels.update(ps => ps.map(p => p.id === draggedItem.id
          ? { ...p, parentPanelId: undefined, parentColumnId: undefined } : p));
      }
      this.rootItems.update(items => this.insertAt(items, draggedItem, event.currentIndex));
    } else {
      if (draggedItem.kind === 'field') {
        this.setFieldPanelId(draggedItem.id, targetId);
      } else if (draggedItem.kind === 'panel') {
        const info = this.columnLookupMap().get(targetId);
        this.panels.update(ps => ps.map(p => p.id === draggedItem.id
          ? { ...p, parentPanelId: info?.panelId, parentColumnId: targetId } : p));
      }
      this.mutateColumn(targetId, col => ({
        ...col, items: this.insertAt(col.items, draggedItem, event.currentIndex),
      }));
    }
    this.saveHistory();
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // Private Helpers
  // ═══════════════════════════════════════════════════════════════════════════

  private collectColumnIds(panels: FormPanel[], ids: string[]): void {
    const rootPanels = panels.filter(p => !p.parentPanelId);
    const visit = (panel: FormPanel) => {
      const allCols: PanelColumn[] = panel.type === 'tab'
        ? (panel.tabs?.flatMap(t => t.columns) ?? [])
        : panel.columns;
      allCols.forEach(col => {
        ids.push(col.id);
        col.items.filter(i => i.kind === 'panel').forEach(item => {
          const nested = panels.find(p => p.id === item.id);
          if (nested) visit(nested);
        });
      });
    };
    rootPanels.forEach(visit);
  }

  private mutateColumn(columnId: string, updater: (col: PanelColumn) => PanelColumn): void {
    this.panels.update(ps => ps.map(p => {
      if (p.type === 'tab' && p.tabs) {
        return {
          ...p, tabs: p.tabs.map(tab => {
            const idx = tab.columns.findIndex(c => c.id === columnId);
            if (idx === -1) return tab;
            const cols = [...tab.columns]; cols[idx] = updater(cols[idx]);
            return { ...tab, columns: cols };
          }),
        };
      }
      const idx = p.columns.findIndex(c => c.id === columnId);
      if (idx === -1) return p;
      const cols = [...p.columns]; cols[idx] = updater(cols[idx]);
      return { ...p, columns: cols };
    }));
  }

  private setFieldPanelId(fieldId: string, columnId: string): void {
    const info = this.columnLookupMap().get(columnId);
    this.fields.update(fs => fs.map(f =>
      f.id === fieldId ? { ...f, layout: { ...f.layout, panelId: info?.panelId } } : f
    ));
  }

  private clearFieldLayout(fieldId: string): void {
    this.fields.update(fs => fs.map(f =>
      f.id === fieldId ? { ...f, layout: { ...f.layout, panelId: undefined } } : f
    ));
  }

  private removeItemsFromPanel(panel: FormPanel, pred: (item: PanelItem) => boolean): FormPanel {
    const filterCol = (col: PanelColumn): PanelColumn => ({ ...col, items: col.items.filter(i => !pred(i)) });
    return {
      ...panel,
      columns: panel.columns.map(filterCol),
      tabs: panel.tabs?.map(t => ({ ...t, columns: t.columns.map(filterCol) })),
    };
  }

  private collectNestedPanelIds(panelId: string): string[] {
    const panel = this.getPanelById(panelId);
    if (!panel) return [];
    const allCols: PanelColumn[] = panel.type === 'tab'
      ? (panel.tabs?.flatMap(t => t.columns) ?? []) : panel.columns;
    return allCols.flatMap(col =>
      col.items.filter(i => i.kind === 'panel').flatMap(i => [i.id, ...this.collectNestedPanelIds(i.id)])
    );
  }

  private insertAt<T>(arr: T[], item: T, index: number): T[] {
    const copy = [...arr]; copy.splice(index, 0, item); return copy;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // Public Template Helpers
  // ═══════════════════════════════════════════════════════════════════════════

  getPanelById(id: string): FormPanel | undefined {
    return this.panels().find(p => p.id === id);
  }

  getFieldById(id: string): FormField | undefined {
    return this.fields().find(f => f.id === id);
  }

  getRootPanels(): FormPanel[] {
    const all = this.panels();
    return this.rootItems()
      .filter(i => i.kind === 'panel')
      .map(i => all.find(p => p.id === i.id)!)
      .filter(Boolean);
  }

  getTopLevelFields(): FormField[] {
    const all = this.fields();
    return this.rootItems()
      .filter(i => i.kind === 'field')
      .map(i => all.find(f => f.id === i.id)!)
      .filter(Boolean);
  }

  getActiveColumns(panel: FormPanel): PanelColumn[] {
    if (panel.type === 'tab' && panel.tabs) {
      const active = panel.tabs.find(t => t.id === panel.activeTabId) ?? panel.tabs[0];
      return active?.columns ?? [];
    }
    return panel.columns;
  }

  getPanelGridStyle(panel: FormPanel): Record<string, string> {
    const cols = this.getActiveColumns(panel);
    if (!cols.length) return {};
    return { 'grid-template-columns': cols.map(c => `${c.colSpan}fr`).join(' ') };
  }

  // ── Validation helpers ──────────────────────────────────────────────────

  updateFieldValidation(ruleType: string, isChecked: boolean, val?: any): void {
    const f = this.selectedField();
    if (!f) return;
    let rules = [...(f.validation || [])];
    if (isChecked) {
      rules = rules.filter(r => r.type !== ruleType);
      rules.push({ type: ruleType as any, value: val, message: `${f.label} invalid!` });
    } else {
      rules = rules.filter(r => r.type !== ruleType);
    }
    this.updateFieldProperty('validation', rules);
  }

  hasValidation(ruleType: string): boolean {
    return !!this.selectedField()?.validation?.some(r => r.type === ruleType);
  }

  getValidationValue(ruleType: string): any {
    return this.selectedField()?.validation?.find(r => r.type === ruleType)?.value;
  }

  // ── Conditional rules ───────────────────────────────────────────────────

  addConditionalRule(): void {
    const f = this.selectedField();
    if (!f) return;
    const rules = [...(f.conditionalRules || [])];
    rules.push({ when: { field: '', operator: 'eq', value: '' }, then: { action: 'show', target: f.name } });
    this.updateFieldProperty('conditionalRules', rules);
  }

  removeConditionalRule(idx: number): void {
    const rules = [...(this.selectedField()?.conditionalRules || [])];
    rules.splice(idx, 1);
    this.updateFieldProperty('conditionalRules', rules);
  }

  updateConditionalWhen(idx: number, prop: string, value: any): void {
    const rules = JSON.parse(JSON.stringify(this.selectedField()?.conditionalRules ?? []));
    rules[idx].when[prop] = value; this.updateFieldProperty('conditionalRules', rules);
  }

  updateConditionalThen(idx: number, prop: string, value: any): void {
    const rules = JSON.parse(JSON.stringify(this.selectedField()?.conditionalRules ?? []));
    rules[idx].then[prop] = value; this.updateFieldProperty('conditionalRules', rules);
  }

  // ── Select options ──────────────────────────────────────────────────────

  addOption(): void {
    const opts = [...(this.selectedField()?.options || [])];
    opts.push({ label: `${this.i18n.optionLabelDefault}${opts.length + 1}`, value: `opt_${opts.length}` });
    this.updateFieldProperty('options', opts);
  }

  removeOption(idx: number): void {
    const opts = [...(this.selectedField()?.options || [])]; opts.splice(idx, 1);
    this.updateFieldProperty('options', opts);
  }

  updateOption(idx: number, prop: 'label' | 'value', value: string): void {
    const opts = JSON.parse(JSON.stringify(this.selectedField()?.options ?? []));
    opts[idx][prop] = value; this.updateFieldProperty('options', opts);
  }

  // ── Grid columns ────────────────────────────────────────────────────────

  addGridColumn(): void {
    const cols = [...(this.selectedField()?.columns || [])];
    cols.push({ name: `col_${cols.length + 1}`, label: `${this.i18n.gridColLabelDefault}${cols.length + 1}`, type: FieldType.TEXT, required: false });
    this.updateFieldProperty('columns', cols);
  }

  removeGridColumn(idx: number): void {
    const cols = [...(this.selectedField()?.columns || [])]; cols.splice(idx, 1);
    this.updateFieldProperty('columns', cols);
  }

  updateGridColumn(idx: number, prop: keyof GridColumnDef, value: any): void {
    const cols = JSON.parse(JSON.stringify(this.selectedField()?.columns ?? []));
    cols[idx][prop] = value; this.updateFieldProperty('columns', cols);
  }

  // ── Move field within column ────────────────────────────────────────────

  moveFieldUp(fieldId: string, columnId: string, event?: MouseEvent): void {
    event?.stopPropagation();
    this.mutateColumn(columnId, col => {
      const idx = col.items.findIndex(i => i.id === fieldId);
      if (idx <= 0) return col;
      const items = [...col.items]; [items[idx - 1], items[idx]] = [items[idx], items[idx - 1]];
      return { ...col, items };
    });
    this.saveHistory();
  }

  moveFieldDown(fieldId: string, columnId: string, event?: MouseEvent): void {
    event?.stopPropagation();
    this.mutateColumn(columnId, col => {
      const idx = col.items.findIndex(i => i.id === fieldId);
      if (idx < 0 || idx >= col.items.length - 1) return col;
      const items = [...col.items]; [items[idx], items[idx + 1]] = [items[idx + 1], items[idx]];
      return { ...col, items };
    });
    this.saveHistory();
  }

  // ── Icon & label maps ───────────────────────────────────────────────────

  getFieldIcon(type: FieldType): string {
    return FIELD_TYPE_ICONS[type] ?? 'circle';
  }

  getFieldLabelText(type: string): string {
    return FIELD_TYPE_LABELS[type] ?? type;
  }

  getTemplateById(id: string): PanelTemplateDef | undefined {
    return this.panelTemplates.find(t => t.id === id);
  }

  trackById(_: number, item: { id: string }): string { return item.id; }
  trackByStr(_: number, item: string): string { return item; }
}
export type PanelTemplate = PanelTemplateDef;
