import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { of } from 'rxjs';
import { AdminUnitsList } from './list';
import { ProvinceService } from '../../province/services/province.service';
import { WardService } from '../../ward/services/ward.service';
import { TranslocoService } from '@jsverse/transloco';
import { MessageService, ConfirmationService } from 'primeng/api';
import { Province } from '../../province/province.types';
import { Ward } from '../../ward/ward.types';

describe('AdminUnitsList Component', () => {
  let component: AdminUnitsList;
  let fixture: ComponentFixture<AdminUnitsList>;
  let mockRouter: jasmine.SpyObj<Router>;
  let mockActivatedRoute: any;
  let mockProvinceService: jasmine.SpyObj<ProvinceService>;
  let mockWardService: jasmine.SpyObj<WardService>;
  let mockTranslocoService: jasmine.SpyObj<TranslocoService>;

  const mockProvinces: Province[] = [
    { id: '1', code: '01', name: 'Hà Nội', region: 'Northern' } as Province,
    { id: '2', code: '79', name: 'Hồ Chí Minh', region: 'Southern' } as Province,
  ];

  const mockWards: Ward[] = [
    {
      id: '1',
      code: '00001',
      name: 'Phúc Xá',
      nameEn: 'Phuc Xa',
      provinceCode: '01',
      districtCode: '001',
    } as Ward,
    {
      id: '2',
      code: '26734',
      name: 'Tân Định',
      nameEn: 'Tan Dinh',
      provinceCode: '79',
      districtCode: '760',
    } as Ward,
  ];

  beforeEach(async () => {
    mockRouter = jasmine.createSpyObj('Router', ['navigate']);
    mockActivatedRoute = {
      data: of({ provinces: mockProvinces }),
      paramMap: of(new Map()),
      queryParamMap: of(new Map()),
    };
    mockProvinceService = jasmine.createSpyObj('ProvinceService', [
      'getProvinces',
      'deleteProvince',
      'exportToCSV',
      'exportToGeoJSON',
    ]);
    mockWardService = jasmine.createSpyObj('WardService', [
      'getWards',
      'deleteWard',
      'exportToCSV',
      'exportToGeoJSON',
    ]);
    mockTranslocoService = jasmine.createSpyObj('TranslocoService', ['translate']);

    // Setup default return values
    mockProvinceService.getProvinces.and.returnValue(
      of({
        items: mockProvinces,
        total: 2,
        page: 1,
        limit: 100,
        totalPages: 1,
      }),
    );
    mockWardService.getWards.and.returnValue(
      of({
        items: mockWards,
        total: 2,
        page: 1,
        limit: 100,
        totalPages: 1,
      }),
    );
    mockTranslocoService.translate.and.returnValue('Translated');

    await TestBed.configureTestingModule({
      imports: [AdminUnitsList],
      providers: [
        { provide: Router, useValue: mockRouter },
        { provide: ActivatedRoute, useValue: mockActivatedRoute },
        { provide: ProvinceService, useValue: mockProvinceService },
        { provide: WardService, useValue: mockWardService },
        { provide: TranslocoService, useValue: mockTranslocoService },
        MessageService,
        ConfirmationService,
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AdminUnitsList);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load provinces from resolver on init', () => {
    expect(component['provinces']()).toEqual(mockProvinces);
  });

  it('should filter provinces based on global search', () => {
    component['globalSearch'].set('Hà Nội');
    const filtered = component['filteredProvinces']();
    expect(filtered.length).toBe(1);
    expect(filtered[0].name).toBe('Hà Nội');
  });

  it('should load wards when province is expanded', () => {
    const provinceCode = '01';
    component['loadWardsForProvince'](provinceCode);

    expect(mockWardService.getWards).toHaveBeenCalledWith({
      provinceCode,
      q: '',
      page: 1,
      limit: 100,
    });
  });

  it('should update route when global search changes', () => {
    component['globalSearch'].set('test');
    component['onGlobalSearch']();

    expect(mockRouter.navigate).toHaveBeenCalled();
  });

  it('should navigate to province form on add province', () => {
    component['addProvince']();
    expect(mockRouter.navigate).toHaveBeenCalledWith(['province', 'new'], jasmine.any(Object));
  });

  it('should navigate to ward form on add ward', () => {
    const provinceCode = '01';
    component['addWard'](provinceCode);
    expect(mockRouter.navigate).toHaveBeenCalledWith(
      ['ward', 'new'],
      jasmine.objectContaining({
        queryParams: { provinceCode },
      }),
    );
  });
});
