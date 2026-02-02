import {
  ChangeDetectionStrategy,
  Component,
  signal,
  inject,
  OnDestroy,
  OnInit,
  computed,
} from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  FormsModule,
  Validators,
  ValidationErrors,
  AbstractControl,
} from '@angular/forms';
import { TranslocoModule, TranslocoService } from '@jsverse/transloco';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { DatePickerModule } from 'primeng/datepicker';
import { AutoCompleteModule } from 'primeng/autocomplete';
import { ToolbarModule } from 'primeng/toolbar';
import { SelectButtonModule } from 'primeng/selectbutton';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { DialogModule } from 'primeng/dialog';
import { SkeletonModule } from 'primeng/skeleton';
import { TooltipModule } from 'primeng/tooltip';
import { SelectModule } from 'primeng/select';
import { TextareaModule } from 'primeng/textarea';
import { MessageService } from 'primeng/api';
import { debounceTime, distinctUntilChanged, Subject, takeUntil } from 'rxjs';
import {
  OrganizationService,
  CreateOrganizationDto,
  UpdateOrganizationDto,
  VietQRBusinessResponse,
  OrganizationResponse,
  OrganizationMember,
  OrganizationRelation,
  OrganizationEvent,
  InviteMemberDto,
  OrganizationType,
  OrganizationStatus,
} from '../../../../../core/services/organization-service';
import { CountryService, Country } from '../../../../../core/services/country-service';

interface BusinessRegistrationForm {
  taxId: FormControl<string>;
  name: FormControl<string>;
  internationalName: FormControl<string>;
  headquartersAddress: FormControl<string>;
  legalRepresentative: FormControl<string>;
  contactPhone: FormControl<string>;
  contactEmail: FormControl<string>;
  foundedDate: FormControl<Date | null>;
  businessActivities: FormControl<string[]>;
  type: FormControl<OrganizationType | null>;
  status: FormControl<OrganizationStatus>;
  country: FormControl<Country | null>;
  description: FormControl<string>;
  website: FormControl<string>;
}

interface InviteForm {
  email: FormControl<string>;
  role: FormControl<string>;
}

@Component({
  selector: 'organization-detail',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    TranslocoModule,
    CardModule,
    ButtonModule,
    InputTextModule,
    DatePickerModule,
    AutoCompleteModule,
    ToolbarModule,
    SelectButtonModule,
    TableModule,
    TagModule,
    DialogModule,
    SkeletonModule,
    TooltipModule,
    SelectModule,
    TextareaModule,
  ],
  templateUrl: './detail.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Detail implements OnInit, OnDestroy {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private organizationService = inject(OrganizationService);
  private countryService = inject(CountryService);
  private messageService = inject(MessageService);
  private translocoService = inject(TranslocoService);
  private destroy$ = new Subject<void>();

  protected readonly organizationId = signal<string | null>(null);
  protected readonly organization = signal<OrganizationResponse | null>(null);
  protected readonly members = signal<OrganizationMember[]>([]);
  protected readonly relations = signal<OrganizationRelation[]>([]);
  protected readonly events = signal<OrganizationEvent[]>([]);
  
  protected readonly isLoading = signal(false);
  protected readonly isSubmitting = signal(false);
  protected readonly isTaxLookupLoading = signal(false);
  protected readonly businessActivitySuggestions = signal<string[]>([]);
  protected readonly countrySuggestions = signal<Country[]>([]);
  protected readonly maxDate = new Date();

  protected readonly showEditDialog = signal(false);
  protected readonly showInviteDialog = signal(false);
  
  protected readonly membersPage = signal(1);
  protected readonly membersLimit = signal(10);
  protected readonly membersTotal = signal(0);

  protected readonly eventsPage = signal(1);
  protected readonly eventsLimit = signal(20);
  protected readonly eventsTotal = signal(0);

  protected readonly activeTab = signal<string>('overview');
  protected readonly tabOptions = [
    { label: 'Overview', value: 'overview' },
    { label: 'Members', value: 'members' },
    { label: 'Relations', value: 'relations' },
    { label: 'Activity', value: 'activity' },
  ];

  protected readonly isNewMode = computed(() => this.router.url.includes('/new'));
  protected readonly isViewMode = computed(() => !this.isNewMode() && this.organizationId() !== null);

  // Organization type options
  protected readonly organizationTypeOptions = [
    { label: 'Holding', value: 'holding' },
    { label: 'Company', value: 'company' },
    { label: 'Joint Venture', value: 'joint-venture' },
    { label: 'Partner', value: 'partner' },
    { label: 'Branch', value: 'branch' },
  ];

  // Common business activity suggestions for Vietnam
  private readonly defaultActivitySuggestions = [
    'Software Development',
    'IT Consulting',
    'Manufacturing',
    'Retail',
    'Wholesale',
    'Import/Export',
    'Construction',
    'Real Estate',
    'Finance',
    'Insurance',
    'Healthcare',
    'Education',
    'Transportation',
    'Logistics',
    'Hospitality',
    'Food & Beverage',
    'Agriculture',
    'Marketing',
    'Advertising',
    'E-commerce',
  ];

  protected readonly registrationForm = new FormGroup<BusinessRegistrationForm>({
    taxId: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.pattern(/^[0-9]{10,13}$/)],
    }),
    name: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(3)],
    }),
    internationalName: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(3)],
    }),
    headquartersAddress: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(10)],
    }),
    legalRepresentative: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(3)],
    }),
    contactPhone: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, this.phoneValidator],
    }),
    contactEmail: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.email],
    }),
    foundedDate: new FormControl<Date | null>(null, {
      validators: [Validators.required],
    }),
    businessActivities: new FormControl<string[]>([], {
      nonNullable: true,
    }),
    type: new FormControl<OrganizationType | null>(null, {
      validators: [Validators.required],
    }),
    status: new FormControl<OrganizationStatus>('active', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    country: new FormControl<Country | null>(null, {
      validators: [Validators.required],
    }),
    description: new FormControl('', {
      nonNullable: true,
    }),
    website: new FormControl('', {
      nonNullable: true,
      validators: [this.websiteValidator],
    }),
  });

  protected readonly inviteForm = new FormGroup<InviteForm>({
    email: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.email],
    }),
    role: new FormControl('member', {
      nonNullable: true,
      validators: [Validators.required],
    }),
  });

  constructor() {
    // Setup tax ID lookup with debounce
    this.registrationForm
      .get('taxId')
      ?.valueChanges.pipe(debounceTime(500), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe((taxId) => {
        if (taxId && taxId.length >= 10 && this.registrationForm.get('taxId')?.valid) {
          this.lookupTaxId(taxId);
        }
      });
  }

  ngOnInit(): void {
    // Get organization ID from route params
    this.route.params.pipe(takeUntil(this.destroy$)).subscribe((params) => {
      const id = params['id'];
      if (id && id !== 'new') {
        this.organizationId.set(id);
        this.loadOrganizationData(id);
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadOrganizationData(id: string): void {
    this.isLoading.set(true);
    
    // Load organization details
    this.organizationService.getOrganization(id).subscribe({
      next: (org) => {
        this.organization.set(org);
        this.populateEditForm(org);
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Failed to load organization:', error);
        this.messageService.add({
          severity: 'error',
          summary: this.translocoService.translate('organization.detail.notFound'),
          detail: error?.error?.message || 'Failed to load organization details',
        });
        this.isLoading.set(false);
        this.router.navigate(['/organization']);
      },
    });

    // Load members
    this.loadMembers(id);
    
    // Load relations
    this.organizationService.getOrganizationRelations(id).subscribe({
      next: (relations) => {
        this.relations.set(relations);
      },
      error: (error) => {
        console.error('Failed to load relations:', error);
      },
    });

    // Load events
    this.loadEvents(id);
  }

  private loadMembers(id: string): void {
    this.organizationService
      .getOrganizationMembers(id, this.membersPage(), this.membersLimit())
      .subscribe({
        next: (response) => {
          this.members.set(response.data);
          this.membersTotal.set(response.total);
        },
        error: (error) => {
          console.error('Failed to load members:', error);
        },
      });
  }

  private loadEvents(id: string): void {
    this.organizationService
      .getOrganizationEvents(id, this.eventsPage(), this.eventsLimit())
      .subscribe({
        next: (response) => {
          this.events.set(response.data);
          this.eventsTotal.set(response.total);
        },
        error: (error) => {
          console.error('Failed to load events:', error);
        },
      });
  }

  private populateEditForm(org: OrganizationResponse): void {
    this.countryService.getCountryByCode(org.country).subscribe((country) => {
      this.registrationForm.patchValue({
        taxId: org.taxId,
        name: org.name,
        internationalName: org.internationalName,
        headquartersAddress: org.headquartersAddress,
        legalRepresentative: org.legalRepresentative,
        contactPhone: org.contactPhone,
        contactEmail: org.contactEmail,
        foundedDate: org.foundedDate ? new Date(org.foundedDate) : null,
        businessActivities: org.businessActivities || [],
        type: org.type,
        status: org.status,
        country: country || null,
        description: org.description || '',
        website: org.website || '',
      });
    });
  }

  private phoneValidator(control: AbstractControl): ValidationErrors | null {
    const value = control.value;
    if (!value) {
      return null;
    }

    // Vietnamese phone number validation (10-11 digits, optionally with country code)
    const phoneRegex = /^(\+84|84|0)?([0-9]{9,10})$/;
    return phoneRegex.test(value) ? null : { invalidPhone: true };
  }

  private websiteValidator(control: AbstractControl): ValidationErrors | null {
    const value = control.value;
    if (!value || value.trim() === '') {
      return null;
    }

    // URL validation pattern (http or https)
    const urlRegex = /^https?:\/\/.+/i;
    return urlRegex.test(value) ? null : { invalidWebsite: true };
  }

  private lookupTaxId(taxId: string): void {
    this.isTaxLookupLoading.set(true);
    this.organizationService.lookupBusinessByTaxId(taxId).subscribe({
      next: (response: VietQRBusinessResponse | null) => {
        this.isTaxLookupLoading.set(false);
        if (response && response.data) {
          this.messageService.add({
            severity: 'success',
            summary: this.translocoService.translate('registerBusiness.taxLookup.found'),
            detail: this.translocoService.translate('registerBusiness.taxLookup.autoFilled', {
              name: response.data.name,
            }),
            life: 5000,
          });

          this.registrationForm.patchValue({
            name: response.data.name || '',
            internationalName: response.data.internationalName || '',
            headquartersAddress: response.data.address || '',
          });
        }
      },
      error: (error: any) => {
        this.isTaxLookupLoading.set(false);
        console.error('Tax lookup failed:', error);
        this.messageService.add({
          severity: 'warn',
          summary: this.translocoService.translate('registerBusiness.taxLookup.notFound'),
          detail: this.translocoService.translate('registerBusiness.taxLookup.manualEntry'),
          life: 4000,
        });
      },
    });
  }

  protected getFieldError(fieldName: keyof BusinessRegistrationForm): string | null {
    const control = this.registrationForm.get(fieldName);
    if (!control || !control.touched || !control.errors) {
      return null;
    }

    const errors = control.errors;
    const errorKeys: { [key: string]: string } = {
      required: 'registerBusiness.form.{{field}}.errors.required',
      email: 'registerBusiness.form.{{field}}.errors.email',
      minlength: 'registerBusiness.form.{{field}}.errors.minlength',
      pattern: 'registerBusiness.form.{{field}}.errors.pattern',
      invalidPhone: 'registerBusiness.form.{{field}}.errors.invalidPhone',
      invalidWebsite: 'registerBusiness.form.{{field}}.errors.invalidWebsite',
    };

    for (const [errorType, errorKey] of Object.entries(errorKeys)) {
      if (errors[errorType]) {
        return errorKey.replace('{{field}}', fieldName);
      }
    }

    return null;
  }

  protected onSearchBusinessActivity(event: any): void {
    const query = event.query?.toLowerCase() || '';
    if (query) {
      const filtered = this.defaultActivitySuggestions.filter((activity) =>
        activity.toLowerCase().includes(query)
      );
      this.businessActivitySuggestions.set(filtered);
    } else {
      this.businessActivitySuggestions.set(this.defaultActivitySuggestions);
    }
  }

  protected onSearchCountry(event: any): void {
    const query = event.query || '';
    this.countryService.searchCountries(query).subscribe((filtered) => {
      this.countrySuggestions.set(filtered);
    });
  }

  protected async onSubmit(): Promise<void> {
    if (this.registrationForm.invalid) {
      this.registrationForm.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);

    try {
      const formValue = this.registrationForm.value;

      const dto: CreateOrganizationDto = {
        taxId: formValue.taxId || '',
        name: formValue.name || '',
        internationalName: formValue.internationalName || '',
        headquartersAddress: formValue.headquartersAddress || '',
        legalRepresentative: formValue.legalRepresentative || '',
        contactPhone: formValue.contactPhone || '',
        contactEmail: formValue.contactEmail || '',
        foundedDate: formValue.foundedDate
          ? formValue.foundedDate.toISOString()
          : new Date().toISOString(),
        businessActivities: formValue.businessActivities || [],
        type: formValue.type || 'company',
        status: formValue.status || 'active',
        country: formValue.country?.code || '',
        description: formValue.description || undefined,
        website: formValue.website || undefined,
      };

      this.organizationService.createOrganization(dto).subscribe({
        next: (response: any) => {
          this.messageService.add({
            severity: 'success',
            summary: this.translocoService.translate('registerBusiness.messages.success'),
            detail: this.translocoService.translate('registerBusiness.messages.successDetail'),
          });
          this.router.navigate(['/organization', response.id]);
        },
        error: (error: any) => {
          console.error('Organization registration failed:', error);
          this.messageService.add({
            severity: 'error',
            summary: this.translocoService.translate('registerBusiness.messages.error'),
            detail:
              error?.error?.message ||
              this.translocoService.translate('registerBusiness.messages.errorDetail'),
          });
          this.isSubmitting.set(false);
        },
      });
    } catch (error) {
      console.error('Registration failed:', error);
      this.messageService.add({
        severity: 'error',
        summary: this.translocoService.translate('registerBusiness.messages.error'),
        detail: this.translocoService.translate('registerBusiness.messages.errorDetail'),
      });
      this.isSubmitting.set(false);
    }
  }

  protected onOpenEditDialog(): void {
    if (this.organization()) {
      this.populateEditForm(this.organization()!);
      this.showEditDialog.set(true);
    }
  }

  protected onCloseEditDialog(): void {
    this.showEditDialog.set(false);
  }

  protected async onSaveEdit(): Promise<void> {
    if (this.registrationForm.invalid || !this.organizationId()) {
      this.registrationForm.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);

    try {
      const formValue = this.registrationForm.value;

      const dto: UpdateOrganizationDto = {
        taxId: formValue.taxId || undefined,
        name: formValue.name || undefined,
        internationalName: formValue.internationalName || undefined,
        headquartersAddress: formValue.headquartersAddress || undefined,
        legalRepresentative: formValue.legalRepresentative || undefined,
        contactPhone: formValue.contactPhone || undefined,
        contactEmail: formValue.contactEmail || undefined,
        foundedDate: formValue.foundedDate ? formValue.foundedDate.toISOString() : undefined,
        businessActivities: formValue.businessActivities || undefined,
        type: formValue.type || undefined,
        status: formValue.status || undefined,
        country: formValue.country?.code || undefined,
        description: formValue.description || undefined,
        website: formValue.website || undefined,
      };

      this.organizationService.updateOrganization(this.organizationId()!, dto).subscribe({
        next: (response) => {
          this.organization.set(response);
          this.messageService.add({
            severity: 'success',
            summary: this.translocoService.translate('organization.detail.edit.success'),
          });
          this.showEditDialog.set(false);
          this.isSubmitting.set(false);
        },
        error: (error: any) => {
          console.error('Organization update failed:', error);
          this.messageService.add({
            severity: 'error',
            summary: this.translocoService.translate('organization.detail.edit.error'),
            detail: error?.error?.message || 'Failed to update organization',
          });
          this.isSubmitting.set(false);
        },
      });
    } catch (error) {
      console.error('Update failed:', error);
      this.messageService.add({
        severity: 'error',
        summary: this.translocoService.translate('organization.detail.edit.error'),
      });
      this.isSubmitting.set(false);
    }
  }

  protected onOpenInviteDialog(): void {
    this.inviteForm.reset({ email: '', role: 'member' });
    this.showInviteDialog.set(true);
  }

  protected onCloseInviteDialog(): void {
    this.showInviteDialog.set(false);
  }

  protected async onSendInvite(): Promise<void> {
    if (this.inviteForm.invalid || !this.organizationId()) {
      this.inviteForm.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);

    try {
      const formValue = this.inviteForm.value;

      const dto: InviteMemberDto = {
        email: formValue.email || '',
        role: formValue.role || 'member',
      };

      this.organizationService.inviteMember(this.organizationId()!, dto).subscribe({
        next: () => {
          this.messageService.add({
            severity: 'success',
            summary: this.translocoService.translate('organization.detail.members.invite.success'),
          });
          this.showInviteDialog.set(false);
          this.isSubmitting.set(false);
          // Reload members
          this.loadMembers(this.organizationId()!);
        },
        error: (error: any) => {
          console.error('Invite failed:', error);
          this.messageService.add({
            severity: 'error',
            summary: this.translocoService.translate('organization.detail.members.invite.error'),
            detail: error?.error?.message || 'Failed to send invitation',
          });
          this.isSubmitting.set(false);
        },
      });
    } catch (error) {
      console.error('Invite failed:', error);
      this.messageService.add({
        severity: 'error',
        summary: this.translocoService.translate('organization.detail.members.invite.error'),
      });
      this.isSubmitting.set(false);
    }
  }

  protected onRemoveMember(memberId: string): void {
    if (!this.organizationId()) return;

    this.organizationService.removeMember(this.organizationId()!, memberId).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Member removed successfully',
        });
        this.loadMembers(this.organizationId()!);
      },
      error: (error: any) => {
        console.error('Remove member failed:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Failed to remove member',
          detail: error?.error?.message || 'An error occurred',
        });
      },
    });
  }

  protected onNewSubsidiary(): void {
    this.router.navigate(['/organization/new'], {
      queryParams: { parentId: this.organizationId() },
    });
  }

  protected onViewRelatedOrg(orgId: string): void {
    this.router.navigate(['/organization', orgId]);
  }

  protected async copyToClipboard(text: string): Promise<void> {
    try {
      await navigator.clipboard.writeText(text);
      this.messageService.add({
        severity: 'success',
        summary: this.translocoService.translate('organization.detail.info.copied'),
        life: 2000,
      });
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  }

  protected getMemberStatusSeverity(status: string): 'success' | 'warn' | 'secondary' {
    switch (status) {
      case 'active':
        return 'success';
      case 'pending':
        return 'warn';
      default:
        return 'secondary';
    }
  }

  protected onTabChange(index: number): void {
    this.activeTab.set(this.tabOptions[index].value);
  }

  protected formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString();
  }
}
