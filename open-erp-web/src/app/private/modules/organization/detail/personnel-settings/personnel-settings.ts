import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
  output,
  signal,
  computed,
  OnInit,
  OnDestroy,
  effect,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormControl, FormGroup, Validators } from '@angular/forms';
import { TranslocoModule, TranslocoService } from '@jsverse/transloco';
import { Subject, takeUntil } from 'rxjs';
import { ButtonModule } from 'primeng/button';
import { DrawerModule } from 'primeng/drawer';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { TabsModule } from 'primeng/tabs';
import { MultiSelectModule } from 'primeng/multiselect';
import { DialogModule } from 'primeng/dialog';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService, MessageService } from 'primeng/api';
import {
  OrganizationService,
  OrganizationMember,
  OrgDepartment,
  OrgPosition,
} from '../../../../../../core/services/organization-service';

@Component({
  selector: 'personnel-settings',
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    TranslocoModule,
    ButtonModule,
    DrawerModule,
    InputTextModule,
    TextareaModule,
    TableModule,
    TagModule,
    TooltipModule,
    TabsModule,
    MultiSelectModule,
    DialogModule,
    ConfirmDialogModule,
  ],
  providers: [ConfirmationService],
  templateUrl: './personnel-settings.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PersonnelSettings implements OnInit, OnDestroy {
  readonly orgId = input.required<string>();
  readonly visible = input.required<boolean>();
  readonly selectedMember = input<OrganizationMember | null>(null);
  readonly visibleChange = output<boolean>();
  readonly saved = output<void>();

  private orgService = inject(OrganizationService);
  private messageService = inject(MessageService);
  private confirmationService = inject(ConfirmationService);
  private translocoService = inject(TranslocoService);
  private destroy$ = new Subject<void>();

  protected readonly departments = signal<OrgDepartment[]>([]);
  protected readonly positions = signal<OrgPosition[]>([]);
  protected readonly isLoadingDepts = signal(false);
  protected readonly isLoadingPositions = signal(false);
  protected readonly isSubmitting = signal(false);

  // Department form
  protected readonly showDeptDialog = signal(false);
  protected readonly editingDept = signal<OrgDepartment | null>(null);
  protected readonly deptForm = new FormGroup({
    name: new FormControl('', [Validators.required, Validators.minLength(2)]),
    code: new FormControl('', [Validators.required, Validators.pattern(/^[a-z0-9-]+$/)]),
    description: new FormControl(''),
  });

  // Position form
  protected readonly showPositionDialog = signal(false);
  protected readonly editingPosition = signal<OrgPosition | null>(null);
  protected readonly positionForm = new FormGroup({
    name: new FormControl('', [Validators.required, Validators.minLength(2)]),
    code: new FormControl('', [Validators.required, Validators.pattern(/^[a-z0-9-]+$/)]),
    description: new FormControl(''),
    level: new FormControl<number>(0),
  });

  // Assignment state (for selected member)
  protected readonly selectedDeptIds = signal<string[]>([]);
  protected readonly selectedPositionIds = signal<string[]>([]);

  protected readonly activeTab = signal<number>(0);

  protected readonly departmentOptions = computed(() =>
    this.departments().map((d) => ({ label: d.name, value: d.id })),
  );

  protected readonly positionOptions = computed(() =>
    this.positions().map((p) => ({ label: p.name, value: p.id })),
  );

  constructor() {
    // Sync selection state when the selected member changes
    effect(() => {
      const member = this.selectedMember();
      this.selectedDeptIds.set(member?.departments?.map((d) => d.id) ?? []);
      this.selectedPositionIds.set(member?.positions?.map((p) => p.id) ?? []);
    });
  }

  ngOnInit(): void {
    this.loadDepartments();
    this.loadPositions();
  }

  private loadDepartments(): void {
    this.isLoadingDepts.set(true);
    this.orgService
      .getDepartments(this.orgId())
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (depts) => {
          this.departments.set(depts);
          this.isLoadingDepts.set(false);
        },
        error: () => this.isLoadingDepts.set(false),
      });
  }

  private loadPositions(): void {
    this.isLoadingPositions.set(true);
    this.orgService
      .getPositions(this.orgId())
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (positions) => {
          this.positions.set(positions);
          this.isLoadingPositions.set(false);
        },
        error: () => this.isLoadingPositions.set(false),
      });
  }

  protected onVisibleChange(v: boolean): void {
    this.visibleChange.emit(v);
  }

  // ── Departments ───────────────────────────────────────────────────────────

  protected onAddDepartment(): void {
    this.editingDept.set(null);
    this.deptForm.reset({ name: '', code: '', description: '' });
    this.showDeptDialog.set(true);
  }

  protected onEditDepartment(dept: OrgDepartment): void {
    this.editingDept.set(dept);
    this.deptForm.setValue({
      name: dept.name,
      code: dept.code,
      description: dept.description ?? '',
    });
    this.showDeptDialog.set(true);
  }

  protected onDeleteDepartment(dept: OrgDepartment): void {
    this.confirmationService.confirm({
      message: this.translocoService.translate('personnel.confirmDeleteDepartment', { name: dept.name }),
      accept: () => {
        this.orgService
          .deleteDepartment(this.orgId(), dept.id)
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: () => {
              this.messageService.add({
                severity: 'success',
                summary: this.translocoService.translate('personnel.departmentDeleted'),
              });
              this.loadDepartments();
            },
            error: (err) => {
              this.messageService.add({
                severity: 'error',
                summary: this.translocoService.translate('personnel.error'),
                detail: err?.error?.message ?? 'Failed to delete department',
              });
            },
          });
      },
    });
  }

  protected onSaveDepartment(): void {
    if (this.deptForm.invalid) {
      this.deptForm.markAllAsTouched();
      return;
    }
    this.isSubmitting.set(true);
    const val = this.deptForm.value as { name: string; code: string; description: string };
    const editing = this.editingDept();
    const obs$ = editing
      ? this.orgService.updateDepartment(this.orgId(), editing.id, val)
      : this.orgService.createDepartment(this.orgId(), val);

    obs$.pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.showDeptDialog.set(false);
        this.messageService.add({
          severity: 'success',
          summary: editing
            ? this.translocoService.translate('personnel.departmentUpdated')
            : this.translocoService.translate('personnel.departmentCreated'),
        });
        this.loadDepartments();
      },
      error: (err) => {
        this.isSubmitting.set(false);
        this.messageService.add({
          severity: 'error',
          summary: this.translocoService.translate('personnel.error'),
          detail: err?.error?.message ?? 'Failed to save department',
        });
      },
    });
  }

  // ── Positions ─────────────────────────────────────────────────────────────

  protected onAddPosition(): void {
    this.editingPosition.set(null);
    this.positionForm.reset({ name: '', code: '', description: '', level: 0 });
    this.showPositionDialog.set(true);
  }

  protected onEditPosition(pos: OrgPosition): void {
    this.editingPosition.set(pos);
    this.positionForm.setValue({
      name: pos.name,
      code: pos.code,
      description: pos.description ?? '',
      level: pos.level ?? 0,
    });
    this.showPositionDialog.set(true);
  }

  protected onDeletePosition(pos: OrgPosition): void {
    this.confirmationService.confirm({
      message: this.translocoService.translate('personnel.confirmDeletePosition', { name: pos.name }),
      accept: () => {
        this.orgService
          .deletePosition(this.orgId(), pos.id)
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: () => {
              this.messageService.add({
                severity: 'success',
                summary: this.translocoService.translate('personnel.positionDeleted'),
              });
              this.loadPositions();
            },
            error: (err) => {
              this.messageService.add({
                severity: 'error',
                summary: this.translocoService.translate('personnel.error'),
                detail: err?.error?.message ?? 'Failed to delete position',
              });
            },
          });
      },
    });
  }

  protected onSavePosition(): void {
    if (this.positionForm.invalid) {
      this.positionForm.markAllAsTouched();
      return;
    }
    this.isSubmitting.set(true);
    const val = this.positionForm.value as { name: string; code: string; description: string; level: number };
    const editing = this.editingPosition();
    const obs$ = editing
      ? this.orgService.updatePosition(this.orgId(), editing.id, val)
      : this.orgService.createPosition(this.orgId(), val);

    obs$.pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.showPositionDialog.set(false);
        this.messageService.add({
          severity: 'success',
          summary: editing
            ? this.translocoService.translate('personnel.positionUpdated')
            : this.translocoService.translate('personnel.positionCreated'),
        });
        this.loadPositions();
      },
      error: (err) => {
        this.isSubmitting.set(false);
        this.messageService.add({
          severity: 'error',
          summary: this.translocoService.translate('personnel.error'),
          detail: err?.error?.message ?? 'Failed to save position',
        });
      },
    });
  }

  // ── Assignment ────────────────────────────────────────────────────────────

  protected onSaveAssignment(): void {
    const member = this.selectedMember();
    if (!member) return;

    this.isSubmitting.set(true);
    this.orgService
      .assignMember(this.orgId(), member.id, {
        departments: this.selectedDeptIds(),
        positions: this.selectedPositionIds(),
      })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.isSubmitting.set(false);
          this.messageService.add({
            severity: 'success',
            summary: this.translocoService.translate('personnel.assignmentSaved'),
          });
          this.saved.emit();
        },
        error: (err) => {
          this.isSubmitting.set(false);
          this.messageService.add({
            severity: 'error',
            summary: this.translocoService.translate('personnel.error'),
            detail: err?.error?.message ?? 'Failed to save assignment',
          });
        },
      });
  }

  protected getDeptFieldError(field: 'name' | 'code'): string | null {
    const ctrl = this.deptForm.get(field);
    if (!ctrl?.invalid || !ctrl.touched) return null;
    if (ctrl.hasError('required')) return 'validation.required';
    if (ctrl.hasError('minlength')) return 'validation.minLength';
    if (ctrl.hasError('pattern')) return 'validation.pattern';
    return null;
  }

  protected getPosFieldError(field: 'name' | 'code'): string | null {
    const ctrl = this.positionForm.get(field);
    if (!ctrl?.invalid || !ctrl.touched) return null;
    if (ctrl.hasError('required')) return 'validation.required';
    if (ctrl.hasError('minlength')) return 'validation.minLength';
    if (ctrl.hasError('pattern')) return 'validation.pattern';
    return null;
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
