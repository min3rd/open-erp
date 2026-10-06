import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButtons,
  IonBackButton,
  IonMenuButton,
} from '@ionic/angular/standalone';
import {
  BadgeComponent,
  CatalogHierarchyMode,
  CatalogItemDetail,
  CatalogLookupType,
  CatalogOptionItem,
  CatalogService,
  ColorVariant,
  I18nService,
  IconComponent,
  SelectOption,
  SharpButtonComponent,
  SharpInputComponent,
  SharpSelectComponent,
  SkeletonComponent,
  TranslateDirective,
  TranslatePipe,
  apiMessage
} from '@shared';
import { PagedList } from '../../../core/paged-list';

const PAGE_SIZE = 20;
const SEARCH_DEBOUNCE_MS = 250;

/**
 * Mobile read-only catalogue browser (TASK-387, DES-UI-S05-001 §4): type
 * selector, debounced search, lazy paging and an inline detail panel — no
 * modal, no create/edit/delete (those stay on the Web admin screen).
 */
@Component({
  selector: 'app-catalog-browse',
  standalone: true,
  imports: [
    CommonModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButtons,
    IonBackButton,
    IonMenuButton,
    BadgeComponent,
    SharpButtonComponent,
    SharpInputComponent,
    SharpSelectComponent,
    SkeletonComponent,
    IconComponent,
    TranslateDirective,
    TranslatePipe
  ],
  templateUrl: './catalog.page.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CatalogBrowsePage implements OnInit {
  private catalog = inject(CatalogService);
  private i18n = inject(I18nService);

  readonly badgeInfo = ColorVariant.INFO;
  readonly badgeDefault = ColorVariant.DEFAULT;
  readonly buttonSecondary = ColorVariant.SECONDARY;

  readonly types = signal<CatalogLookupType[]>([]);
  readonly typesLoading = signal(true);
  readonly typesError = signal<string | null>(null);
  readonly selectedType = signal('');

  readonly search = signal('');
  readonly optionsError = signal<string | null>(null);
  readonly selectedItemId = signal<string | null>(null);
  readonly detail = signal<CatalogItemDetail | null>(null);
  readonly detailLoading = signal(false);
  readonly detailError = signal<string | null>(null);

  readonly options = new PagedList<CatalogOptionItem>(
    (page) =>
      this.catalog.getOptions(this.selectedType(), {
        q: this.search().trim() || undefined,
        page: page - 1,
        size: PAGE_SIZE
      }),
    (err) => this.optionsError.set(apiMessage(this.i18n, err))
  );

  readonly typeOptions = computed<SelectOption[]>(() =>
    this.types().map((type) => ({ value: type.code, labelKey: type.name_key }))
  );
  readonly selectedTypeMeta = computed(
    () => this.types().find((type) => type.code === this.selectedType()) ?? null
  );
  readonly hierarchical = computed(() => {
    const mode = this.selectedTypeMeta()?.hierarchy_mode;
    return mode === CatalogHierarchyMode.TREE || mode === CatalogHierarchyMode.DAG;
  });

  ngOnInit() {
    this.loadTypes();
  }

  loadTypes() {
    this.typesLoading.set(true);
    this.typesError.set(null);
    this.catalog.getTypes().subscribe({
      next: (res) => {
        const items = res.data?.items || [];
        this.types.set(items);
        this.typesLoading.set(false);
        const first = items[0]?.code ?? '';
        this.selectedType.set(first);
        if (first) {
          this.options.load(true);
        }
      },
      error: (err) => {
        this.typesLoading.set(false);
        this.typesError.set(apiMessage(this.i18n, err));
      }
    });
  }

  onTypeChange(code: string) {
    if (code === this.selectedType()) {
      return;
    }
    this.selectedType.set(code);
    this.search.set('');
    this.optionsError.set(null);
    this.closeDetail();
    this.options.load(true);
  }

  onSearchChange(value: string) {
    this.search.set(value);
    this.options.debounce(() => this.options.load(true), SEARCH_DEBOUNCE_MS);
  }

  retryOptions() {
    this.optionsError.set(null);
    this.options.load(true);
  }

  toggleItem(item: CatalogOptionItem) {
    if (this.selectedItemId() === item.id) {
      this.closeDetail();
      return;
    }
    this.selectedItemId.set(item.id);
    this.loadDetail(item.id);
  }

  loadDetail(id: string) {
    this.detail.set(null);
    this.detailError.set(null);
    this.detailLoading.set(true);
    this.catalog.getItem(id).subscribe({
      next: (res) => {
        this.detail.set(res.data ?? null);
        this.detailLoading.set(false);
      },
      error: (err) => {
        this.detailLoading.set(false);
        this.detailError.set(apiMessage(this.i18n, err));
      }
    });
  }

  retryDetail() {
    const id = this.selectedItemId();
    if (id) {
      this.loadDetail(id);
    }
  }

  closeDetail() {
    this.selectedItemId.set(null);
    this.detail.set(null);
    this.detailError.set(null);
    this.detailLoading.set(false);
  }

  isSelected(id: string): boolean {
    return this.selectedItemId() === id;
  }

  statusVariant(status?: string | null): ColorVariant {
    return status === 'INACTIVE' ? ColorVariant.DEFAULT : ColorVariant.SUCCESS;
  }

  relationKey(relationType?: string | null): string | null {
    return relationType ? `CATALOG_RELATION_${relationType}` : null;
  }
}
