import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslocoTestingModule } from '@jsverse/transloco';
import { PaginationComponent } from './pagination';

describe('PaginationComponent', () => {
  let component: PaginationComponent;
  let fixture: ComponentFixture<PaginationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        PaginationComponent,
        TranslocoTestingModule.forRoot({
          langs: {
            en: {
              pagination: {
                first: 'First page',
                previous: 'Previous page',
                next: 'Next page',
                last: 'Last page',
                page: 'Page {{page}}',
                pageSize: 'Items per page',
              },
            },
            es: {},
          },
          translocoConfig: {
            availableLangs: ['en', 'es'],
            defaultLang: 'en',
          },
        }),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(PaginationComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('idPrefix', 'test-list');
    fixture.componentRef.setInput('totalRecords', 500);
    fixture.componentRef.setInput('currentPage', 2);
    fixture.componentRef.setInput('pageSize', 100);
    fixture.detectChanges();
  });

  it('should render pagination controls with aria labels', () => {
    const compiled = fixture.nativeElement as HTMLElement;

    const firstButton = compiled.querySelector('#test-list-pagination-first-button');
    const prevButton = compiled.querySelector('#test-list-pagination-prev-button');
    const nextButton = compiled.querySelector('#test-list-pagination-next-button');
    const lastButton = compiled.querySelector('#test-list-pagination-last-button');
    const pageSizeSelect = compiled.querySelector('#test-list-pagination-page-size');
    const currentPageButton = compiled.querySelector('#test-list-pagination-page-2');

    expect(firstButton?.getAttribute('aria-label')).toBe('First page');
    expect(prevButton?.getAttribute('aria-label')).toBe('Previous page');
    expect(nextButton?.getAttribute('aria-label')).toBe('Next page');
    expect(lastButton?.getAttribute('aria-label')).toBe('Last page');
    expect(pageSizeSelect).toBeTruthy();
    expect(currentPageButton?.getAttribute('aria-current')).toBe('page');
    expect(currentPageButton?.getAttribute('aria-label')).toBe('Page 2');
  });

  it('should emit pageChange and navigateTo when paginator changes page', () => {
    let pageChangeValue: { page: number; pageSize: number } | null = null;
    let navigateToValue: number | null = null;
    component.pageChange.subscribe((value) => {
      pageChangeValue = value;
    });
    component.navigateTo.subscribe((value) => {
      navigateToValue = value;
    });

    component['onPaginatorChange']({ page: 2, rows: 100 });

    expect(pageChangeValue).toEqual({ page: 3, pageSize: 100 });
    expect(navigateToValue).toBe(3);
  });

  it('should emit changePageSize and pageChange when page size changes', () => {
    let pageChangeValue: { page: number; pageSize: number } | null = null;
    let pageSizeValue: number | null = null;
    component.pageChange.subscribe((value) => {
      pageChangeValue = value;
    });
    component.changePageSize.subscribe((value) => {
      pageSizeValue = value;
    });

    component['onPaginatorChange']({ page: 0, rows: 500 });

    expect(pageSizeValue).toBe(500);
    expect(pageChangeValue).toEqual({ page: 1, pageSize: 500 });
  });
});
