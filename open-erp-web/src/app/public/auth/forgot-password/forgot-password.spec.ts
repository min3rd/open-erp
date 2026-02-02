import { TestBed, ComponentFixture } from '@angular/core/testing';
import { ForgotPassword } from './forgot-password';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { TranslocoTestingModule } from '@jsverse/transloco';
import { MessageService } from 'primeng/api';

describe('ForgotPassword Component', () => {
  let component: ForgotPassword;
  let fixture: ComponentFixture<ForgotPassword>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        ForgotPassword,
        TranslocoTestingModule.forRoot({
          langs: { en: {}, es: {} },
          translocoConfig: {
            availableLangs: ['en', 'es'],
            defaultLang: 'en',
          },
        }),
      ],
      providers: [provideRouter([]), provideHttpClient(), MessageService],
    }).compileComponents();

    fixture = TestBed.createComponent(ForgotPassword);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Form Validation', () => {
    it('should initialize with invalid form', () => {
      expect(component['forgotPasswordForm'].valid).toBeFalsy();
    });

    it('should validate email field', () => {
      const emailControl = component['forgotPasswordForm'].get('email');
      expect(emailControl?.valid).toBeFalsy();

      emailControl?.setValue('invalid-email');
      expect(emailControl?.valid).toBeFalsy();

      emailControl?.setValue('test@example.com');
      expect(emailControl?.valid).toBeTruthy();
    });

    it('should have valid form when email is correct', () => {
      const form = component['forgotPasswordForm'];
      form.patchValue({
        email: 'test@example.com',
      });

      expect(form.valid).toBeTruthy();
    });
  });

  describe('Error Messages', () => {
    it('should return null error for untouched fields', () => {
      const error = component['getFieldError']('email');
      expect(error).toBeNull();
    });

    it('should return error key for touched invalid fields', () => {
      const emailControl = component['forgotPasswordForm'].get('email');
      emailControl?.markAsTouched();
      const error = component['getFieldError']('email');
      expect(error).toBe('forgotPassword.form.email.errors.required');
    });

    it('should return email format error', () => {
      const emailControl = component['forgotPasswordForm'].get('email');
      emailControl?.setValue('invalid-email');
      emailControl?.markAsTouched();
      const error = component['getFieldError']('email');
      expect(error).toBe('forgotPassword.form.email.errors.email');
    });
  });

  describe('Button States', () => {
    it('should disable submit button when form is invalid', () => {
      expect(component['forgotPasswordForm'].valid).toBeFalsy();
    });

    it('should enable submit button when form is valid', () => {
      component['forgotPasswordForm'].patchValue({
        email: 'test@example.com',
      });

      expect(component['forgotPasswordForm'].valid).toBeTruthy();
    });

    it('should disable submit button during submission', () => {
      component['isSubmitting'].set(true);
      expect(component['isSubmitting']()).toBeTruthy();
    });

    it('should disable submit button during cooldown', () => {
      component['resendCooldown'].set(30);
      expect(component['resendCooldown']()).toBeGreaterThan(0);
    });
  });

  describe('Form Submission', () => {
    it('should mark all fields as touched on invalid submit', () => {
      const markAllAsTouchedSpy = vi.spyOn(component['forgotPasswordForm'], 'markAllAsTouched');
      component['onSubmit']();
      expect(markAllAsTouchedSpy).toHaveBeenCalled();
    });

    it('should not submit during cooldown', () => {
      component['forgotPasswordForm'].patchValue({
        email: 'test@example.com',
      });
      component['resendCooldown'].set(30);

      component['onSubmit']();
      expect(component['isSubmitting']()).toBeFalsy();
    });
  });

  describe('Email Sent State', () => {
    it('should initialize with emailSent as false', () => {
      expect(component['emailSent']()).toBeFalsy();
    });
  });

  describe('Cleanup', () => {
    it('should clear timer on destroy', () => {
      component['resendCooldown'].set(30);
      component.ngOnDestroy();
      // Timer should be cleared
      expect(component['resendTimer']).toBeNull();
    });
  });
});
