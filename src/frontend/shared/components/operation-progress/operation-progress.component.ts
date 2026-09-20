import { CommonModule } from '@angular/common';
import { Component, computed, input } from '@angular/core';
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

  statusVariant = computed<string>(() => {
    const status = this.operation()?.status ?? '';
    if (status.includes('FAILED')) {
      return 'danger';
    }
    if (status === 'ACTIVE') {
      return 'success';
    }
    return 'warning';
  });

  stepVariant(result: string): string {
    if (result === 'OK') {
      return 'success';
    }
    if (result === 'FAILED') {
      return 'danger';
    }
    return 'neutral';
  }
}
