import { Component, computed, effect, inject, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ApiErrorResponse,
  AuditLog,
  AuditResult,
  BadgeComponent,
  ColorVariant,
  DrawerComponent,
  I18nService,
  TranslatePipe
} from '@shared';
import { PlatformService } from '../../../core/services/platform.service';

@Component({
  selector: 'app-audit-log-detail-drawer',
  standalone: true,
  imports: [CommonModule, BadgeComponent, DrawerComponent, TranslatePipe],
  templateUrl: './audit-log-detail-drawer.component.html'
})
export class AuditLogDetailDrawerComponent {
  private platform = inject(PlatformService);
  private i18n = inject(I18nService);

  isOpen = input<boolean>(false);
  logId = input<string | null>(null);

  close = output<void>();

  readonly log = signal<AuditLog | null>(null);
  readonly loading = signal<boolean>(false);
  readonly errorText = signal<string>('');

  readonly diffKeys = computed<string[]>(() => {
    const current = this.log();
    const before = current?.details?.before || {};
    const after = current?.details?.after || {};
    return Array.from(new Set([...Object.keys(before), ...Object.keys(after)])).sort();
  });

  constructor() {
    effect(() => {
      const id = this.logId();
      if (this.isOpen() && id) {
        this.load(id);
      }
      if (!this.isOpen()) {
        this.log.set(null);
        this.errorText.set('');
      }
    });
  }

  valueText(value: unknown): string {
    if (value === undefined || value === null) {
      return '-';
    }
    if (typeof value === 'object') {
      return JSON.stringify(value);
    }
    return String(value);
  }

  beforeValue(key: string): unknown {
    return this.log()?.details?.before?.[key];
  }

  afterValue(key: string): unknown {
    return this.log()?.details?.after?.[key];
  }

  isChanged(key: string): boolean {
    return this.valueText(this.beforeValue(key)) !== this.valueText(this.afterValue(key));
  }

  resultVariant(result: AuditResult): ColorVariant {
    switch (result) {
      case AuditResult.SUCCESS:
        return ColorVariant.SUCCESS;
      case AuditResult.DENIED:
        return ColorVariant.WARNING;
      case AuditResult.FAILED:
        return ColorVariant.DANGER;
      default:
        return ColorVariant.DEFAULT;
    }
  }

  onClose() {
    this.close.emit();
  }

  private load(logId: string) {
    this.loading.set(true);
    this.platform.getAuditLog(logId).subscribe({
      next: (res) => {
        this.log.set(res.data);
        this.loading.set(false);
        this.errorText.set('');
      },
      error: (err) => {
        this.loading.set(false);
        const apiError = err as ApiErrorResponse;
        this.errorText.set(this.i18n.t(apiError?.code || 'INTERNAL_SERVER_ERROR', apiError?.params));
      }
    });
  }
}
