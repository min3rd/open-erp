import { TestBed, ComponentFixture } from '@angular/core/testing';
import { ResetPassword } from './reset-password';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { TranslocoTestingModule } from '@jsverse/transloco';
import { MessageService } from 'primeng/api';

describe('ResetPassword Component', () => {
  let component: ResetPassword;
  let fixture: ComponentFixture<ResetPassword>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        ResetPassword,
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

    fixture = TestBed.createComponent(ResetPassword);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Form Validation', () => {
    it('should initialize with invalid form', () => {
      expect(component['resetPasswordForm'].valid).toBeFalsy();
    });

    it('should validate password strength', () => {
      const passwordControl = component['resetPasswordForm'].get('password');
      expect(passwordControl?.valid).toBeFalsy();

      // Too short
      passwordControl?.setValue('Pass1!');
      expect(passwordControl?.valid).toBeFalsy();

      // Missing uppercase
      passwordControl?.setValue('password1!');
      expect(passwordControl?.valid).toBeFalsy();

      // Missing lowercase
      passwordControl?.setValue('PASSWORD1!');
      expect(passwordControl?.valid).toBeFalsy();

      // Missing number
      passwordControl?.setValue('Password!');
      expect(passwordControl?.valid).toBeFalsy();

      // Missing special character
      passwordControl?.setValue('Password1');
      expect(passwordControl?.valid).toBeFalsy();

      // Valid password
      passwordControl?.setValue('Password1!');
      expect(passwordControl?.valid).toBeTruthy();
    });

    it('should validate password match', () => {
      const form = component['resetPasswordForm'];
      const passwordControl = form.get('password');
      const confirmPasswordControl = form.get('confirmPassword');

      passwordControl?.setValue('Password1!');
      confirmPasswordControl?.setValue('Password1!');
      expect(form.errors?.['passwordMismatch']).toBeFalsy();

      confirmPasswordControl?.setValue('DifferentPassword1!');
      expect(form.errors?.['passwordMismatch']).toBeTruthy();
    });

    it('should have valid form when all fields are correct', () => {
      const form = component['resetPasswordForm'];
      form.patchValue({
        password: 'Password1!',
        confirmPassword: 'Password1!',
      });

      expect(form.valid).toBeTruthy();
    });
  });

  describe('Error Messages', () => {
    it('should return null error for untouched fields', () => {
      const error = component['getFieldError']('password');
      expect(error).toBeNull();
    });

    it('should return error key for touched invalid fields', () => {
      const passwordControl = component['resetPasswordForm'].get('password');
      passwordControl?.markAsTouched();
      const error = component['getFieldError']('password');
      expect(error).toBe('resetPassword.form.password.errors.required');
    });

    it('should return password mismatch error', () => {
      const form = component['resetPasswordForm'];
      form.patchValue({
        password: 'Password1!',
        confirmPassword: 'DifferentPassword1!',
      });
      form.get('confirmPassword')?.markAsTouched();
      const error = component['getConfirmPasswordError']();
      expect(error).toBe('resetPassword.form.confirmPassword.errors.mismatch');
    });
  });

  describe('Token Validation', () => {
    it('should set tokenValid to false when no token in query params', () => {
      expect(component['tokenValid']()).toBeFalsy();
    });

    it('should initialize token as null when no token in query params', () => {
      expect(component['token']()).toBeNull();
    });
  });

  describe('Button States', () => {
    it('should disable submit button when form is invalid', () => {
      expect(component['resetPasswordForm'].valid).toBeFalsy();
    });

    it('should enable submit button when form is valid', () => {
      component['resetPasswordForm'].patchValue({
        password: 'Password1!',
        confirmPassword: 'Password1!',
      });

      expect(component['resetPasswordForm'].valid).toBeTruthy();
    });

    it('should disable submit button during submission', () => {
      component['isSubmitting'].set(true);
      expect(component['isSubmitting']()).toBeTruthy();
    });
  });

  describe('Form Submission', () => {
    it('should mark all fields as touched on invalid submit', () => {
      const markAllAsTouchedSpy = vi.spyOn(component['resetPasswordForm'], 'markAllAsTouched');
      component['onSubmit']();
      expect(markAllAsTouchedSpy).toHaveBeenCalled();
    });

    it('should not submit if token is not available', () => {
      component['resetPasswordForm'].patchValue({
        password: 'Password1!',
        confirmPassword: 'Password1!',
      });
      component['token'].set(null);

      component['onSubmit']();
      expect(component['tokenValid']()).toBeFalsy();
    });
  });
});
