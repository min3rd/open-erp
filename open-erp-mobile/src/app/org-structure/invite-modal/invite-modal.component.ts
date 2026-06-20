import { Component, OnInit, signal, inject, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormControl, Validators, ReactiveFormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { TranslocoModule, TranslocoService } from '@jsverse/transloco';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButtons,
  IonButton,
  IonIcon,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { close, checkmarkCircle } from 'ionicons/icons';
import {
  InputComponent,
  SelectComponent,
  ButtonComponent,
  ToastService,
} from '@open-erp/shared';
import { ModalController } from '@ionic/angular/standalone';

@Component({
  selector: 'app-invite-modal',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    TranslocoModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButtons,
    IonButton,
    IonIcon,
    InputComponent,
    SelectComponent,
    ButtonComponent,
  ],
  templateUrl: './invite-modal.component.html',
})
export class InviteModalComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly http = inject(HttpClient);
  private readonly translocoService = inject(TranslocoService);
  private readonly toastService = inject(ToastService);
  private readonly modalController = inject(ModalController);

  @Input() selectedDepartmentId: string | null = null;
  @Input() departments: any[] = [];
  @Input() roles: any[] = [];

  inviteForm!: FormGroup;
  isLoading = signal<boolean>(false);

  deptOptions: any[] = [];
  roleOptions: any[] = [];

  constructor() {
    addIcons({
      close,
      checkmarkCircle,
    });
  }

  ngOnInit(): void {
    this.inviteForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      firstName: ['', [Validators.required]],
      lastName: ['', [Validators.required]],
      departmentId: [this.selectedDepartmentId || ''],
      roleId: [''],
    });

    this.deptOptions = [
      { value: '', label: this.translocoService.translate('org.select_department') },
      ...this.departments.map(d => ({ value: d.id, label: d.name }))
    ];

    this.roleOptions = [
      { value: '', label: this.translocoService.translate('org.select_role') },
      ...this.roles.map(r => ({ value: r.id, label: r.name }))
    ];
  }

  getControl(name: string): FormControl {
    return this.inviteForm.get(name) as FormControl;
  }

  dismiss(data: any = null): void {
    this.modalController.dismiss(data);
  }

  submitInvite(): void {
    if (this.inviteForm.invalid) return;
    this.isLoading.set(true);
    const body = this.inviteForm.value;
    const cleanedBody = {
      email: body.email,
      firstName: body.firstName,
      lastName: body.lastName,
      departmentId: body.departmentId === '' ? null : body.departmentId,
      roleId: body.roleId === '' ? null : body.roleId,
    };

    this.http.post<any>('/api/v1/org/users/invite', cleanedBody).subscribe({
      next: (res) => {
        this.isLoading.set(false);
        if (res.success) {
          this.toastService.showSuccess(this.translocoService.translate('org.invite_sent_success'));
          this.dismiss({ success: true, inviteData: cleanedBody });
        } else {
          const errorMsg = this.translocoService.translate('validation.error_occurred');
          this.toastService.showError(errorMsg);
        }
      },
      error: (err) => {
        this.isLoading.set(false);
        const errorKey = err.error?.error?.messageKey || 'validation.error_occurred';
        this.toastService.showError(this.translocoService.translate(errorKey));
      }
    });
  }
}
