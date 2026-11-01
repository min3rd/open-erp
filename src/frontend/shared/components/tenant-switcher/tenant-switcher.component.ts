import { CommonModule } from '@angular/common';
import { Component, ElementRef, HostListener, computed, inject, input, output, signal } from '@angular/core';
import { TranslatePipe } from '../../i18n/translate.pipe';
import { IconComponent } from '../icon/icon.component';

export interface TenantSwitcherItem {
  id: string;
  name: string;
  slug?: string;
  role?: string;
  status?: string;
  is_default?: boolean;
}

/**
 * Shared tenant switcher for the account menu. The host owns session/token
 * replacement; this component only emits the selected tenant id.
 */
@Component({
  selector: 'app-tenant-switcher',
  standalone: true,
  imports: [CommonModule, TranslatePipe, IconComponent],
  templateUrl: './tenant-switcher.component.html',
})
export class TenantSwitcherComponent {
  private host = inject(ElementRef<HTMLElement>);

  tenants = input<TenantSwitcherItem[]>([]);
  currentTenantId = input<string | null>(null);
  disabled = input(false);

  switchTenant = output<string>();

  readonly open = signal(false);
  readonly query = signal('');
  readonly filtered = computed(() => {
    const q = this.query().trim().toLowerCase();
    const items = this.tenants();
    return q
      ? items.filter((item) =>
          item.name.toLowerCase().includes(q) || (item.slug ?? '').toLowerCase().includes(q))
      : items;
  });
  readonly current = computed(() =>
    this.tenants().find((item) => item.id === this.currentTenantId()) ?? null);

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (this.open() && !this.host.nativeElement.contains(event.target as Node)) {
      this.open.set(false);
    }
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.open.set(false);
  }

  toggle(): void {
    if (!this.disabled() && this.tenants().length > 1) {
      this.open.update((value) => !value);
    }
  }

  select(item: TenantSwitcherItem): void {
    if (item.status && item.status !== 'ACTIVE' && item.status !== 'TRIAL') {
      return;
    }
    if (item.id === this.currentTenantId()) {
      this.open.set(false);
      return;
    }
    const beforeSwitch = new CustomEvent('op:before-tenant-switch', {
      cancelable: true,
      detail: { tenantId: item.id },
    });
    if (!window.dispatchEvent(beforeSwitch)) {
      this.open.set(false);
      return;
    }
    this.open.set(false);
    this.switchTenant.emit(item.id);
  }
}
