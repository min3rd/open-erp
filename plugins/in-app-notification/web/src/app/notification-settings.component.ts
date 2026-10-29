import { CommonModule } from '@angular/common';
import { Component, ElementRef, Input, OnInit, inject, signal } from '@angular/core';
import { forkJoin } from 'rxjs';
import {
  SelectOption,
  SharpButtonComponent,
  SharpInputComponent,
  SharpSelectComponent,
  SharpToggleComponent,
  TranslatePipe,
} from '@shared';
import { NotificationSettingsDto } from './notification.model';
import { NotificationService } from './notification.service';

@Component({
  selector: 'app-notification-settings',
  standalone: true,
  imports: [
    CommonModule,
    TranslatePipe,
    SharpToggleComponent,
    SharpSelectComponent,
    SharpButtonComponent,
    SharpInputComponent,
  ],
  templateUrl: './notification-settings.component.html',
})
export class NotificationSettingsComponent implements OnInit {
  private service = inject(NotificationService);
  private host = inject(ElementRef<HTMLElement>);

  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);
  readonly inherit = signal(true);
  readonly platform = signal<NotificationSettingsDto | null>(null);
  readonly displayName = signal('');
  readonly supportEmail = signal('');
  readonly channelEmail = signal(false);
  readonly channelInApp = signal(true);
  readonly levelMin = signal('INFO');
  readonly levels: SelectOption[] = [
    { value: 'INFO', labelKey: 'PLUGIN_IN_APP_NOTIFICATION_LEVEL_INFO' },
    { value: 'WARN', labelKey: 'PLUGIN_IN_APP_NOTIFICATION_LEVEL_WARN' },
    { value: 'ERROR', labelKey: 'PLUGIN_IN_APP_NOTIFICATION_LEVEL_ERROR' },
  ];

  @Input()
  set apiBaseUrl(value: string) {
    this.service.setRuntimeOrigin(value);
  }

  ngOnInit(): void {
    forkJoin({
      settings: this.service.settings(),
      defaults: this.service.platformDefaults(),
    }).subscribe({
      next: ({ settings, defaults }) => {
        const platform = defaults.data ?? null;
        this.platform.set(platform);
        const tenant = settings.data ?? null;
        const inherited = !tenant
          || (tenant.display_name == null
            && tenant.support_email == null
            && tenant.channel_email == null
            && tenant.channel_in_app == null
            && tenant.level_min == null);
        this.inherit.set(inherited);
        this.displayName.set(tenant?.display_name ?? platform?.display_name ?? '');
        this.supportEmail.set(tenant?.support_email ?? platform?.support_email ?? '');
        this.channelEmail.set(tenant?.channel_email ?? platform?.channel_email ?? false);
        this.channelInApp.set(tenant?.channel_in_app ?? platform?.channel_in_app ?? true);
        this.levelMin.set(tenant?.level_min ?? platform?.level_min ?? 'INFO');
        this.loading.set(false);
      },
      error: () => {
        this.error.set('PLUGIN_IN_APP_NOTIFICATION_LOAD_ERROR');
        this.loading.set(false);
      },
    });
  }

  save(): void {
    this.saving.set(true);
    this.error.set(null);
    const inherited = this.inherit();
    this.service.saveSettings({
      display_name: inherited ? null : this.displayName(),
      support_email: inherited ? null : this.supportEmail(),
      channel_email: inherited ? null : this.channelEmail(),
      channel_in_app: inherited ? null : this.channelInApp(),
      level_min: inherited ? null : this.levelMin(),
    }).subscribe({
      next: () => {
        this.saving.set(false);
        this.host.nativeElement.dispatchEvent(new CustomEvent('op:notify', {
          bubbles: true,
          composed: true,
          detail: {
            level: 'success',
            code: 'IN_APP_NOTIFICATION_SETTINGS_SAVED',
          },
        }));
      },
      error: () => {
        this.saving.set(false);
        this.error.set('PLUGIN_IN_APP_NOTIFICATION_SAVE_ERROR');
      },
    });
  }
}
