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
import { Subject, takeUntil } from 'rxjs';

import { TableModule } from 'primeng/table';
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

import { MpToolbar } from '../../../../../../core/components/toolbar';
import { PaginationComponent } from '../../../../../../core/components/pagination/pagination';
import { UserDatePipe } from '../../../../../../core/pipes/user-date.pipe';
import {
  ImportExportService,
  ImportExportJob,
  EntityTemplate,
  ExportFormat,
  ExportMode,
  ImportMode,
  JobStatus,
  JobType,
  CreateExportJobDto,
} from '../../../../../../core/services/import-export/import-export.service';
import { PAGE_SIZE_OPTIONS } from '../../../../../../core/constants/ui.constants';

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
    MpToolbar,
    PaginationComponent,
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
  private readonly pollIntervals: ReturnType<typeof setInterval>[] = [];
  private readonly pollTimeouts: ReturnType<typeof setTimeout>[] = [];

  protected readonly PAGE_SIZE_OPTIONS = PAGE_SIZE_OPTIONS;
  protected readonly JobStatus = JobStatus;
  protected readonly JobType = JobType;

  protected readonly jobs = signal<ImportExportJob[]>([]);
  protected readonly isLoading = signal(false);
  protected readonly currentPage = signal(1);
  protected readonly pageSize = signal(20);
  protected readonly totalRecords = signal(0);

  protected readonly showExportDrawer = signal(false);
  protected readonly templates = signal<EntityTemplate[]>([]);
  protected readonly selectedEntity = signal<string>('');
  protected readonly selectedFormat = signal<ExportFormat>(ExportFormat.XLSX);
  protected readonly selectedExportMode = signal<ExportMode>(ExportMode.FLAT);
  protected readonly isExporting = signal(false);

  protected readonly showImportDrawer = signal(false);
  protected readonly importEntity = signal<string>('');
  protected readonly importMode = signal<ImportMode>(ImportMode.CREATE_ONLY);
  protected readonly selectedFile = signal<File | null>(null);
  protected readonly isImporting = signal(false);

  protected readonly totalPages = computed(() => Math.ceil(this.totalRecords() / this.pageSize()));

  protected readonly entityOptions = computed<SelectOption[]>(() =>
    this.templates().map((t) => ({ label: t.label, value: t.entity })),
  );

  protected readonly formatOptions: SelectOption[] = [
    { label: 'Excel (.xlsx)', value: ExportFormat.XLSX },
    { label: 'CSV (.csv)', value: ExportFormat.CSV },
  ];

  protected readonly exportModeOptions: SelectOption[] = [
    { label: 'Flat (single sheet)', value: ExportMode.FLAT },
    { label: 'Relational (multi-sheet)', value: ExportMode.RELATIONAL },
  ];

  protected readonly importModeOptions: SelectOption[] = [
    { label: 'Create Only', value: ImportMode.CREATE_ONLY },
    { label: 'Upsert', value: ImportMode.UPSERT },
    { label: 'Update Only', value: ImportMode.UPDATE_ONLY },
  ];

  ngOnInit(): void {
    this.route.params.pipe(takeUntil(this.destroy$)).subscribe((params) => {
      const page = parseInt(params['page'], 10) || 1;
      const limit = parseInt(params['limit'], 10) || 20;
      this.currentPage.set(page);
      this.pageSize.set(limit);
      this.loadJobs(page, limit);
    });

    this.loadTemplates();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.pollIntervals.forEach((id) => clearInterval(id));
    this.pollTimeouts.forEach((id) => clearTimeout(id));
  }

  private loadJobs(page: number, limit: number): void {
    this.isLoading.set(true);
    this.service.getJobs(page, limit).subscribe({
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

  protected onPageChange(event: { page: number; pageSize: number }): void {
    this.router.navigate(['../../..', '-', event.page, event.pageSize], { relativeTo: this.route });
  }

  protected openExportDrawer(): void {
    this.showExportDrawer.set(true);
  }

  protected closeExportDrawer(): void {
    this.showExportDrawer.set(false);
    this.selectedEntity.set('');
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
    const interval = setInterval(() => {
      this.service.getJob(jobId).subscribe({
        next: (job) => {
          if (job.status === JobStatus.COMPLETED || job.status === JobStatus.FAILED) {
            clearInterval(interval);
            this.loadJobs(this.currentPage(), this.pageSize());
            if (job.status === JobStatus.COMPLETED) {
              this.messageService.add({
                severity: 'success',
                summary: this.translocoService.translate('importExport.messages.jobCompleted'),
                detail: `${job.entity} ${job.type} completed`,
              });
            }
          }
        },
        error: () => clearInterval(interval),
      });
    }, 2000);
    this.pollIntervals.push(interval);
    const timeout = setTimeout(() => clearInterval(interval), 60000);
    this.pollTimeouts.push(timeout);
  }

  protected downloadExport(job: ImportExportJob): void {
    this.service.downloadExport(job._id).subscribe({
      next: (blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${job.entity}-export.${job.format || 'xlsx'}`;
        a.click();
        URL.revokeObjectURL(url);
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

  protected getStatusSeverity(status: JobStatus): string {
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
