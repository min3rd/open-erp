import { TestBed, ComponentFixture } from '@angular/core/testing';
import { Register } from './register';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { TranslocoTestingModule } from '@jsverse/transloco';
import { MessageService } from 'primeng/api';

describe('Register Component', () => {
  let component: Register;
  let fixture: ComponentFixture<Register>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        Register,
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

    fixture = TestBed.createComponent(Register);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Form Validation', () => {
    it('should initialize with invalid form', () => {
      expect(component['registerForm'].valid).toBeFalsy();
    });

    it('should validate email field', () => {
      const emailControl = component['registerForm'].get('email');
      expect(emailControl?.valid).toBeFalsy();

      emailControl?.setValue('invalid-email');
      expect(emailControl?.valid).toBeFalsy();

      emailControl?.setValue('test@example.com');
      expect(emailControl?.valid).toBeTruthy();
    });

    it('should validate full name with minimum length', () => {
      const fullNameControl = component['registerForm'].get('fullName');
      expect(fullNameControl?.valid).toBeFalsy();

      fullNameControl?.setValue('Short Name');
      expect(fullNameControl?.valid).toBeFalsy();

      fullNameControl?.setValue('John Smith Doe Anderson');
      expect(fullNameControl?.valid).toBeTruthy();
    });

    it('should validate password strength', () => {
      const passwordControl = component['registerForm'].get('password');
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
      const form = component['registerForm'];
      const passwordControl = form.get('password');
      const confirmPasswordControl = form.get('confirmPassword');

      passwordControl?.setValue('Password1!');
      confirmPasswordControl?.setValue('Password1!');
      expect(form.errors?.['passwordMismatch']).toBeFalsy();

      confirmPasswordControl?.setValue('DifferentPassword1!');
      expect(form.errors?.['passwordMismatch']).toBeTruthy();
    });

    it('should validate terms acceptance', () => {
      const termsControl = component['registerForm'].get('termsAccepted');
      expect(termsControl?.valid).toBeFalsy();

      termsControl?.setValue(true);
      expect(termsControl?.valid).toBeTruthy();
    });

    it('should have valid form when all fields are correct', () => {
      const form = component['registerForm'];
      form.patchValue({
        email: 'test@example.com',
        fullName: 'John Smith Doe Anderson',
        password: 'Password1!',
        confirmPassword: 'Password1!',
        termsAccepted: true,
      });

      expect(form.valid).toBeTruthy();
    });
  });

  describe('Button States', () => {
    it('should disable register button when form is invalid', () => {
      expect(component['registerForm'].valid).toBeFalsy();
    });

    it('should enable register button when form is valid', () => {
      component['registerForm'].patchValue({
        email: 'test@example.com',
        fullName: 'John Smith Doe Anderson',
        password: 'Password1!',
        confirmPassword: 'Password1!',
        termsAccepted: true,
      });

      expect(component['registerForm'].valid).toBeTruthy();
    });

    it('should disable register button during submission', () => {
      component['isSubmitting'].set(true);
      expect(component['isSubmitting']()).toBeTruthy();
    });
  });

  describe('Dialog', () => {
    it('should open terms dialog', () => {
      expect(component['showTermsDialog']()).toBeFalsy();
      component['openTermsDialog']();
      expect(component['showTermsDialog']()).toBeTruthy();
    });

    it('should close terms dialog', () => {
      component['showTermsDialog'].set(true);
      expect(component['showTermsDialog']()).toBeTruthy();
      component['closeTermsDialog']();
      expect(component['showTermsDialog']()).toBeFalsy();
    });
  });

  describe('Error Messages', () => {
    it('should return null error for untouched fields', () => {
      const error = component['getFieldError']('email');
      expect(error).toBeNull();
    });

    it('should return error key for touched invalid fields', () => {
      const emailControl = component['registerForm'].get('email');
      emailControl?.markAsTouched();
      const error = component['getFieldError']('email');
      expect(error).toBe('register.form.email.errors.required');
    });

    it('should return email format error', () => {
      const emailControl = component['registerForm'].get('email');
      emailControl?.setValue('invalid-email');
      emailControl?.markAsTouched();
      const error = component['getFieldError']('email');
      expect(error).toBe('register.form.email.errors.email');
    });

    it('should return password mismatch error', () => {
      const form = component['registerForm'];
      form.patchValue({
        password: 'Password1!',
        confirmPassword: 'DifferentPassword1!',
      });
      form.get('confirmPassword')?.markAsTouched();
      const error = component['getConfirmPasswordError']();
      expect(error).toBe('register.form.confirmPassword.errors.mismatch');
    });
  });

  describe('Form Submission', () => {
    it('should mark all fields as touched on invalid submit', async () => {
      const markAllAsTouchedSpy = vi.spyOn(component['registerForm'], 'markAllAsTouched');
      await component['onSubmit']();
      expect(markAllAsTouchedSpy).toHaveBeenCalled();
    });

    it('should set submitting state on valid submit', async () => {
      component['registerForm'].patchValue({
        email: 'test@example.com',
        fullName: 'John Smith Doe Anderson',
        password: 'Password1!',
        confirmPassword: 'Password1!',
        termsAccepted: true,
      });

      const submitPromise = component['onSubmit']();
      expect(component['isSubmitting']()).toBeTruthy();
      await submitPromise;
      expect(component['isSubmitting']()).toBeFalsy();
    });
  });
});
