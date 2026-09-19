import { Component, effect, inject, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  ApiErrorResponse,
  Branch,
  DrawerComponent,
  I18nService,
  SharpButtonComponent,
  SharpInputComponent,
  TranslatePipe
} from '@shared';

import { OrganizationService } from '../../../core/services/organization.service';

@Component({
  selector: 'app-branch-form-drawer',
  standalone: true,
  imports: [CommonModule, FormsModule, DrawerComponent, SharpInputComponent, SharpButtonComponent, TranslatePipe],
  templateUrl: './branch-form-drawer.component.html'
})
export class BranchFormDrawerComponent {
  private organization = inject(OrganizationService);
  private i18n = inject(I18nService);

  isOpen = input<boolean>(false);
  branch = input<Branch | null>(null);

  close = output<void>();
  saved = output<string>();

  readonly code = signal<string>('');
  readonly name = signal<string>('');
  readonly phone = signal<string>('');
  readonly address = signal<string>('');
  readonly saving = signal<boolean>(false);
  readonly errorText = signal<string>('');

  constructor() {
    effect(() => {
      if (this.isOpen()) {
        const editing = this.branch();
        this.code.set(editing?.code || '');
        this.name.set(editing?.name || '');
        this.phone.set(editing?.phone || '');
        this.address.set(editing?.address || '');
        this.errorText.set('');
      }
    });
  }

  get isEditing(): boolean {
    return !!this.branch();
  }

  onClose() {
    this.close.emit();
  }

  submit() {
    if (!this.code().trim() || !this.name().trim()) {
      this.errorText.set(this.i18n.t('VALIDATION_REQUIRED'));
      return;
    }
    const payload = {
      code: this.code().trim().toUpperCase(),
      name: this.name().trim(),
      phone: this.phone().trim() || undefined,
      address: this.address().trim() || undefined
    };
    const editing = this.branch();
    this.saving.set(true);
    const request = editing
      ? this.organization.updateBranch(editing.id, payload)
      : this.organization.createBranch(payload);
    request.subscribe({
      next: (res) => {
        this.saving.set(false);
        this.saved.emit(res.code);
      },
      error: (err) => {
        this.saving.set(false);
        const apiError = err as ApiErrorResponse;
        this.errorText.set(this.i18n.t(apiError?.code || 'INTERNAL_SERVER_ERROR', apiError?.params));
      }
    });
  }
}
