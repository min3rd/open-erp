import { Component, effect, inject, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  ApiErrorResponse,
  DrawerComponent,
  I18nService,
  Role,
  SharpButtonComponent,
  SharpInputComponent,
  SharpTextareaComponent,
  TranslatePipe
} from '@shared';

import { IamService } from '../../../core/services/iam.service';

@Component({
  selector: 'app-role-form-drawer',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    DrawerComponent,
    SharpInputComponent,
    SharpTextareaComponent,
    SharpButtonComponent,
    TranslatePipe
  ],
  templateUrl: './role-form-drawer.component.html'
})
export class RoleFormDrawerComponent {
  private iam = inject(IamService);
  private i18n = inject(I18nService);

  isOpen = input<boolean>(false);
  role = input<Role | null>(null);

  close = output<void>();
  saved = output<string>();

  readonly code = signal<string>('');
  readonly name = signal<string>('');
  readonly description = signal<string>('');
  readonly saving = signal<boolean>(false);
  readonly errorText = signal<string>('');

  constructor() {
    effect(() => {
      if (this.isOpen()) {
        const editing = this.role();
        this.code.set(editing?.code || '');
        this.name.set(editing?.name || '');
        this.description.set(editing?.description || '');
        this.errorText.set('');
      }
    });
  }

  get isEditing(): boolean {
    return !!this.role();
  }

  onClose() {
    this.close.emit();
  }

  submit() {
    if (!this.code().trim() || !this.name().trim()) {
      this.errorText.set(this.i18n.t('VALIDATION_REQUIRED'));
      return;
    }
    this.saving.set(true);
    const payload = {
      code: this.code().trim().toUpperCase(),
      name: this.name().trim(),
      description: this.description().trim() || undefined
    };
    const editing = this.role();
    const request = editing ? this.iam.updateRole(editing.id, payload) : this.iam.createRole(payload);
    request.subscribe({
      next: (res) => {
        this.saving.set(false);
        this.saved.emit(res.code);
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
