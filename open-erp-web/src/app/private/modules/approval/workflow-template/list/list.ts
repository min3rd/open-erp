import {
  ChangeDetectionStrategy,
  Component,
  signal,
  computed,
  inject,
  OnInit,
  OnDestroy,
  effect,
  ViewChild,
  ElementRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TranslocoModule, TranslocoService } from '@jsverse/transloco';
import { Subject, takeUntil } from 'rxjs';

// PrimeNG imports
import { TableModule, TableLazyLoadEvent } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { MpToolbar } from '../../../../../../core/components/toolbar';
import { MenuModule } from 'primeng/menu';
import { Menu } from 'primeng/menu';
import { ContextMenuModule } from 'primeng/contextmenu';
import { TooltipModule } from 'primeng/tooltip';
import { TagModule } from 'primeng/tag';
import { MultiSelectModule } from 'primeng/multiselect';
import { MessageService, ConfirmationService } from 'primeng/api';
import { MenuItem } from 'primeng/api';
import { InputGroupModule } from 'primeng/inputgroup';
import { InputGroupAddonModule } from 'primeng/inputgroupaddon';
import { ConfirmDialogModule } from 'primeng/confirmdialog';

// Core components
import { PaginationComponent } from '../../../../../../core/components/pagination/pagination';

// Services
import {
  WorkflowTemplateService,
  WorkflowTemplate,
  TemplateStatus,
  QueryWorkflowTemplateParams,
} from '../../../../../../core/services/workflow-template/workflow-template.service';
import { UserDatePipe } from '../../../../../../core/pipes/user-date.pipe';
import { PAGE_SIZE_OPTIONS } from '../../../../../../core/constants/ui.constants';

/**
 * Column definition interface
 */
interface ColumnDef {
  field: string;
  header: string;
  sortable: boolean;
  width?: string;
}

@Component({
  selector: 'approval-workflow-template-list',
  imports: [
    CommonModule,
    FormsModule,
    TranslocoModule,
    TableModule,
    ButtonModule,
    InputTextModule,
    MpToolbar,
    MenuModule,
    ContextMenuModule,
    TooltipModule,
    TagModule,
    MultiSelectModule,
    PaginationComponent,
    InputGroupModule,
    InputGroupAddonModule,
    ConfirmDialogModule,
    UserDatePipe,
  ],
  providers: [ConfirmationService],
  templateUrl: './list.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WorkflowTemplateList implements OnInit, OnDestroy {
  @ViewChild('mobileSearchInput') mobileSearchInput?: ElementRef<HTMLInputElement>;

  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private templateService = inject(WorkflowTemplateService);
  private messageService = inject(MessageService);
  private confirmationService = inject(ConfirmationService);
  private translocoService = inject(TranslocoService);
  private destroy$ = new Subject<void>();
  private resizeHandler: (() => void) | null = null;

  // Constants
  private readonly SEARCH_FOCUS_DELAY = 100;
  protected readonly PAGE_SIZE_OPTIONS = PAGE_SIZE_OPTIONS;

  // Column definitions
  protected readonly columnOptions: ColumnDef[] = [
    { field: 'name', header: 'workflowTemplate.table.name', sortable: true },
    {
      field: 'entityType',
      header: 'workflowTemplate.table.entityType',
      sortable: true,
      width: '150px',
    },
    { field: 'scope', header: 'workflowTemplate.table.scope', sortable: true, width: '120px' },
    { field: 'status', header: 'workflowTemplate.table.status', sortable: true, width: '120px' },
    {
      field: 'createdAt',
      header: 'workflowTemplate.table.createdAt',
      sortable: true,
      width: '180px',
    },
  ];
  protected selectedColumns: ColumnDef[] = [...this.columnOptions];

  // State signals
  protected readonly templates = signal<WorkflowTemplate[]>([]);
  protected selectedTemplates: WorkflowTemplate[] = [];
  protected readonly selectedTemplate = signal<WorkflowTemplate | null>(null);
  protected contextMenuSelectedTemplate: WorkflowTemplate | null = null;
  protected readonly isLoading = signal(false);
  protected readonly searchQuery = signal('');
  protected readonly currentPage = signal(1);
  protected readonly pageSize = signal(PAGE_SIZE_OPTIONS[0]);
  protected readonly totalRecords = signal(0);
  protected readonly isMobile = signal(false);
  protected readonly isSearchOpen = signal(false);
  protected readonly sortField = signal<string>('createdAt');
  protected readonly sortOrder = signal<number>(-1);

  // Current row menu items
  protected currentRowMenuItems: MenuItem[] = [];

  // Computed values
  protected readonly totalPages = computed(() => Math.ceil(this.totalRecords() / this.pageSize()));

  // Action menu items
  protected currentActionMenuItems: MenuItem[] = [];

  private buildActionMenuItems(): MenuItem[] {
    return [
      {
        label: this.translocoService.translate('workflowTemplate.actions.deleteSelected'),
        icon: 'pi pi-trash',
        disabled: this.selectedTemplates.length === 0,
        command: () => this.onBulkDelete(),
      },
    ];
  }

  protected onShowActionMenu(event: MouseEvent, menu: Menu): void {
    this.currentActionMenuItems = this.buildActionMenuItems();
    menu.toggle(event);
  }

  // Context menu items
  protected currentContextMenuItems: MenuItem[] = [];

  private buildContextMenuItems(template: WorkflowTemplate): MenuItem[] {
    const items: MenuItem[] = [
      {
        label: this.translocoService.translate('workflowTemplate.contextMenu.view'),
        icon: 'pi pi-eye',
        command: () => this.onViewTemplate(template),
      },
      {
        label: this.translocoService.translate('workflowTemplate.contextMenu.edit'),
        icon: 'pi pi-pencil',
        command: () => this.onEditTemplate(template),
        disabled: template.status === TemplateStatus.PUBLISHED,
      },
      {
        label: this.translocoService.translate('workflowTemplate.contextMenu.clone'),
        icon: 'pi pi-copy',
        command: () => this.onCloneTemplate(template),
      },
      { separator: true },
    ];

    if (template.status === TemplateStatus.DRAFT) {
      items.push({
        label: this.translocoService.translate('workflowTemplate.actions.publish'),
        icon: 'pi pi-check-circle',
        command: () => this.onPublishTemplate(template),
      });
    }
    if (template.status !== TemplateStatus.ARCHIVED) {
      items.push({
        label: this.translocoService.translate('workflowTemplate.actions.archive'),
        icon: 'pi pi-inbox',
        command: () => this.onArchiveTemplate(template),
      });
    }

    items.push({ separator: true });
    items.push({
      label: this.translocoService.translate('workflowTemplate.contextMenu.delete'),
      icon: 'pi pi-trash',
      command: () => this.onDeleteTemplate(template),
    });

    return items;
  }

  protected onContextMenuSelectionChange(template: WorkflowTemplate | null): void {
    this.contextMenuSelectedTemplate = template;
    if (template) {
      this.currentContextMenuItems = this.buildContextMenuItems(template);
    }
  }

  constructor() {
    this.checkViewport();
    if (typeof window !== 'undefined') {
      this.resizeHandler = () => this.checkViewport();
      window.addEventListener('resize', this.resizeHandler);
    }

    effect(() => {
      if (this.isSearchOpen() && this.mobileSearchInput) {
        setTimeout(() => {
          this.mobileSearchInput?.nativeElement?.focus();
        }, this.SEARCH_FOCUS_DELAY);
      }
    });
  }

  ngOnInit(): void {
    this.route.data.pipe(takeUntil(this.destroy$)).subscribe((data) => {
      const listData = data['workflowTemplateList'];
      if (listData) {
        this.templates.set(listData.items);
        this.totalRecords.set(listData.total);
        this.isLoading.set(false);
      }
    });

    this.route.params.pipe(takeUntil(this.destroy$)).subscribe((params) => {
      const page = parseInt(params['page'], 10) || 1;
      const limit = parseInt(params['limit'], 10) || PAGE_SIZE_OPTIONS[0];
      const normalizedLimit = PAGE_SIZE_OPTIONS.includes(limit) ? limit : PAGE_SIZE_OPTIONS[0];
      const search = params['search'] || '';

      this.currentPage.set(page);
      this.pageSize.set(normalizedLimit);
      this.searchQuery.set(search === '-' ? '' : search);
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();

    if (typeof window !== 'undefined' && this.resizeHandler) {
      window.removeEventListener('resize', this.resizeHandler);
    }
  }

  protected onSearchChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const searchValue = input.value || '-';
    this.router.navigate(['../../..', searchValue, 1, this.pageSize()], {
      relativeTo: this.route,
    });
  }

  protected onPageChange(event: { page: number; pageSize: number }): void {
    const search = this.searchQuery() || '-';
    this.router.navigate(['../../..', search, event.page, event.pageSize], {
      relativeTo: this.route,
    });
  }

  protected onAddTemplate(): void {
    this.router.navigate(['../../..', 'new'], { relativeTo: this.route });
  }

  protected onViewTemplate(template: WorkflowTemplate): void {
    this.router.navigate(['../../..', template._id, 'view'], { relativeTo: this.route });
  }

  protected onEditTemplate(template: WorkflowTemplate): void {
    this.router.navigate(['../../..', template._id, 'edit'], { relativeTo: this.route });
  }

  protected onCloneTemplate(template: WorkflowTemplate): void {
    this.templateService
      .cloneTemplate(template._id, { name: `${template.name} (Copy)` })
      .subscribe({
        next: () => {
          this.messageService.add({
            severity: 'success',
            summary: this.translocoService.translate('workflowTemplate.messages.success'),
            detail: this.translocoService.translate('workflowTemplate.messages.cloneSuccess'),
          });
          this.onRefresh();
        },
        error: () => {
          this.messageService.add({
            severity: 'error',
            summary: this.translocoService.translate('workflowTemplate.messages.error'),
            detail: this.translocoService.translate('workflowTemplate.messages.cloneFailed'),
          });
        },
      });
  }

  protected onPublishTemplate(template: WorkflowTemplate): void {
    this.confirmationService.confirm({
      header: this.translocoService.translate('workflowTemplate.confirmPublish.header'),
      message: this.translocoService.translate('workflowTemplate.confirmPublish.message', {
        name: template.name,
      }),
      icon: 'pi pi-check-circle',
      acceptLabel: this.translocoService.translate('workflowTemplate.confirmPublish.accept'),
      rejectLabel: this.translocoService.translate('workflowTemplate.confirmPublish.reject'),
      accept: () => {
        this.templateService.publishTemplate(template._id).subscribe({
          next: () => {
            this.messageService.add({
              severity: 'success',
              summary: this.translocoService.translate('workflowTemplate.messages.success'),
              detail: this.translocoService.translate('workflowTemplate.messages.publishSuccess'),
            });
            this.onRefresh();
          },
          error: (error: any) => {
            this.messageService.add({
              severity: 'error',
              summary: this.translocoService.translate('workflowTemplate.messages.error'),
              detail:
                error?.error?.message ||
                this.translocoService.translate('workflowTemplate.messages.publishFailed'),
            });
          },
        });
      },
    });
  }

  protected onArchiveTemplate(template: WorkflowTemplate): void {
    this.templateService.archiveTemplate(template._id).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: this.translocoService.translate('workflowTemplate.messages.success'),
          detail: this.translocoService.translate('workflowTemplate.messages.archiveSuccess'),
        });
        this.onRefresh();
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: this.translocoService.translate('workflowTemplate.messages.error'),
          detail: this.translocoService.translate('workflowTemplate.messages.archiveFailed'),
        });
      },
    });
  }

  protected onDeleteTemplate(template: WorkflowTemplate): void {
    this.confirmationService.confirm({
      header: this.translocoService.translate('workflowTemplate.confirmDelete.header'),
      message: this.translocoService.translate('workflowTemplate.confirmDelete.message', {
        name: template.name,
      }),
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: this.translocoService.translate('workflowTemplate.confirmDelete.accept'),
      rejectLabel: this.translocoService.translate('workflowTemplate.confirmDelete.reject'),
      accept: () => {
        this.templateService.deleteTemplate(template._id).subscribe({
          next: () => {
            this.messageService.add({
              severity: 'success',
              summary: this.translocoService.translate('workflowTemplate.messages.success'),
              detail: this.translocoService.translate('workflowTemplate.messages.deleteSuccess', {
                name: template.name,
              }),
            });
            if (this.selectedTemplate()?._id === template._id) {
              this.selectedTemplate.set(null);
            }
            this.onRefresh();
          },
          error: () => {
            this.messageService.add({
              severity: 'error',
              summary: this.translocoService.translate('workflowTemplate.messages.error'),
              detail: this.translocoService.translate('workflowTemplate.messages.deleteFailed'),
            });
          },
        });
      },
    });
  }

  protected onBulkDelete(): void {
    const selected = this.selectedTemplates;
    if (selected.length === 0) return;

    this.confirmationService.confirm({
      header: this.translocoService.translate('workflowTemplate.confirmBulkDelete.header'),
      message: this.translocoService.translate('workflowTemplate.confirmBulkDelete.message', {
        count: selected.length,
      }),
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: this.translocoService.translate('workflowTemplate.confirmDelete.accept'),
      rejectLabel: this.translocoService.translate('workflowTemplate.confirmDelete.reject'),
      accept: () => {
        let completed = 0;
        let errors = 0;
        selected.forEach((t) => {
          this.templateService.deleteTemplate(t._id).subscribe({
            next: () => {
              completed++;
              if (completed + errors === selected.length) {
                this.messageService.add({
                  severity: errors > 0 ? 'warn' : 'success',
                  summary: this.translocoService.translate('workflowTemplate.messages.success'),
                  detail: this.translocoService.translate(
                    'workflowTemplate.messages.bulkDeleteSuccess',
                    { count: completed },
                  ),
                });
                this.selectedTemplates = [];
                this.onRefresh();
              }
            },
            error: () => {
              errors++;
              if (completed + errors === selected.length) {
                this.messageService.add({
                  severity: 'error',
                  summary: this.translocoService.translate('workflowTemplate.messages.error'),
                  detail: this.translocoService.translate(
                    'workflowTemplate.messages.bulkDeleteFailed',
                  ),
                });
                this.onRefresh();
              }
            },
          });
        });
      },
    });
  }

  protected onRowClick(template: WorkflowTemplate): void {
    this.selectedTemplate.set(template);
  }

  private checkViewport(): void {
    if (typeof window !== 'undefined') {
      this.isMobile.set(window.innerWidth < 768);
    }
  }

  protected toggleSearch(): void {
    this.isSearchOpen.set(!this.isSearchOpen());
  }

  protected closeSearch(): void {
    this.isSearchOpen.set(false);
    this.router.navigate(['../../..', '-', 1, this.pageSize()], {
      relativeTo: this.route,
    });
  }

  protected onRefresh(): void {
    this.isLoading.set(true);
    const params: QueryWorkflowTemplateParams = {
      page: this.currentPage(),
      limit: this.pageSize(),
      q: this.searchQuery() || undefined,
      sortField: this.sortField(),
      sortOrder: this.sortOrder() === 1 ? 'asc' : 'desc',
    };

    this.templateService.getTemplates(params).subscribe({
      next: (data) => {
        this.templates.set(data.items);
        this.totalRecords.set(data.total);
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
      },
    });
  }

  protected getRowMenuItems(template: WorkflowTemplate): MenuItem[] {
    return this.buildContextMenuItems(template);
  }

  protected onLazyLoad(event: TableLazyLoadEvent): void {
    const rows = event.rows && event.rows > 0 ? event.rows : PAGE_SIZE_OPTIONS[0];
    const page = event.first !== undefined ? Math.floor(event.first / rows) + 1 : 1;
    const search = this.searchQuery() || '-';

    if (event.sortField) {
      this.sortField.set(event.sortField as string);
      this.sortOrder.set(event.sortOrder || -1);
      this.onRefresh();
    }

    if (page !== this.currentPage() || rows !== this.pageSize()) {
      this.router.navigate(['../../..', search, page, rows], {
        relativeTo: this.route,
      });
    }
  }

  protected onShowRowMenu(event: MouseEvent, template: WorkflowTemplate, menu: Menu): void {
    event.stopPropagation();
    this.currentRowMenuItems = this.getRowMenuItems(template);
    menu.toggle(event);
  }

  protected getStatusSeverity(
    status: string,
  ): 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast' | undefined {
    switch (status) {
      case TemplateStatus.PUBLISHED:
        return 'success';
      case TemplateStatus.DRAFT:
        return 'warn';
      case TemplateStatus.ARCHIVED:
        return 'secondary';
      default:
        return 'info';
    }
  }
}
