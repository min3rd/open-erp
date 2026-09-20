import { CommonModule } from '@angular/common';
import { Component, computed, input } from '@angular/core';
import { ColorVariant } from '../../enums';
import { TranslatePipe } from '../../i18n/translate.pipe';
import { PluginOperationStatus } from '../../models/plugin.model';
import { BadgeComponent } from '../badge/badge.component';

@Component({
  selector: 'app-operation-progress',
  standalone: true,
  imports: [CommonModule, TranslatePipe, BadgeComponent],
  templateUrl: './operation-progress.component.html',
})
export class OperationProgressComponent {
  operation = input<PluginOperationStatus | null>(null);

  running = computed<boolean>(() => {
    const status = this.operation()?.status;
    return status === 'INSTALLING' || status === 'UPGRADING' || status === 'UNINSTALLING';
  });

  statusVariant = computed<ColorVariant>(() => {
    const status = this.operation()?.status ?? '';
    if (status.includes('FAILED')) {
      return ColorVariant.DANGER;
    }
    if (status === 'ACTIVE') {
      return ColorVariant.SUCCESS;
    }
    return ColorVariant.WARNING;
  });

  stepVariant(result: string): ColorVariant {
    if (result === 'OK') {
      return ColorVariant.SUCCESS;
    }
    if (result === 'FAILED') {
      return ColorVariant.DANGER;
    }
    return ColorVariant.DEFAULT;
  }
}
