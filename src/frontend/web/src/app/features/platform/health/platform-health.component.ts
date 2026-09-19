import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ApiErrorResponse,
  BadgeComponent,
  ColorVariant,
  HealthSnapshot,
  I18nService,
  SharpButtonComponent,
  SubsystemStatus,
  SystemHealthStatus,
  TranslatePipe,
  formatTime
} from '@shared';
import { PlatformService } from '../../../core/services/platform.service';

@Component({
  selector: 'app-platform-health',
  standalone: true,
  imports: [CommonModule, BadgeComponent, SharpButtonComponent, TranslatePipe],
  templateUrl: './platform-health.component.html'
})
export class PlatformHealthComponent implements OnInit {
  private platform = inject(PlatformService);
  private i18n = inject(I18nService);

  readonly health = signal<HealthSnapshot | null>(null);
  readonly loading = signal<boolean>(false);
  readonly errorText = signal<string>('');
  readonly lastUpdated = signal<string>('');

  readonly systemStatus = SystemHealthStatus;
  readonly subsystemStatus = SubsystemStatus;

  ngOnInit() {
    this.load();
  }

  load() {
    this.loading.set(true);
    this.platform.getHealth().subscribe({
      next: (res) => {
        this.health.set(res.data);
        this.loading.set(false);
        this.errorText.set('');
        this.lastUpdated.set(formatTime(new Date()));
      },
      error: (err) => {
        this.loading.set(false);
        this.showError(err);
      }
    });
  }

  systemVariant(status: SystemHealthStatus): ColorVariant {
    switch (status) {
      case SystemHealthStatus.HEALTHY:
        return ColorVariant.SUCCESS;
      case SystemHealthStatus.DEGRADED:
        return ColorVariant.WARNING;
      case SystemHealthStatus.DOWN:
        return ColorVariant.DANGER;
      default:
        return ColorVariant.DEFAULT;
    }
  }

  subsystemVariant(status: SubsystemStatus): ColorVariant {
    switch (status) {
      case SubsystemStatus.UP:
        return ColorVariant.SUCCESS;
      case SubsystemStatus.DOWN:
        return ColorVariant.DANGER;
      default:
        return ColorVariant.DEFAULT;
    }
  }

  private showError(err: unknown) {
    const apiError = err as ApiErrorResponse;
    this.errorText.set(this.i18n.t(apiError?.code || 'INTERNAL_SERVER_ERROR', apiError?.params));
  }
}
