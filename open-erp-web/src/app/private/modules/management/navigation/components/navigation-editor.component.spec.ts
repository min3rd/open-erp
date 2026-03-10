import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { signal } from '@angular/core';
import { NavigationEditorComponent } from './navigation-editor.component';
import { TranslocoModule, TranslocoService } from '@jsverse/transloco';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Mock Transloco
const mockTranslocoService = {
  translate: (key: string, params?: any) => {
    const translations: Record<string, string> = {
      'navigationManagement.editor.form.id.errors.required': 'ID is required',
      'navigationManagement.editor.form.id.errors.pattern':
        'ID must contain only lowercase letters, numbers, hyphens, and underscores',
      'navigationManagement.editor.form.id.errors.maxlength': 'ID must not exceed 128 characters',
      'navigationManagement.editor.form.id.errors.duplicate':
        'This ID already exists. Please choose a different ID',
      'navigationManagement.editor.form.label.errors.required': 'Label is required',
    };
    if (params && key.includes('{{')) {
      return key.replace(/\{\{(\w+)\}\}/g, (_, p1) => params[p1]);
    }
    return translations[key] || key;
  },
};

describe('NavigationEditorComponent - ID Field', () => {
  let component: NavigationEditorComponent;
  let fixture: ComponentFixture<NavigationEditorComponent>;
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NavigationEditorComponent, ReactiveFormsModule, FormsModule, TranslocoModule],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: TranslocoService, useValue: mockTranslocoService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(NavigationEditorComponent);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('ID Field Initialization', () => {
    it('should create the component with ID field', () => {
      expect(component).toBeTruthy();
      expect(component['form']().get('id')).toBeTruthy();
    });

    it('should have auto-generate ID enabled by default', () => {
      expect(component['isAutoGeneratingId']()).toBe(true);
    });

    it('should have ID field with required validator', () => {
      const idControl = component['form']().get('id');
      expect(idControl?.hasValidator(vi.fn())).toBeDefined();
    });

    it('should have ID field with pattern validator', () => {
      const idControl = component['form']().get('id');
      idControl?.setValue('Invalid@ID');
      expect(idControl?.hasError('pattern')).toBe(true);
    });

    it('should have ID field with maxLength validator', () => {
      const idControl = component['form']().get('id');
      const longString = 'a'.repeat(129);
      idControl?.setValue(longString);
      expect(idControl?.hasError('maxlength')).toBe(true);
    });
  });

  describe('Auto-generation from Label', () => {
    it('should auto-generate ID from label in lowercase', () => {
      const labelControl = component['form']().get('label');
      labelControl?.setValue('Hello World');
      fixture.detectChanges();

      const idControl = component['form']().get('id');
      expect(idControl?.value).toBe('hello-world');
    });

    it('should convert spaces to hyphens', () => {
      const labelControl = component['form']().get('label');
      labelControl?.setValue('My Test Label');
      fixture.detectChanges();

      const idControl = component['form']().get('id');
      expect(idControl?.value).toBe('my-test-label');
    });

    it('should remove special characters', () => {
      const labelControl = component['form']().get('label');
      labelControl?.setValue('Test@Label#123!');
      fixture.detectChanges();

      const idControl = component['form']().get('id');
      expect(idControl?.value).toBe('testlabel123');
    });

    it('should handle diacritics (remove accents)', () => {
      const labelControl = component['form']().get('label');
      labelControl?.setValue('Café Niño');
      fixture.detectChanges();

      const idControl = component['form']().get('id');
      expect(idControl?.value).toBe('cafe-nino');
    });

    it('should not auto-generate if user manually edits ID', () => {
      const idControl = component['form']().get('id');
      const labelControl = component['form']().get('label');

      // User manually sets ID
      component['onIdInput']();
      idControl?.setValue('custom-id');
      component['isAutoGeneratingId'].set(false);

      // Change label
      labelControl?.setValue('New Label');
      fixture.detectChanges();

      // ID should not change
      expect(idControl?.value).toBe('custom-id');
    });
  });

  describe('Toggle Auto-generation', () => {
    it('should toggle auto-generation off when user types in ID field', () => {
      expect(component['isAutoGeneratingId']()).toBe(true);

      component['onIdInput']();

      expect(component['isAutoGeneratingId']()).toBe(false);
    });

    it('should toggle auto-generation with toggleAutoGenerateId method', () => {
      component['isAutoGeneratingId'].set(true);
      component['toggleAutoGenerateId']();
      expect(component['isAutoGeneratingId']()).toBe(false);

      component['toggleAutoGenerateId']();
      expect(component['isAutoGeneratingId']()).toBe(true);
    });

    it('should regenerate ID when toggling auto-generation back on', () => {
      const labelControl = component['form']().get('label');
      const idControl = component['form']().get('id');

      // Set label and let it auto-generate
      labelControl?.setValue('Test Label');
      fixture.detectChanges();
      expect(idControl?.value).toBe('test-label');

      // Manually change ID (turns off auto-generation)
      component['isAutoGeneratingId'].set(false);
      idControl?.setValue('custom-id');

      // Toggle auto-generation back on
      component['toggleAutoGenerateId']();

      // ID should regenerate from label
      expect(idControl?.value).toBe('test-label');
    });
  });

  describe('Regenerate from Label Button', () => {
    it('should regenerate ID from current label', () => {
      const labelControl = component['form']().get('label');
      const idControl = component['form']().get('id');

      labelControl?.setValue('Original Label');
      fixture.detectChanges();

      // Manually change ID
      component['isAutoGeneratingId'].set(false);
      idControl?.setValue('custom-id');

      // Regenerate
      component['regenerateIdFromLabel']();

      expect(idControl?.value).toBe('original-label');
      expect(component['isAutoGeneratingId']()).toBe(true);
    });

    it('should clear uniqueness error when regenerating', () => {
      component['idUniquenessError'].set('ID already exists');
      component['form']().get('label')?.setValue('New Label');

      component['regenerateIdFromLabel']();

      expect(component['idUniquenessError']()).toBeNull();
    });
  });

  describe('ID Validation', () => {
    it('should accept valid ID with lowercase letters', () => {
      const idControl = component['form']().get('id');
      idControl?.setValue('valid-id');
      expect(idControl?.valid).toBe(true);
    });

    it('should accept valid ID with numbers', () => {
      const idControl = component['form']().get('id');
      idControl?.setValue('valid-id-123');
      expect(idControl?.valid).toBe(true);
    });

    it('should accept valid ID with underscores', () => {
      const idControl = component['form']().get('id');
      idControl?.setValue('valid_id_test');
      expect(idControl?.valid).toBe(true);
    });

    it('should reject ID with uppercase letters', () => {
      const idControl = component['form']().get('id');
      idControl?.setValue('Invalid-ID');
      expect(idControl?.hasError('pattern')).toBe(true);
    });

    it('should reject ID with special characters', () => {
      const idControl = component['form']().get('id');
      idControl?.setValue('invalid@id#test');
      expect(idControl?.hasError('pattern')).toBe(true);
    });

    it('should reject ID with spaces', () => {
      const idControl = component['form']().get('id');
      idControl?.setValue('invalid id');
      expect(idControl?.hasError('pattern')).toBe(true);
    });

    it('should reject empty ID', () => {
      const idControl = component['form']().get('id');
      idControl?.setValue('');
      idControl?.markAsTouched();
      expect(idControl?.hasError('required')).toBe(true);
    });
  });

  describe('ID Uniqueness Check', () => {
    it('should check ID uniqueness on blur', () => {
      const idControl = component['form']().get('id');
      idControl?.setValue('test-id');

      component['onIdBlur']();

      const req = httpMock.expectOne('/api/v1/navigations/test-id');
      expect(req.request.method).toBe('GET');
    });

    it('should set uniqueness error if ID exists (status 200)', () => {
      const idControl = component['form']().get('id');
      idControl?.setValue('existing-id');

      component['onIdBlur']();

      const req = httpMock.expectOne('/api/v1/navigations/existing-id');
      req.flush({ id: 'existing-id' }); // ID exists

      expect(component['idUniquenessError']()).toBe(
        'This ID already exists. Please choose a different ID',
      );
    });

    it('should clear uniqueness error if ID does not exist (status 404)', () => {
      const idControl = component['form']().get('id');
      idControl?.setValue('new-id');

      component['onIdBlur']();

      const req = httpMock.expectOne('/api/v1/navigations/new-id');
      req.flush('Not found', { status: 404, statusText: 'Not Found' });

      expect(component['idUniquenessError']()).toBeNull();
    });

    it('should skip uniqueness check if ID is invalid', () => {
      const idControl = component['form']().get('id');
      idControl?.setValue('Invalid@ID');

      component['onIdBlur']();

      httpMock.expectNone('/api/v1/navigations/Invalid@ID');
    });

    it('should skip uniqueness check if editing and ID has not changed', () => {
      // Simulate editing mode with input signal
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        imports: [NavigationEditorComponent, ReactiveFormsModule, FormsModule, TranslocoModule],
        providers: [
          provideHttpClient(),
          provideHttpClientTesting(),
          { provide: TranslocoService, useValue: mockTranslocoService },
        ],
      }).compileComponents();

      fixture = TestBed.createComponent(NavigationEditorComponent);
      component = fixture.componentInstance;

      // Set input values before initialization
      fixture.componentRef.setInput('item', {
        id: 'existing-id',
        label: 'Test',
        scope: 'global',
        order: 0,
      });
      fixture.componentRef.setInput('mode', 'edit');

      fixture.detectChanges();
      httpMock = TestBed.inject(HttpTestingController);

      const idControl = component['form']().get('id');
      idControl?.setValue('existing-id');

      component['onIdBlur']();

      httpMock.expectNone('/api/v1/navigations/existing-id');
    });

    it('should clear uniqueness error when user types', () => {
      component['idUniquenessError'].set('ID already exists');

      component['onIdInput']();

      expect(component['idUniquenessError']()).toBeNull();
    });
  });

  describe('Error Messages', () => {
    it('should return correct error message for required field', () => {
      const idControl = component['form']().get('id');
      idControl?.setValue('');
      idControl?.markAsTouched();

      const errorMsg = component['getErrorMessage']('id');
      expect(errorMsg).toBe('ID is required');
    });

    it('should return correct error message for pattern error', () => {
      const idControl = component['form']().get('id');
      idControl?.setValue('Invalid@ID');
      idControl?.markAsTouched();

      const errorMsg = component['getErrorMessage']('id');
      expect(errorMsg).toBe(
        'ID must contain only lowercase letters, numbers, hyphens, and underscores',
      );
    });

    it('should return correct error message for maxlength error', () => {
      const idControl = component['form']().get('id');
      const longString = 'a'.repeat(129);
      idControl?.setValue(longString);
      idControl?.markAsTouched();

      const errorMsg = component['getErrorMessage']('id');
      expect(errorMsg).toBe('ID must not exceed 128 characters');
    });
  });

  describe('Edit Mode Behavior', () => {
    it('should disable auto-generation when editing existing item', () => {
      const existingItem = {
        id: 'existing-id',
        label: 'Existing Item',
        scope: 'global' as const,
        order: 0,
      };

      // Use fixture.componentRef.setInput to set input signals
      fixture.componentRef.setInput('item', existingItem);
      fixture.componentRef.setInput('mode', 'edit');
      fixture.detectChanges();

      component['patchForm'](existingItem);

      expect(component['isAutoGeneratingId']()).toBe(false);
      expect(component['form']().get('id')?.value).toBe('existing-id');
    });

    it('should update ID preview when patching form', () => {
      const existingItem = {
        id: 'my-item-id',
        label: 'My Item',
        scope: 'global' as const,
        order: 0,
      };

      component['patchForm'](existingItem);

      expect(component['idPreview']()).toBe('my-item-id');
    });
  });

  describe('DTO Building', () => {
    it('should include user-provided ID in DTO', () => {
      const labelControl = component['form']().get('label');
      const idControl = component['form']().get('id');

      labelControl?.setValue('Test Label');
      idControl?.setValue('custom-test-id');
      component['form']().get('scope')?.setValue('global');

      const dto = component['buildDto']();

      expect(dto.id).toBe('custom-test-id');
      expect(dto.label).toBe('Test Label');
    });

    it('should not auto-generate ID in DTO (use form value)', () => {
      const labelControl = component['form']().get('label');
      const idControl = component['form']().get('id');

      labelControl?.setValue('Different Label');
      idControl?.setValue('specific-id');
      component['form']().get('scope')?.setValue('global');

      const dto = component['buildDto']();

      // Should use the exact ID from the form, not generated from label
      expect(dto.id).toBe('specific-id');
    });
  });
});
