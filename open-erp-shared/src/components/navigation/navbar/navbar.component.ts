import { Component, ChangeDetectionStrategy, input, model, output, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconComponent, IconName } from '../../icon/icon.component';
import { NavbarPosition } from '../../../enums/component.enum';

export interface NavbarItem {
  id?: string;
  label: string;
  url?: string;
  icon?: IconName;
  active?: boolean;
  badge?: string | number;
  badgeColor?: string;
  disabled?: boolean;
  children?: NavbarItem[];
}

const POSITION_CLASSES: Record<string, string> = {
  [NavbarPosition.FIXED]: 'fixed top-0 left-0 right-0 z-40',
  [NavbarPosition.STICKY]: 'sticky top-0 z-30',
  [NavbarPosition.STATIC]: 'relative z-20'
};

@Component({
  selector: 'erp-navbar, erp-header, erp-app-bar',
  standalone: true,
  imports: [CommonModule, IconComponent],
  templateUrl: './navbar.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [`
    :host {
      display: block;
      width: 100%;
    }
  `]
})
export class NavbarComponent {
  readonly brandTitle = input<string>('');
  readonly brandSubtitle = input<string | undefined>(undefined);
  readonly brandLogo = input<string | undefined>(undefined);
  readonly brandUrl = input<string>('/');
  readonly position = input<NavbarPosition | 'static' | 'sticky' | 'fixed'>(NavbarPosition.STICKY);
  readonly bordered = input<boolean>(true);
  readonly glass = input<boolean>(true);
  readonly items = input<NavbarItem[]>([]);
  readonly showMobileToggle = input<boolean>(true);
  readonly mobileOpen = model<boolean>(false);

  readonly mobileToggle = output<boolean>();
  readonly itemClick = output<NavbarItem>();

  readonly positionClass = computed(() => {
    const p = String(this.position());
    return POSITION_CLASSES[p] || POSITION_CLASSES[NavbarPosition.STICKY];
  });

  onToggleMobile(): void {
    const next = !this.mobileOpen();
    this.mobileOpen.set(next);
    this.mobileToggle.emit(next);
  }

  onItemClick(item: NavbarItem, event?: MouseEvent): void {
    if (item.disabled) return;
    this.itemClick.emit(item);
    if (this.mobileOpen()) {
      this.mobileOpen.set(false);
      this.mobileToggle.emit(false);
    }
  }
}
