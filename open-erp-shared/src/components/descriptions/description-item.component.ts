import { Component, ChangeDetectionStrategy, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconComponent, IconName } from '../icon/icon.component';

@Component({
  selector: 'erp-description-item, erp-key-value-item',
  standalone: true,
  imports: [CommonModule, IconComponent],
  template: `
    <div class="p-3.5 flex flex-col gap-1 border-b border-slate-100 dark:border-slate-800/60">
      <span class="text-[11px] font-semibold text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
        @if (icon()) {
          <erp-icon [name]="icon()!" [size]="12"></erp-icon>
        }
        {{ label() }}
      </span>
      <div class="font-bold text-xs text-slate-800 dark:text-slate-200">
        <ng-content>{{ value() }}</ng-content>
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [`
    :host {
      display: block;
    }
  `]
})
export class DescriptionItemComponent {
  readonly label = input<string>('');
  readonly value = input<any>(undefined);
  readonly icon = input<IconName | undefined>(undefined);
}
