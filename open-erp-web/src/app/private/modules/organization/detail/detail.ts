import {
  ChangeDetectionStrategy,
  Component,
  signal,
  inject,
  OnDestroy,
  computed,
  effect,
} from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
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
import { MpToolbar } from '../../../../../core/components/toolbar';
import { SelectButtonModule } from 'primeng/selectbutton';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { DialogModule } from 'primeng/dialog';
import { DrawerModule } from 'primeng/drawer';
import { SkeletonModule } from 'primeng/skeleton';
import { TooltipModule } from 'primeng/tooltip';
import { SelectModule } from 'primeng/select';
import { TextareaModule } from 'primeng/textarea';
import { DividerModule } from 'primeng/divider';
import { MessageService } from 'primeng/api';
import { debounceTime, distinctUntilChanged, Subject, takeUntil } from 'rxjs';
import {
  OrganizationService,
  CreateOrganizationDto,
  UpdateOrganizationDto,
  VietQRBusinessResponse,
  OrganizationResponse,
  InviteMemberDto,
  OrganizationType,
  OrganizationStatus,
  BulkInviteMembersDto,
  BulkInviteResponse,
  InvitationResult,
} from '../../../../../core/services/organization-service';
import { CountryService, Country } from '../../../../../core/services/country-service';
import { UserService, User } from '../../../../../core/services/user-service';
import { OrganizationContextService } from '../../../../../core/services/organization-context.service';
import { UserDatePipe } from '../../../../../core/pipes/user-date.pipe';

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
    RouterLink,
    RouterLinkActive,
    CardModule,
    ButtonModule,
    InputTextModule,
    DatePickerModule,
    AutoCompleteModule,
    MpToolbar,
    SelectButtonModule,
    TableModule,
    TagModule,
    DialogModule,
    DrawerModule,
    SkeletonModule,
    TooltipModule,
    SelectModule,
    TextareaModule,
    DividerModule,
    RouterOutlet,
    UserDatePipe,
  ],
  providers: [],
  templateUrl: './detail.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Detail implements OnDestroy {
  private router = inject(Router);
  private organizationService = inject(OrganizationService);
  private countryService = inject(CountryService);
  private userService = inject(UserService);
  private messageService = inject(MessageService);
  private translocoService = inject(TranslocoService);
  private destroy$ = new Subject<void>();
  private inviteSearchSubject$ = new Subject<string>();
  private organizatonContextService = inject(OrganizationContextService);

  protected readonly organizationId = signal<string | null>(null);
  protected readonly organization = signal<OrganizationResponse | null>(null);
  protected readonly isLoading = signal(false);
  protected readonly isSubmitting = signal(false);
  protected readonly isTaxLookupLoading = signal(false);
  protected readonly businessActivitySuggestions = signal<string[]>([]);
  protected readonly countrySuggestions = signal<Country[]>([]);
  protected readonly maxDate = new Date();

  protected readonly showEditDialog = signal(false);
  protected readonly showInviteDialog = signal(false);

  // Invite drawer state
  protected readonly showInviteDrawer = signal(false);
  protected readonly inviteSearchQuery = signal('');
  protected readonly inviteSearchResults = signal<User[]>([]);
  protected readonly isInviteSearching = signal(false);
  protected readonly inviteSelectedUsers = signal<User[]>([]);
  protected readonly inviteManualEmails = signal<string[]>([]);
  protected readonly inviteExpiryDate = signal<Date | null>(null);
  protected readonly inviteMessage = signal('');
  protected readonly inviteSendResults = signal<InvitationResult[] | null>(null);
  protected readonly isInviteSending = signal(false);
  protected readonly inviteMinDate = new Date();

  protected readonly tabOptions = [
    { label: 'General', value: 'general' },
    { label: 'Members', value: 'members' },
    { label: 'Invites', value: 'invites' },
    { label: 'Relations', value: 'relations' },
    { label: 'Activity', value: 'activity' },
  ];

  protected readonly isNewMode = computed(() => this.router.url.includes('/new'));
  protected readonly isViewMode = computed(
    () => !this.isNewMode() && this.organizationId() !== null,
  );

  protected readonly inviteRecipientCount = computed(
    () => this.inviteSelectedUsers().length + this.inviteManualEmails().length,
  );
  protected readonly canSendInvites = computed(
    () => this.inviteRecipientCount() > 0 && !this.isInviteSending(),
  );

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

  readonly registrationForm = new FormGroup<BusinessRegistrationForm>({
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

    // Setup invite user search with debounce
    this.inviteSearchSubject$
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe((query) => {
        if (query && query.trim().length >= 2) {
          this.performInviteSearch(query.trim());
        } else {
          this.inviteSearchResults.set([]);
          this.isInviteSearching.set(false);
        }
      });

    effect(() => {
      const id = this.organizatonContextService.currentOrganization()?.id || null;
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
        activity.toLowerCase().includes(query),
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

  protected onOpenInviteDrawer(): void {
    // Reset drawer state
    this.inviteSearchQuery.set('');
    this.inviteSearchResults.set([]);
    this.isInviteSearching.set(false);
    this.inviteSelectedUsers.set([]);
    this.inviteManualEmails.set([]);
    // Default expiry: 7 days from now
    const defaultExpiry = new Date();
    defaultExpiry.setDate(defaultExpiry.getDate() + 7);
    this.inviteExpiryDate.set(defaultExpiry);
    this.inviteMessage.set('');
    this.inviteSendResults.set(null);
    this.isInviteSending.set(false);
    this.showInviteDrawer.set(true);
  }

  protected onCloseInviteDrawer(): void {
    this.showInviteDrawer.set(false);
  }

  protected onInviteSearchChange(query: string): void {
    this.inviteSearchQuery.set(query);
    this.inviteSearchSubject$.next(query);
    if (query && query.trim().length >= 2) {
      this.isInviteSearching.set(true);
    }
  }

  private performInviteSearch(query: string): void {
    this.isInviteSearching.set(true);
    this.userService.getUsers({ search: query, page: 1, limit: 20 }).subscribe({
      next: (response) => {
        // Filter out already selected users
        const selectedIds = this.inviteSelectedUsers().map((u) => u.id);
        const filtered = response.data.filter((u) => !selectedIds.includes(u.id));
        this.inviteSearchResults.set(filtered);
        this.isInviteSearching.set(false);
      },
      error: (error) => {
        console.error('User search failed:', error);
        this.inviteSearchResults.set([]);
        this.isInviteSearching.set(false);
      },
    });
  }

  protected onInviteSelectUser(user: User): void {
    const current = this.inviteSelectedUsers();
    if (!current.find((u) => u.id === user.id)) {
      this.inviteSelectedUsers.set([...current, user]);
    }
    // Remove from search results
    this.inviteSearchResults.set(this.inviteSearchResults().filter((u) => u.id !== user.id));
  }

  protected onInviteRemoveUser(user: User): void {
    this.inviteSelectedUsers.set(this.inviteSelectedUsers().filter((u) => u.id !== user.id));
  }

  protected onInviteManualEmailsChange(emailsInput: string | string[]): void {
    let emails: string[];
    if (typeof emailsInput === 'string') {
      emails = emailsInput
        .split(/[,;\n]+/)
        .map((e) => e.trim())
        .filter((e) => e.length > 0);
    } else {
      emails = emailsInput;
    }
    // Validate each email
    const validEmails = emails.filter((e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e));
    this.inviteManualEmails.set(validEmails);
  }

  protected async onSendInvites(): Promise<void> {
    if (!this.organizationId() || this.inviteRecipientCount() === 0) return;

    this.isInviteSending.set(true);
    this.inviteSendResults.set(null);

    const recipients = [
      ...this.inviteSelectedUsers().map((u) => ({ userId: u.id })),
      ...this.inviteManualEmails().map((e) => ({ email: e })),
    ];

    const dto: BulkInviteMembersDto = {
      recipients,
      roles: ['member'],
      message: this.inviteMessage() || undefined,
    };

    const expiry = this.inviteExpiryDate();
    if (expiry) {
      dto.expiresAt = expiry.toISOString();
    }

    this.organizationService.bulkInviteMembers(this.organizationId()!, dto).subscribe({
      next: (response: BulkInviteResponse) => {
        this.inviteSendResults.set(response.results);
        this.isInviteSending.set(false);

        if (response.success > 0) {
          this.messageService.add({
            severity: 'success',
            summary: this.translocoService.translate(
              'organization.detail.invite.drawer.successSummary',
            ),
            detail: this.translocoService.translate(
              'organization.detail.invite.drawer.successDetail',
              {
                count: response.success,
              },
            ),
          });
        }

        if (response.failed > 0) {
          this.messageService.add({
            severity: 'warn',
            summary: this.translocoService.translate(
              'organization.detail.invite.drawer.partialError',
            ),
            detail: this.translocoService.translate(
              'organization.detail.invite.drawer.partialErrorDetail',
              {
                failed: response.failed,
                total: response.total,
              },
            ),
          });
        }
      },
      error: (error: any) => {
        console.error('Bulk invite failed:', error);
        this.isInviteSending.set(false);
        this.messageService.add({
          severity: 'error',
          summary: this.translocoService.translate('organization.detail.members.invite.error'),
          detail: error?.error?.message || 'Failed to send invitations',
        });
      },
    });
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

  protected formatDate(dateString: string | null | undefined): string {
    if (!dateString) return '—';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '—';
    return date.toLocaleDateString();
  }
}
