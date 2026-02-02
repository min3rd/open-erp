import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { RippleModule } from 'primeng/ripple';
import { TooltipModule } from 'primeng/tooltip';

@Component({
  selector: 'layout-vertical-naviagation-module-item',
  imports: [CommonModule, RippleModule, TooltipModule],
  templateUrl: './vertical-naviagation-module-item.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VerticalNaviagationModuleItem {
  label = input<string | undefined>();
  icon = input<string | undefined>();
  isActive = input<boolean>(false);
  url = input<string | undefined>();
  showLabel = input<boolean>(true);

  // Computed property for generating consistent ID suffix from label
  elementId = computed(() => {
    const labelValue = this.label() || 'unknown';
    return labelValue.toLowerCase().replace(/\s+/g, '-');
  });
}
