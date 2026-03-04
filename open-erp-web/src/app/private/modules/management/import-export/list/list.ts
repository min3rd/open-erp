import {
  ChangeDetectionStrategy,
  Component,
  signal,
  computed,
  inject,
  OnInit,
  OnDestroy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TranslocoModule, TranslocoService } from '@jsverse/transloco';
import { Subject, takeUntil, interval, switchMap, takeWhile, filter, combineLatest } from 'rxjs';

import { TableModule, TablePageEvent } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { DrawerModule } from 'primeng/drawer';
import { SelectModule } from 'primeng/select';
import { InputTextModule } from 'primeng/inputtext';
import { FileUploadModule } from 'primeng/fileupload';
import { ProgressBarModule } from 'primeng/progressbar';
import { TooltipModule } from 'primeng/tooltip';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';

import { MpToolbar } from '../../../../../../core/components/toolbar';
import { UserDatePipe } from '../../../../../../core/pipes/user-date.pipe';
import {
  ImportExportService,
  ImportExportJob,
  EntityTemplate,
  ExportFormat,
  ExportMode,
  ExportScope,
  ImportMode,
  JobStatus,
  JobType,
  CreateExportJobDto,
} from '../../../../../../core/services/import-export/import-export.service';

interface SelectOption {
  label: string;
  value: string;
}

@Component({
  selector: 'management-import-export-list',
  imports: [
    CommonModule,
    FormsModule,
    TranslocoModule,
    TableModule,
    ButtonModule,
    TagModule,
    DrawerModule,
    SelectModule,
    InputTextModule,
    FileUploadModule,
    ProgressBarModule,
    TooltipModule,
    ToastModule,
    IconFieldModule,
    InputIconModule,
    MpToolbar,
    UserDatePipe,
  ],
  providers: [MessageService],
  templateUrl: './list.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ImportExportList implements OnInit, OnDestroy {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly service = inject(ImportExportService);
  private readonly messageService = inject(MessageService);
  private readonly translocoService = inject(TranslocoService);
  private readonly destroy$ = new Subject<void>();

  protected readonly JobStatus = JobStatus;
  protected readonly JobType = JobType;

  // Table state
  protected readonly jobs = signal<ImportExportJob[]>([]);
  protected readonly isLoading = signal(false);
  protected readonly currentPage = signal(1);
  protected readonly pageSize = signal(20);
  protected readonly totalRecords = signal(0);

  // Filter state (synced with URL query params)
  protected readonly searchQuery = signal('');
  protected readonly filterType = signal<string>('');
  protected readonly filterStatus = signal<string>('');

  // Export drawer
  protected readonly showExportDrawer = signal(false);
  protected readonly templates = signal<EntityTemplate[]>([]);
  protected readonly selectedEntity = signal<string>('');
  protected readonly selectedFormat = signal<ExportFormat>(ExportFormat.XLSX);
  protected readonly selectedExportMode = signal<ExportMode>(ExportMode.FLAT);
  protected readonly selectedScope = signal<ExportScope>(ExportScope.GLOBAL);
  protected readonly exportOrgId = signal<string>('');
  protected readonly isExporting = signal(false);

  // Import drawer
  protected readonly showImportDrawer = signal(false);
  protected readonly importEntity = signal<string>('');
  protected readonly importMode = signal<ImportMode>(ImportMode.CREATE_ONLY);
  protected readonly selectedFile = signal<File | null>(null);
  protected readonly isImporting = signal(false);

  protected readonly entityOptions = computed<SelectOption[]>(() =>
    this.templates().map((t) => ({ label: t.label, value: t.entity })),
  );

  protected readonly typeFilterOptions: SelectOption[] = [
    { label: 'All', value: '' },
    { label: 'Export', value: JobType.EXPORT },
    { label: 'Import', value: JobType.IMPORT },
  ];

  protected readonly statusFilterOptions: SelectOption[] = [
    { label: 'All', value: '' },
    { label: 'Pending', value: JobStatus.PENDING },
    { label: 'Processing', value: JobStatus.PROCESSING },
    { label: 'Completed', value: JobStatus.COMPLETED },
    { label: 'Failed', value: JobStatus.FAILED },
  ];

  protected readonly formatOptions: SelectOption[] = [
    { label: 'Excel (.xlsx)', value: ExportFormat.XLSX },
    { label: 'CSV (.csv)', value: ExportFormat.CSV },
  ];

  protected readonly exportModeOptions: SelectOption[] = [
    { label: 'Flat (single sheet)', value: ExportMode.FLAT },
    { label: 'Relational (multi-sheet)', value: ExportMode.RELATIONAL },
  ];

  protected readonly scopeOptions: SelectOption[] = [
    { label: 'Global (all data)', value: ExportScope.GLOBAL },
    { label: 'Organization (current org)', value: ExportScope.ORG },
  ];

  protected readonly importModeOptions: SelectOption[] = [
    { label: 'Create Only', value: ImportMode.CREATE_ONLY },
    { label: 'Upsert', value: ImportMode.UPSERT },
    { label: 'Update Only', value: ImportMode.UPDATE_ONLY },
  ];

  ngOnInit(): void {
    combineLatest([this.route.params, this.route.queryParams])
      .pipe(takeUntil(this.destroy$))
      .subscribe(([params, queryParams]) => {
        const page = parseInt(params['page'], 10) || 1;
        const limit = parseInt(params['limit'], 10) || 20;
        const search = params['search'] === '-' ? '' : (params['search'] || '');

        this.currentPage.set(page);
        this.pageSize.set(limit);
        this.searchQuery.set(search);

        // Restore filters from query params
        if (queryParams['type']) this.filterType.set(queryParams['type']);
        if (queryParams['status']) this.filterStatus.set(queryParams['status']);

        this.loadJobs(page, limit);
      });
    this.loadTemplates();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadJobs(page: number, limit: number): void {
    this.isLoading.set(true);
    this.service
      .getJobs(page, limit, {
        q: this.searchQuery() || undefined,
        type: this.filterType() || undefined,
        status: this.filterStatus() || undefined,
      })
      .subscribe({
        next: (data) => {
          this.jobs.set(data.items || []);
          this.totalRecords.set(data.total || 0);
          this.isLoading.set(false);
        },
        error: () => this.isLoading.set(false),
      });
  }

  private loadTemplates(): void {
    this.service.getTemplates().subscribe({
      next: (templates) => this.templates.set(templates),
      error: () => {},
    });
  }

  private buildQueryParams(): Record<string, string> {
    const qp: Record<string, string> = {};
    if (this.filterType()) qp['type'] = this.filterType();
    if (this.filterStatus()) qp['status'] = this.filterStatus();
    return qp;
  }

  private navigateWithState(page: number, limit?: number): void {
    const search = this.searchQuery() || '-';
    const ps = limit ?? this.pageSize();
    this.router.navigate(['../../..', search, page, ps], {
      relativeTo: this.route,
      queryParams: this.buildQueryParams(),
    });
  }

  protected onPage(event: TablePageEvent): void {
    const page = Math.floor((event.first ?? 0) / (event.rows ?? 20)) + 1;
    const limit = event.rows ?? 20;
    this.navigateWithState(page, limit);
  }

  protected onSearchKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Enter') this.applyFilters();
  }

  protected applyFilters(): void {
    this.navigateWithState(1);
  }

  protected openExportDrawer(): void {
    this.showExportDrawer.set(true);
  }

  protected closeExportDrawer(): void {
    this.showExportDrawer.set(false);
    this.selectedEntity.set('');
    this.selectedScope.set(ExportScope.GLOBAL);
    this.exportOrgId.set('');
  }

  protected openImportDrawer(): void {
    this.showImportDrawer.set(true);
  }

  protected closeImportDrawer(): void {
    this.showImportDrawer.set(false);
    this.importEntity.set('');
    this.selectedFile.set(null);
  }

  protected startExport(): void {
    if (!this.selectedEntity()) return;

    this.isExporting.set(true);
    const dto: CreateExportJobDto = {
      entity: this.selectedEntity(),
      format: this.selectedFormat(),
      exportMode: this.selectedExportMode(),
      scope: this.selectedScope(),
      orgId: this.selectedScope() === ExportScope.ORG ? this.exportOrgId() : undefined,
    };

    this.service.createExportJob(dto).subscribe({
      next: (job) => {
        this.isExporting.set(false);
        this.closeExportDrawer();
        this.messageService.add({
          severity: 'success',
          summary: this.translocoService.translate('importExport.messages.exportStarted'),
          detail: this.translocoService.translate('importExport.messages.exportStartedDetail'),
        });
        this.loadJobs(this.currentPage(), this.pageSize());
        this.pollJobStatus(job._id);
      },
      error: () => {
        this.isExporting.set(false);
        this.messageService.add({
          severity: 'error',
          summary: this.translocoService.translate('importExport.messages.error'),
          detail: this.translocoService.translate('importExport.messages.exportFailed'),
        });
      },
    });
  }

  protected onFileSelect(event: any): void {
    const file = event.files?.[0] || event.target?.files?.[0];
    if (file) this.selectedFile.set(file);
  }

  protected startImport(): void {
    const file = this.selectedFile();
    if (!file || !this.importEntity()) return;

    this.isImporting.set(true);
    this.service.createImportJob({ entity: this.importEntity(), importMode: this.importMode() }, file).subscribe({
      next: (job) => {
        this.isImporting.set(false);
        this.closeImportDrawer();
        this.messageService.add({
          severity: 'success',
          summary: this.translocoService.translate('importExport.messages.importStarted'),
          detail: this.translocoService.translate('importExport.messages.importStartedDetail'),
        });
        this.loadJobs(this.currentPage(), this.pageSize());
        this.pollJobStatus(job._id);
      },
      error: () => {
        this.isImporting.set(false);
        this.messageService.add({
          severity: 'error',
          summary: this.translocoService.translate('importExport.messages.error'),
          detail: this.translocoService.translate('importExport.messages.importFailed'),
        });
      },
    });
  }

  private pollJobStatus(jobId: string): void {
    interval(2000)
      .pipe(
        takeUntil(this.destroy$),
        switchMap(() => this.service.getJob(jobId)),
        takeWhile((job) => job.status !== JobStatus.COMPLETED && job.status !== JobStatus.FAILED, true),
        filter((job) => job.status === JobStatus.COMPLETED || job.status === JobStatus.FAILED),
      )
      .subscribe((job) => {
        this.loadJobs(this.currentPage(), this.pageSize());
        if (job.status === JobStatus.COMPLETED) {
          this.messageService.add({
            severity: 'success',
            summary: this.translocoService.translate('importExport.messages.jobCompleted'),
            detail: `${job.entity} ${job.type} completed`,
          });
        }
      });
  }

  protected downloadExport(job: ImportExportJob): void {
    // Get presigned URL from our backend, then open it directly in the browser
    // so the app's auth interceptor does NOT add headers to the MinIO request
    this.service.getExportDownloadUrl(job._id).subscribe({
      next: (url) => {
        const a = document.createElement('a');
        a.href = url;
        a.download = `${job.entity}-export.${job.format || 'xlsx'}`;
        a.rel = 'noopener noreferrer';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: this.translocoService.translate('importExport.messages.error'),
          detail: this.translocoService.translate('importExport.messages.downloadFailed'),
        });
      },
    });
  }

  protected downloadErrors(job: ImportExportJob): void {
    this.service.downloadErrors(job._id).subscribe({
      next: (blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `import-errors-${job._id}.csv`;
        a.click();
        URL.revokeObjectURL(url);
      },
    });
  }

  protected getStatusSeverity(status: JobStatus): 'success' | 'info' | 'warn' | 'danger' | 'secondary' {
    switch (status) {
      case JobStatus.COMPLETED: return 'success';
      case JobStatus.FAILED: return 'danger';
      case JobStatus.PROCESSING: return 'info';
      case JobStatus.PENDING: return 'warn';
      default: return 'secondary';
    }
  }

  protected refreshJobs(): void {
    this.loadJobs(this.currentPage(), this.pageSize());
  }
}
