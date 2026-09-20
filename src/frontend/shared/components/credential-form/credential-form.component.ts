import { CommonModule } from '@angular/common';
import { Component, effect, inject, input, output, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { PluginCredentialScope } from '../../enums';
import { I18nService } from '../../i18n/i18n.service';
import { TranslatePipe } from '../../i18n/translate.pipe';
import { PluginCredentialItem, PluginCredentialPayload } from '../../models/plugin.model';
import { SharpButtonComponent } from '../sharp-button/sharp-button.component';

@Component({
  selector: 'app-credential-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, TranslatePipe, SharpButtonComponent],
  templateUrl: './credential-form.component.html',
})
export class CredentialFormComponent {
  private fb = inject(FormBuilder);
  private i18n = inject(I18nService);

  scope = input<PluginCredentialScope>(PluginCredentialScope.TENANT);
  initial = input<PluginCredentialItem | null>(null);
  saving = input<boolean>(false);
  errorText = input<string>('');
  testing = input<boolean>(false);

  submitted = output<PluginCredentialPayload>();
  testRequested = output<PluginCredentialPayload>();
  cancelled = output<void>();

  submittedFlag = signal(false);

  form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(100)]],
    registry_host: ['', [Validators.required, Validators.maxLength(255)]],
    username: ['', [Validators.required, Validators.maxLength(255)]],
    secret: ['', [Validators.required, Validators.maxLength(500)]],
  });

  constructor() {
    effect(() => {
      const current = this.initial();
      if (current) {
        this.form.patchValue({
          name: current.name,
          registry_host: current.registry_host,
          username: current.username,
          secret: '',
        });
      }
    });
  }

  invalid(control: string): boolean {
    const field = this.form.get(control);
    return !!field && field.invalid && (field.touched || this.submittedFlag());
  }

  labelKey(control: string): string {
    return `PLUGIN_CREDENTIAL_${control.toUpperCase()}`;
  }

  submit(): void {
    this.submittedFlag.set(true);
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.submitted.emit(this.form.getRawValue());
  }

  test(): void {
    if (this.form.controls.registry_host.invalid) {
      this.form.controls.registry_host.markAsTouched();
      return;
    }
    const value = this.form.getRawValue();
    this.testRequested.emit({
      ...value,
      secret: value.secret || (this.initial() ? '__unchanged__' : ''),
    });
  }

  scopeLabel(): string {
    return this.scope() === PluginCredentialScope.PLATFORM
      ? this.i18n.t('PLUGIN_CREDENTIAL_SCOPE_PLATFORM')
      : this.i18n.t('PLUGIN_CREDENTIAL_SCOPE_TENANT');
  }
}
