import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CatalogHierarchyMode, DrawerComponent, TranslatePipe } from '@shared';
import { CatalogTypeDto } from '../../core/services/catalog-admin.service';

const LOOKUP_API = '/api/v1/plugins/runtime/catalog/api/v1/catalog/lookup';
const COPY_FEEDBACK_MS = 1500;

/**
 * "API" drawer of the catalogue admin screen (DES-UI-S05-001 §2): the lookup
 * endpoints other plugins/forms call for the selected type, with a copy button
 * per snippet. Only labels are translated — endpoints and JSON stay literal.
 */
@Component({
  selector: 'app-catalog-api-drawer',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, DrawerComponent, TranslatePipe],
  templateUrl: './catalog-api-drawer.component.html'
})
export class CatalogApiDrawerComponent {
  isOpen = input<boolean>(false);
  type = input<CatalogTypeDto | null>(null);

  close = output<void>();

  readonly copiedKey = signal<string | null>(null);

  readonly code = computed(() => this.type()?.code ?? '');
  readonly isTree = computed(() => {
    const mode = this.type()?.hierarchy_mode;
    return mode === CatalogHierarchyMode.TREE || mode === CatalogHierarchyMode.DAG;
  });
  readonly allowFreeText = computed(() => this.type()?.allow_free_text === true);

  readonly optionsSnippet = computed(() => `GET ${LOOKUP_API}/${this.code()}/options?q=&parent_id=&as_of=&page=&size=`);
  readonly inlineSnippet = computed(() => `POST ${LOOKUP_API}/${this.code()}/inline\n{ "name": "…", "code": "…" }`);
  readonly resolveSnippet = computed(() => `POST ${LOOKUP_API}/${this.code()}/resolve\n{ "ids": ["…"] }`);
  readonly pathSnippet = computed(() => `GET ${LOOKUP_API}/${this.code()}/path?id=…`);
  readonly valueShape = '{ "catalog_item_id": "…|null", "text": "…" }';
  readonly optionsSample = computed(() =>
    JSON.stringify(
      {
        success: true,
        code: 'CATALOG_LOOKUP_OPTIONS_SUCCESS',
        data: {
          items: [
            {
              id: 'b1e2c3d4-…',
              code: '…',
              name: '…',
              parent_id: null,
              path: '…',
              has_children: this.isTree(),
              is_system: false,
              overridden: false,
              allow_free_text: this.allowFreeText()
            }
          ],
          page: 0,
          size: 20,
          total_items: 1,
          total_pages: 1
        }
      },
      null,
      2
    )
  );

  private copyTimer?: ReturnType<typeof setTimeout>;

  isCopied(key: string): boolean {
    return this.copiedKey() === key;
  }

  copy(key: string, text: string): void {
    navigator.clipboard?.writeText(text).then(
      () => {
        this.copiedKey.set(key);
        if (this.copyTimer) {
          clearTimeout(this.copyTimer);
        }
        this.copyTimer = setTimeout(() => this.copiedKey.set(null), COPY_FEEDBACK_MS);
      },
      () => this.copiedKey.set(null)
    );
  }
}
