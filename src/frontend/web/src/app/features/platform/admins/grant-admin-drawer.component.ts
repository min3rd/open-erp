import { Component, effect, inject, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  ApiErrorResponse,
  DrawerComponent,
  I18nService,
  PlatformAdminRole,
  SelectOption,
  SharpButtonComponent,
  SharpInputComponent,
  SharpSelectComponent,
  TranslatePipe
} from '@shared';
import { PlatformService } from '../../../core/services/platform.service';

@Component({
  selector: 'app-grant-admin-drawer',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    DrawerComponent,
    SharpInputComponent,
    SharpSelectComponent,
    SharpButtonComponent,
    TranslatePipe
  ],
  templateUrl: './grant-admin-drawer.component.html'
})
export class GrantAdminDrawerComponent {
  private platform = inject(PlatformService);
  private i18n = inject(I18nService);

  isOpen = input<boolean>(false);
  roleOptions = input<SelectOption[]>([]);

  close = output<void>();
  granted = output<string>();

  readonly email = signal<string>('');
  readonly fullName = signal<string>('');
  readonly role = signal<string>(PlatformAdminRole.SUPER_ADMIN);
  readonly saving = signal<boolean>(false);
  readonly errorText = signal<string>('');

  constructor() {
    effect(() => {
      if (this.isOpen()) {
        this.email.set('');
        this.fullName.set('');
        this.role.set(PlatformAdminRole.SUPER_ADMIN);
        this.errorText.set('');
      }
    });
  }

  onClose() {
    this.close.emit();
  }

  submit() {
    if (!this.email().trim() || !this.fullName().trim()) {
      this.errorText.set(this.i18n.t('VALIDATION_REQUIRED'));
      return;
    }
    this.saving.set(true);
    this.platform
      .grantAdmin({
        email: this.email().trim(),
        full_name: this.fullName().trim(),
        role: this.role() as PlatformAdminRole
      })
      .subscribe({
        next: (res) => {
          this.saving.set(false);
          this.granted.emit(res.code);
        },
        error: (err) => {
          this.saving.set(false);
          this.showError(err);
        }
      });
  }

  private showError(err: unknown) {
    const apiError = err as ApiErrorResponse;
    this.errorText.set(this.i18n.t(apiError?.code || 'INTERNAL_SERVER_ERROR', apiError?.params));
  }
}
