import { TestBed, ComponentFixture } from '@angular/core/testing';
import { QuickWarehouseDrawer } from './quick-warehouse-drawer';
import { TranslocoTestingModule } from '@jsverse/transloco';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { of, throwError } from 'rxjs';
import { WarehouseService, Warehouse } from '../../../../../../core/services/warehouse/warehouse.service';
import { OrganizationContextService } from '../../../../../../core/services/organization-context.service';
import { signal } from '@angular/core';

const mockWarehouse: Warehouse = {
  id: 'wh-001',
  code: 'WH-TST-001',
  name: 'Test Warehouse',
  type: 'general',
  status: 'active',
  addressDetail: '123 Test St',
  ward: { code: '001', name: 'Test Ward' },
  province: { code: '01', name: 'Test Province' },
};

describe('QuickWarehouseDrawer', () => {
  let component: QuickWarehouseDrawer;
  let fixture: ComponentFixture<QuickWarehouseDrawer>;
  let warehouseService: WarehouseService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        QuickWarehouseDrawer,
        HttpClientTestingModule,
        TranslocoTestingModule.forRoot({
          langs: { en: {}, es: {} },
          translocoConfig: { availableLangs: ['en', 'es'], defaultLang: 'en' },
        }),
      ],
      providers: [
        {
          provide: OrganizationContextService,
          useValue: { currentOrganization: signal({ id: 'org-1', name: 'Test Org' }) },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(QuickWarehouseDrawer);
    component = fixture.componentInstance;
    warehouseService = TestBed.inject(WarehouseService);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have an invalid form when name is empty', () => {
    expect(component['form'].invalid).toBe(true);
  });

  it('should have a valid form when name is provided', () => {
    component['form'].patchValue({ name: 'My Warehouse' });
    expect(component['form'].valid).toBe(true);
  });

  it('should auto-derive code from name when code field is pristine', () => {
    const nameCtrl = component['form'].get('name')!;
    const codeCtrl = component['form'].get('code')!;
    nameCtrl.setValue('My Test WH');
    component['onNameInput']();
    expect(codeCtrl.value).toBeTruthy();
    expect(codeCtrl.value?.length).toBeGreaterThan(0);
  });

  it('should NOT overwrite a manually typed code', () => {
    const codeCtrl = component['form'].get('code')!;
    codeCtrl.setValue('MANUAL-CODE');
    codeCtrl.markAsDirty();
    component['form'].get('name')?.setValue('Some Name');
    component['onNameInput']();
    expect(codeCtrl.value).toBe('MANUAL-CODE');
  });

  it('should call quickCreateWarehouse and emit warehouseCreated on success', () => {
    vi.spyOn(warehouseService, 'quickCreateWarehouse').mockReturnValue(of(mockWarehouse));
    const emitSpy = vi.spyOn(component.warehouseCreated, 'emit');

    component['form'].patchValue({ name: 'Test WH', code: 'WH-001' });
    component['save']();

    expect(warehouseService.quickCreateWarehouse).toHaveBeenCalled();
    expect(emitSpy).toHaveBeenCalledWith(mockWarehouse);
  });

  it('should keep drawer open and stop saving when API call fails', () => {
    vi.spyOn(warehouseService, 'quickCreateWarehouse').mockReturnValue(
      throwError(() => new Error('API error')),
    );
    const closeSpy = vi.spyOn(component as any, 'close');

    component['form'].patchValue({ name: 'Fail WH' });
    component['save']();

    expect(closeSpy).not.toHaveBeenCalled();
    expect(component['saving']()).toBe(false);
  });

  it('randomize() should fill the form with non-empty values', () => {
    component['randomize']();
    expect(component['form'].get('name')?.value?.length).toBeGreaterThan(0);
    expect(component['form'].get('code')?.value?.length).toBeGreaterThan(0);
    expect(component['form'].get('addressDetail')?.value?.length).toBeGreaterThan(0);
  });

  it('close() should reset the form and emit visibleChange false', () => {
    const emitSpy = vi.spyOn(component.visibleChange, 'emit');
    component['form'].patchValue({ name: 'Test' });
    component['close']();
    expect(component['form'].get('name')?.value).toBeFalsy();
    expect(emitSpy).toHaveBeenCalledWith(false);
  });
});
