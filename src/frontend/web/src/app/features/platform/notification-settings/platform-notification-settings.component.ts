import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import {
  ApiResponse,
  ApiService,
  SelectOption,
  SharpButtonComponent,
  SharpInputComponent,
  SharpSelectComponent,
  SharpToggleComponent,
  TranslatePipe,
} from '@shared';

interface NotificationSettings {
  display_name: string | null;
  support_email: string | null;
  channel_email: boolean;
  channel_in_app: boolean;
  level_min: string;
  updated_at?: string | null;
}

@Component({
  selector: 'app-platform-notification-settings',
  standalone: true,
  imports: [
    CommonModule,
    TranslatePipe,
    SharpInputComponent,
    SharpToggleComponent,
    SharpSelectComponent,
    SharpButtonComponent,
  ],
  templateUrl: './platform-notification-settings.component.html',
})
export class PlatformNotificationSettingsComponent implements OnInit {
  private api = inject(ApiService);

  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);
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

  ngOnInit(): void {
    this.api.get<NotificationSettings>('/api/v1/platform/notification-settings').subscribe({
      next: (response: ApiResponse<NotificationSettings>) => {
        const data = response.data;
        if (data) {
          this.displayName.set(data.display_name ?? '');
          this.supportEmail.set(data.support_email ?? '');
          this.channelEmail.set(data.channel_email);
          this.channelInApp.set(data.channel_in_app);
          this.levelMin.set(data.level_min);
        }
        this.loading.set(false);
      },
      error: () => {
        this.error.set('COMMON_LOAD_ERROR');
        this.loading.set(false);
      },
    });
  }

  save(): void {
    this.saving.set(true);
    this.error.set(null);
    this.api.put<NotificationSettings>('/api/v1/platform/notification-settings', {
      display_name: this.displayName(),
      support_email: this.supportEmail(),
      channel_email: this.channelEmail(),
      channel_in_app: this.channelInApp(),
      level_min: this.levelMin(),
    }).subscribe({
      next: () => {
        this.saving.set(false);
      },
      error: () => {
        this.saving.set(false);
        this.error.set('COMMON_SAVE_ERROR');
      },
    });
  }
}
