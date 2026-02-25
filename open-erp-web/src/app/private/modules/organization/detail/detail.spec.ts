import { TestBed, ComponentFixture } from '@angular/core/testing';
import { Detail } from './detail';
import { provideRouter } from '@angular/router';
import { TranslocoTestingModule } from '@jsverse/transloco';
import { provideHttpClient } from '@angular/common/http';
import { MessageService } from 'primeng/api';

describe('Detail - New Field Validations', () => {
  let component: Detail;
  let fixture: ComponentFixture<Detail>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        Detail,
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

    fixture = TestBed.createComponent(Detail);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Organization Type field', () => {
    it('should be required', () => {
      const typeControl = component.registrationForm.get('type');
      expect(typeControl?.hasError('required')).toBe(true);
    });

    it('should be valid when a type is selected', () => {
      const typeControl = component.registrationForm.get('type');
      typeControl?.setValue('company');
      expect(typeControl?.valid).toBe(true);
    });
  });

  describe('Status field', () => {
    it('should default to "active"', () => {
      const statusControl = component.registrationForm.get('status');
      expect(statusControl?.value).toBe('active');
    });

    it('should be required', () => {
      const statusControl = component.registrationForm.get('status');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      statusControl?.setValue('' as any);
      expect(statusControl?.hasError('required')).toBe(true);
    });
  });

  describe('Country field', () => {
    it('should be required', () => {
      const countryControl = component.registrationForm.get('country');
      expect(countryControl?.hasError('required')).toBe(true);
    });

    it('should be valid when a country is selected', () => {
      const countryControl = component.registrationForm.get('country');
      countryControl?.setValue({ code: 'VN', name: 'Vietnam', flag: '🇻🇳' });
      expect(countryControl?.valid).toBe(true);
    });
  });

  describe('Description field', () => {
    it('should be optional', () => {
      const descriptionControl = component.registrationForm.get('description');
      expect(descriptionControl?.hasError('required')).toBe(false);
    });

    it('should accept text input', () => {
      const descriptionControl = component.registrationForm.get('description');
      descriptionControl?.setValue('This is a test description');
      expect(descriptionControl?.valid).toBe(true);
      expect(descriptionControl?.value).toBe('This is a test description');
    });
  });

  describe('Website field', () => {
    it('should be optional', () => {
      const websiteControl = component.registrationForm.get('website');
      expect(websiteControl?.hasError('required')).toBe(false);
    });

    it('should accept valid http URLs', () => {
      const websiteControl = component.registrationForm.get('website');
      websiteControl?.setValue('http://example.com');
      expect(websiteControl?.valid).toBe(true);
    });

    it('should accept valid https URLs', () => {
      const websiteControl = component.registrationForm.get('website');
      websiteControl?.setValue('https://example.com');
      expect(websiteControl?.valid).toBe(true);
    });

    it('should reject URLs without protocol', () => {
      const websiteControl = component.registrationForm.get('website');
      websiteControl?.setValue('example.com');
      websiteControl?.markAsTouched();
      expect(websiteControl?.hasError('invalidWebsite')).toBe(true);
    });

    it('should reject invalid protocols', () => {
      const websiteControl = component.registrationForm.get('website');
      websiteControl?.setValue('ftp://example.com');
      websiteControl?.markAsTouched();
      expect(websiteControl?.hasError('invalidWebsite')).toBe(true);
    });

    it('should be valid when empty', () => {
      const websiteControl = component.registrationForm.get('website');
      websiteControl?.setValue('');
      expect(websiteControl?.valid).toBe(true);
    });
  });

  describe('Form submission', () => {
    it('should be invalid when required new fields are missing', () => {
      // Set only old required fields
      component.registrationForm.patchValue({
        taxId: '1234567890',
        name: 'Test Company',
        internationalName: 'Test Company Ltd',
        headquartersAddress: '123 Test Street',
        legalRepresentative: 'John Doe',
        contactPhone: '0901234567',
        contactEmail: 'test@example.com',
        foundedDate: new Date(),
      });

      expect(component.registrationForm.valid).toBe(false);
    });

    it('should be valid when all required fields including new ones are filled', () => {
      component.registrationForm.patchValue({
        taxId: '1234567890',
        name: 'Test Company',
        internationalName: 'Test Company Ltd',
        headquartersAddress: '123 Test Street',
        legalRepresentative: 'John Doe',
        contactPhone: '0901234567',
        contactEmail: 'test@example.com',
        foundedDate: new Date(),
        type: 'company',
        status: 'active',
        country: { code: 'VN', name: 'Vietnam', flag: '🇻🇳' },
      });

      expect(component.registrationForm.valid).toBe(true);
    });
  });
});
