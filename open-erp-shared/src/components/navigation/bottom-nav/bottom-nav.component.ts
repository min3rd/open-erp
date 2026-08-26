import { Component, ChangeDetectionStrategy, input, model, output, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconComponent, IconName } from '../../icon/icon.component';

export interface BottomNavItem {
  id: string;
  label: string;
  icon: IconName;
  activeIcon?: IconName;
  badge?: string | number;
  badgeColor?: string;
  disabled?: boolean;
}

@Component({
  selector: 'erp-bottom-nav, erp-bottom-navigation',
  standalone: true,
  imports: [CommonModule, IconComponent],
  templateUrl: './bottom-nav.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [`
    :host {
      display: block;
      width: 100%;
    }
  `]
})
export class BottomNavComponent {
  readonly items = input<BottomNavItem[]>([]);
  readonly activeId = model<string | undefined>(undefined);
  readonly fixed = input<boolean>(true);
  readonly safeArea = input<boolean>(true);
  readonly floating = input<boolean>(false);
  readonly showLabels = input<boolean>(true);

  readonly itemClick = output<BottomNavItem>();

  readonly currentActiveId = computed<string>(() => {
    const act = this.activeId();
    if (act) return act;
    const its = this.items();
    return its.length > 0 ? its[0].id : '';
  });

  onItemSelect(item: BottomNavItem): void {
    if (item.disabled) return;
    this.activeId.set(item.id);
    this.itemClick.emit(item);
  }
}
