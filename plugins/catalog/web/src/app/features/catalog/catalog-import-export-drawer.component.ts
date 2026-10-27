import { ChangeDetectionStrategy, Component, computed, effect, inject, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  ApiErrorResponse,
  BadgeComponent,
  ColorVariant,
  DrawerComponent,
  I18nService,
  SharpButtonComponent,
  TranslatePipe
} from '@shared';
import {
  CatalogAdminService,
  CatalogImportReport,
  CatalogScope,
  CatalogTypeDto
} from '../../core/services/catalog-admin.service';

interface ImportPreviewRow {
  row: number;
  actionKey: string;
  code: string;
  message: string;
}

/**
 * Import/export drawer (DES-UI-S05-001 §2, AC-18/AC-19): CSV/.xlsx upload →
 * dry-run preview per row → explicit write confirmation → final report, plus
 * template download and CSV export. Per-row errors never block valid rows.
 */
@Component({
  selector: 'app-catalog-import-export-drawer',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, DrawerComponent, SharpButtonComponent, BadgeComponent, TranslatePipe],
  templateUrl: './catalog-import-export-drawer.component.html'
})
export class CatalogImportExportDrawerComponent {
  private catalog = inject(CatalogAdminService);
  private i18n = inject(I18nService);

  isOpen = input<boolean>(false);
  type = input<CatalogTypeDto | null>(null);
  scope = input<CatalogScope>(CatalogScope.TENANT);

  close = output<void>();
  imported = output<string>();

  readonly file = signal<File | null>(null);
  readonly dryRunReport = signal<CatalogImportReport | null>(null);
  readonly writeReport = signal<CatalogImportReport | null>(null);
  readonly busy = signal(false);
  readonly exporting = signal(false);
  readonly errorText = signal('');
  readonly confirmWrite = signal(false);

  readonly previewRows = computed<ImportPreviewRow[]>(() => {
    const report = this.dryRunReport();
    return report ? this.toPreview(report) : [];
  });
  readonly writeRows = computed<ImportPreviewRow[]>(() => {
    const report = this.writeReport();
    return report ? this.toPreview(report) : [];
  });
  readonly hasImportErrors = computed(() => (this.dryRunReport()?.errors?.length ?? 0) > 0);

  private wasOpen = false;

  constructor() {
    effect(() => {
      const open = this.isOpen();
      if (open === this.wasOpen) {
        return;
      }
      this.wasOpen = open;
      if (open) {
        this.file.set(null);
        this.dryRunReport.set(null);
        this.writeReport.set(null);
        this.errorText.set('');
        this.confirmWrite.set(false);
      }
    });
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.file.set(input.files?.[0] ?? null);
    this.dryRunReport.set(null);
    this.writeReport.set(null);
    this.confirmWrite.set(false);
    this.errorText.set('');
  }

  runDryRun(): void {
    const type = this.type();
    const file = this.file();
    if (!type || !file || this.busy()) {
      return;
    }
    this.busy.set(true);
    this.errorText.set('');
    this.writeReport.set(null);
    this.confirmWrite.set(false);
    this.catalog.importItems(type.code, file, true, this.scope()).subscribe({
      next: (res) => {
        this.busy.set(false);
        this.dryRunReport.set(res.data ?? null);
      },
      error: (err) => {
        this.busy.set(false);
        this.dryRunReport.set(null);
        this.showError(err);
      }
    });
  }

  askWrite(): void {
    if (this.dryRunReport()) {
      this.confirmWrite.set(true);
    }
  }

  cancelWrite(): void {
    this.confirmWrite.set(false);
  }

  runWrite(): void {
    const type = this.type();
    const file = this.file();
    if (!type || !file || this.busy()) {
      return;
    }
    this.busy.set(true);
    this.errorText.set('');
    this.confirmWrite.set(false);
    this.catalog.importItems(type.code, file, false, this.scope()).subscribe({
      next: (res) => {
        this.busy.set(false);
        this.writeReport.set(res.data ?? null);
        this.imported.emit(res.code);
      },
      error: (err) => {
        this.busy.set(false);
        this.showError(err);
      }
    });
  }

  downloadTemplate(): void {
    const type = this.type();
    if (!type || this.exporting()) {
      return;
    }
    this.exporting.set(true);
    this.catalog.downloadTemplate(type.code, this.scope()).subscribe({
      next: (blob) => {
        this.exporting.set(false);
        this.saveBlob(blob, `catalog-template-${type.code}.csv`);
        this.errorText.set('');
      },
      error: (err) => {
        this.exporting.set(false);
        this.showError(err);
      }
    });
  }

  exportType(): void {
    const type = this.type();
    if (!type || this.exporting()) {
      return;
    }
    this.exportCsv({ type_code: type.code }, `catalog-${type.code}`);
  }

  exportAll(): void {
    if (this.exporting()) {
      return;
    }
    this.exportCsv({ all: true }, 'catalog-all');
  }

  private exportCsv(query: { type_code?: string; all?: boolean }, prefix: string): void {
    this.exporting.set(true);
    this.catalog.exportCsv(query, this.scope()).subscribe({
      next: (blob) => {
        this.exporting.set(false);
        this.saveBlob(blob, `${prefix}-${new Date().toISOString().slice(0, 10)}.csv`);
        this.errorText.set('');
      },
      error: (err) => {
        this.exporting.set(false);
        this.showError(err);
      }
    });
  }

  summaryText(report: CatalogImportReport): string {
    return this.i18n.t('CATALOG_IMPORT_SUMMARY', {
      created: report.created ?? 0,
      updated: report.updated ?? 0,
      skipped: report.skipped ?? 0,
      edges: report.edges_created ?? 0,
      errors: report.errors?.length ?? 0
    });
  }

  actionVariant(actionKey: string): ColorVariant {
    switch (actionKey) {
      case 'CATALOG_IMPORT_ACTION_CREATED':
        return ColorVariant.SUCCESS;
      case 'CATALOG_IMPORT_ACTION_UPDATED':
        return ColorVariant.INFO;
      case 'CATALOG_IMPORT_ACTION_ERROR':
        return ColorVariant.DANGER;
      default:
        return ColorVariant.DEFAULT;
    }
  }

  private toPreview(report: CatalogImportReport): ImportPreviewRow[] {
    const rows: ImportPreviewRow[] = [];
    for (const row of report.rows ?? []) {
      const messages = (row.errors ?? []).map((error) => this.i18n.t(error.code, error.params));
      rows.push({
        row: row.row,
        actionKey: row.action ? `CATALOG_IMPORT_ACTION_${row.action}` : 'CATALOG_IMPORT_ACTION_ERROR',
        code: row.code ?? '',
        message: messages.join('; ')
      });
    }
    for (const error of report.errors ?? []) {
      if (rows.some((entry) => entry.row === error.row && entry.message)) {
        continue;
      }
      rows.push({
        row: error.row,
        actionKey: 'CATALOG_IMPORT_ACTION_ERROR',
        code: '',
        message: this.i18n.t(error.code, error.params)
      });
    }
    return rows.sort((a, b) => a.row - b.row);
  }

  private saveBlob(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  private showError(err: unknown): void {
    const apiError = err as ApiErrorResponse;
    this.errorText.set(this.i18n.t(apiError?.code || 'INTERNAL_SERVER_ERROR', apiError?.params));
  }
}
