import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { of } from 'rxjs';
import { WardList } from './list';
import { WardService } from '../services/ward.service';
import { TranslocoService } from '@jsverse/transloco';
import { MessageService, ConfirmationService } from 'primeng/api';
import { Ward } from '../ward.types';
import { Province } from '../../province/province.types';
import { District } from '../../district/district.types';

describe('WardList Component - Grouping and Sorting', () => {
  let component: WardList;
  let fixture: ComponentFixture<WardList>;
  let mockRouter: jasmine.SpyObj<Router>;
  let mockActivatedRoute: any;
  let mockWardService: jasmine.SpyObj<WardService>;
  let mockTranslocoService: jasmine.SpyObj<TranslocoService>;

  const mockProvinces: Province[] = [
    { id: '1', code: '01', name: 'Hà Nội', nameEn: 'Hanoi', region: 'northern' } as Province,
    { id: '2', code: '79', name: 'Hồ Chí Minh', nameEn: 'Ho Chi Minh', region: 'southern' } as Province,
  ];

  const mockDistricts: District[] = [
    { id: '1', code: '001', name: 'Ba Đình', nameEn: 'Ba Dinh', provinceCode: '01' } as District,
    { id: '2', code: '760', name: 'Quận 1', nameEn: 'District 1', provinceCode: '79' } as District,
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
      code: '00004',
      name: 'Trúc Bạch',
      nameEn: 'Truc Bach',
      provinceCode: '01',
      districtCode: '001',
    } as Ward,
    {
      id: '3',
      code: '26734',
      name: 'Tân Định',
      nameEn: 'Tan Dinh',
      provinceCode: '79',
      districtCode: '760',
    } as Ward,
  ];

  beforeEach(async () => {
    mockRouter = jasmine.createSpyObj('Router', ['navigate']);
    mockWardService = jasmine.createSpyObj('WardService', ['getWards', 'deleteWard', 'exportToCSV', 'exportToGeoJSON']);
    mockWardService.getWards.and.returnValue(of({ items: mockWards, total: 3, page: 1, limit: 10000, totalPages: 1 }));
    mockTranslocoService = jasmine.createSpyObj('TranslocoService', ['translate']);

    mockActivatedRoute = {
      data: of({
        provinceList: { items: mockProvinces, total: 2, page: 1, limit: 1000, totalPages: 1 },
        districtList: { items: mockDistricts, total: 2, page: 1, limit: 10000, totalPages: 1 },
      }),
      params: of({}),
      queryParams: of({
        sort: 'name:asc',
      }),
    };

    mockTranslocoService.translate.and.callFake((key: string, params?: any) => {
      if (key === 'wardList.filter.allProvinces') return 'All Provinces';
      if (key === 'wardList.filter.allDistricts') return 'All Districts';
      if (key === 'wardList.sort.nameAsc') return 'Name (A → Z)';
      if (key === 'wardList.sort.nameDesc') return 'Name (Z → A)';
      if (key === 'wardList.grouping.wards') return 'wards';
      if (key === 'wardList.grouping.toggleGroup' && params) return `Toggle group ${params.name}`;
      return key;
    });

    await TestBed.configureTestingModule({
      imports: [WardList],
      providers: [
        { provide: Router, useValue: mockRouter },
        { provide: ActivatedRoute, useValue: mockActivatedRoute },
        { provide: WardService, useValue: mockWardService },
        { provide: TranslocoService, useValue: mockTranslocoService },
        { provide: MessageService, useValue: jasmine.createSpyObj('MessageService', ['add']) },
        { provide: ConfirmationService, useValue: jasmine.createSpyObj('ConfirmationService', ['confirm']) },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(WardList);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Province Grouping', () => {
    it('should load provinces from route data', (done) => {
      fixture.detectChanges();

      setTimeout(() => {
        expect(component['provinces']()).toEqual(mockProvinces);
        done();
      }, 100);
    });

    it('should group wards by province code', (done) => {
      fixture.detectChanges();

      setTimeout(() => {
        const groups = component['wardsByProvince']();
        expect(groups.length).toBe(2);

        const hanoiGroup = groups.find(g => g.provinceCode === '01');
        expect(hanoiGroup).toBeDefined();
        expect(hanoiGroup!.provinceName).toBe('Hà Nội');

        const hcmGroup = groups.find(g => g.provinceCode === '79');
        expect(hcmGroup).toBeDefined();
        expect(hcmGroup!.provinceName).toBe('Hồ Chí Minh');

        done();
      }, 100);
    });

    it('should lazy load wards when province is expanded', (done) => {
      fixture.detectChanges();

      setTimeout(() => {
        component['toggleGroup']('01');
        
        expect(mockWardService.getWards).toHaveBeenCalledWith({
          page: 1,
          limit: 10000,
          provinceCode: '01',
          sort: 'name:asc',
        });

        done();
      }, 100);
    });
  });

  describe('Group Expansion', () => {
    it('should initialize with all groups collapsed', (done) => {
      fixture.detectChanges();

      setTimeout(() => {
        expect(component['isGroupExpanded']('01')).toBe(false);
        expect(component['isGroupExpanded']('79')).toBe(false);
        done();
      }, 100);
    });

    it('should only allow one province to be expanded at a time', (done) => {
      fixture.detectChanges();

      setTimeout(() => {
        // Expand first province
        component['toggleGroup']('01');
        expect(component['isGroupExpanded']('01')).toBe(true);
        expect(component['isGroupExpanded']('79')).toBe(false);

        // Expand second province - should close first
        component['toggleGroup']('79');
        expect(component['isGroupExpanded']('01')).toBe(false);
        expect(component['isGroupExpanded']('79')).toBe(true);

        done();
      }, 100);
    });

    it('should collapse a province when toggling it while expanded', (done) => {
      fixture.detectChanges();

      setTimeout(() => {
        // Expand province
        component['toggleGroup']('01');
        expect(component['isGroupExpanded']('01')).toBe(true);

        // Collapse it
        component['toggleGroup']('01');
        expect(component['isGroupExpanded']('01')).toBe(false);

        done();
      }, 100);
    });
  });

  describe('Sorting', () => {
    it('should load sort order from query params', (done) => {
      fixture.detectChanges();

      setTimeout(() => {
        expect(component['sortOrder']()).toBe('name:asc');
        done();
      }, 100);
    });

    it('should navigate with sort parameter on sort change', () => {
      fixture.detectChanges();

      const event = { value: 'name:desc' };
      component['onSortChange'](event);

      expect(mockRouter.navigate).toHaveBeenCalledWith(
        [],
        jasmine.objectContaining({
          relativeTo: mockActivatedRoute,
          queryParams: { sort: 'name:desc' },
          queryParamsHandling: 'merge',
        })
      );
    });
  });

  describe('Data Loading from Resolver', () => {
    it('should read provinces from route.data', (done) => {
      fixture.detectChanges();

      setTimeout(() => {
        expect(component['provinces']()).toEqual(mockProvinces);
        done();
      }, 100);
    });

    it('should read districts from route.data', (done) => {
      fixture.detectChanges();

      setTimeout(() => {
        expect(component['districts']()).toEqual(mockDistricts);
        done();
      }, 100);
    });
  });

  describe('Active Province Navigation', () => {
    it('should set active province from route params', (done) => {
      mockActivatedRoute.params = of({ provinceCode: '01' });
      fixture = TestBed.createComponent(WardList);
      component = fixture.componentInstance;
      fixture.detectChanges();

      setTimeout(() => {
        expect(component['activeProvinceCode']()).toBe('01');
        done();
      }, 100);
    });

    it('should auto-expand province when navigating with provinceCode', (done) => {
      mockActivatedRoute.params = of({ provinceCode: '01' });
      fixture = TestBed.createComponent(WardList);
      component = fixture.componentInstance;
      fixture.detectChanges();

      setTimeout(() => {
        expect(component['isGroupExpanded']('01')).toBe(true);
        expect(component['isGroupExpanded']('79')).toBe(false);
        done();
      }, 100);
    });

    it('should compute active province geometry', (done) => {
      const mockGeometry: GeoJSON.Geometry = {
        type: 'Polygon',
        coordinates: [[[105.8, 21.0], [105.9, 21.0], [105.9, 21.1], [105.8, 21.1], [105.8, 21.0]]],
      };
      
      const provincesWithGeometry = mockProvinces.map(p => 
        p.code === '01' ? { ...p, geometry: mockGeometry } : p
      );
      
      mockActivatedRoute.data = of({
        provinceList: { items: provincesWithGeometry, total: 2, page: 1, limit: 1000, totalPages: 1 },
        districtList: { items: mockDistricts, total: 2, page: 1, limit: 10000, totalPages: 1 },
      });
      mockActivatedRoute.params = of({ provinceCode: '01' });
      
      fixture = TestBed.createComponent(WardList);
      component = fixture.componentInstance;
      fixture.detectChanges();

      setTimeout(() => {
        expect(component['activeProvinceGeometry']()).toEqual(mockGeometry);
        done();
      }, 100);
    });

    it('should navigate to province when onProvinceClick is called', () => {
      fixture.detectChanges();

      component['onProvinceClick']('01');

      expect(mockRouter.navigate).toHaveBeenCalledWith(
        ['/management/ward', '01'],
        jasmine.objectContaining({
          queryParamsHandling: 'preserve',
        })
      );
    });
  });

  describe('Search Functionality', () => {
    it('should load search query from query params', (done) => {
      mockActivatedRoute.queryParams = of({ search: 'test', sort: 'name:asc' });
      fixture = TestBed.createComponent(WardList);
      component = fixture.componentInstance;
      fixture.detectChanges();

      setTimeout(() => {
        expect(component['searchQuery']()).toBe('test');
        done();
      }, 100);
    });

    it('should navigate with search query param on search change', () => {
      fixture.detectChanges();

      const event = { target: { value: 'test query' } } as any;
      component['onSearchChange'](event);

      expect(mockRouter.navigate).toHaveBeenCalledWith(
        [],
        jasmine.objectContaining({
          relativeTo: mockActivatedRoute,
          queryParams: { search: 'test query' },
          queryParamsHandling: 'merge',
        })
      );
    });

    it('should clear search param when empty', () => {
      fixture.detectChanges();

      const event = { target: { value: '' } } as any;
      component['onSearchChange'](event);

      expect(mockRouter.navigate).toHaveBeenCalledWith(
        [],
        jasmine.objectContaining({
          relativeTo: mockActivatedRoute,
          queryParams: { search: undefined },
          queryParamsHandling: 'merge',
        })
      );
    });
  });

  describe('Export Functions', () => {
    it('should export to CSV with current filters', (done) => {
      const mockBlob = new Blob(['test'], { type: 'text/csv' });
      mockWardService.exportToCSV.and.returnValue(of(mockBlob));
      
      fixture.detectChanges();

      setTimeout(() => {
        component['onExportCSV']();
        
        expect(mockWardService.exportToCSV).toHaveBeenCalledWith({
          q: undefined,
          provinceCode: undefined,
        });
        
        done();
      }, 100);
    });

    it('should export to CSV with active province filter', (done) => {
      const mockBlob = new Blob(['test'], { type: 'text/csv' });
      mockWardService.exportToCSV.and.returnValue(of(mockBlob));
      
      mockActivatedRoute.params = of({ provinceCode: '01' });
      fixture = TestBed.createComponent(WardList);
      component = fixture.componentInstance;
      fixture.detectChanges();

      setTimeout(() => {
        component['onExportCSV']();
        
        expect(mockWardService.exportToCSV).toHaveBeenCalledWith({
          q: undefined,
          provinceCode: '01',
        });
        
        done();
      }, 100);
    });

    it('should export to GeoJSON with current filters', (done) => {
      const mockBlob = new Blob(['test'], { type: 'application/geo+json' });
      mockWardService.exportToGeoJSON.and.returnValue(of(mockBlob));
      
      fixture.detectChanges();

      setTimeout(() => {
        component['onExportGeoJSON']();
        
        expect(mockWardService.exportToGeoJSON).toHaveBeenCalledWith({
          q: undefined,
          provinceCode: undefined,
        });
        
        done();
      }, 100);
    });
  });
});
