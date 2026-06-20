import { Component, OnInit, signal, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import {
  FormBuilder,
  FormGroup,
  FormControl,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { TranslocoService, TranslocoModule } from '@jsverse/transloco';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  ButtonComponent,
  IconComponent,
  AlertComponent,
  InputComponent,
  AuthService,
} from '@open-erp/shared';

@Component({
  selector: 'app-activate',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    TranslocoModule,
    ButtonComponent,
    IconComponent,
    AlertComponent,
    InputComponent,
  ],
  templateUrl: './activate.component.html',
})
export class ActivateComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private fb = inject(FormBuilder);
  private translocoService = inject(TranslocoService);
  private authService = inject(AuthService);

  token = signal<string>('');
  isLoading = signal<boolean>(true);
  successMessage = signal<string>('');
  errorMessage = signal<string>('');
  passwordValue = signal<string>('');

  activateForm: FormGroup;

  // Password strength computation signal
  passwordStrength = computed(() => {
    const password = this.passwordValue();
    if (!password) return null;

    let score = 0;

    // Check length
    if (password.length >= 8) score++;

    // Check numbers and letters
    const hasLetters = /[a-zA-Z]/.test(password);
    const hasNumbers = /[0-9]/.test(password);
    if (hasLetters && hasNumbers) score++;

    // Check special chars
    const hasSpecial = /[^a-zA-Z0-9]/.test(password);
    if (hasSpecial) score++;

    if (score <= 1) return 'weak';
    if (score === 2) return 'medium';
    return 'strong';
  });

  constructor() {
    this.activateForm = this.fb.group(
      {
        password: ['', [Validators.required, Validators.minLength(6)]],
        confirmPassword: ['', [Validators.required]],
      },
      {
        validators: this.passwordMatchValidator,
      }
    );

    // Sync password input value with passwordValue signal in a memory-safe manner
    this.activateForm
      .get('password')
      ?.valueChanges.pipe(takeUntilDestroyed())
      .subscribe((val) => {
        this.passwordValue.set(val || '');
      });
  }

  ngOnInit() {
    // 1. Read token from query parameters
    this.route.queryParams.subscribe((params) => {
      const token = params['token'];
      this.isLoading.set(false);
      if (!token) {
        this.errorMessage.set(this.translocoService.translate('auth.invalid_activation_token'));
        return;
      }
      this.token.set(token);
    });
  }

  passwordMatchValidator(group: FormGroup) {
    const password = group.get('password')?.value;
    const confirmPassword = group.get('confirmPassword')?.value;
    if (password !== confirmPassword) {
      group.get('confirmPassword')?.setErrors({ mismatch: true });
      return { mismatch: true };
    }
    return null;
  }

  getControl(name: string): FormControl {
    return this.activateForm.get(name) as FormControl;
  }

  getErrorMessage(controlName: string): string {
    const control = this.activateForm.get(controlName);
    if (!control || !control.errors) return '';
    const errors = control.errors;

    if (errors['required']) {
      return this.translocoService.translate('validation.password_required');
    }
    if (errors['minlength']) {
      return this.translocoService.translate('validation.password_min_length');
    }
    if (errors['mismatch']) {
      return this.translocoService.translate('auth.passwords_must_match');
    }
    return '';
  }

  onSubmit() {
    if (this.activateForm.invalid || !this.token()) {
      return;
    }

    this.isLoading.set(true);
    this.successMessage.set('');
    this.errorMessage.set('');

    const password = this.activateForm.value.password;

    this.authService.activate(this.token(), password).subscribe({
      next: (res) => {
        this.isLoading.set(false);
        if (res && res.success) {
          const msgKey = res.messageKey || 'auth.activation_success';
          this.successMessage.set(this.translocoService.translate(msgKey));
          // Redirect to login after 3 seconds
          setTimeout(() => {
            this.router.navigate(['/login']);
          }, 3000);
        } else {
          this.errorMessage.set(this.translocoService.translate('auth.invalid_activation_token'));
        }
      },
      error: (err) => {
        this.isLoading.set(false);
        const errPayload = err.error || {};
        const msgKey = errPayload.error?.messageKey || 'auth.invalid_activation_token';
        this.errorMessage.set(this.translocoService.translate(msgKey));
      },
    });
  }

  goToLogin() {
    this.router.navigate(['/login']);
  }
}
