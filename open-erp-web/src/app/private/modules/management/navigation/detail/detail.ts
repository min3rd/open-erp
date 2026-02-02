import {
  ChangeDetectionStrategy,
  Component,
  signal,
  inject,
  OnInit,
  OnDestroy,
  computed,
  ChangeDetectorRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { TranslocoModule, TranslocoService } from '@jsverse/transloco';
import { last, Subject, takeUntil } from 'rxjs';

// PrimeNG imports
import { DrawerModule } from 'primeng/drawer';
import { ButtonModule } from 'primeng/button';
import { MessageService } from 'primeng/api';

// Services and DTOs
import { NavigationManagementService } from '../services/navigation-management.service';
import {
  NavigationItemDto,
  CreateNavigationItemDto,
  UpdateNavigationItemDto,
} from '../dto/navigation-item.dto';
import { NavigationEditorComponent } from '../components/navigation-editor.component';

@Component({
  selector: 'app-navigation-detail',
  imports: [CommonModule, TranslocoModule, DrawerModule, ButtonModule, NavigationEditorComponent],
  templateUrl: './detail.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NavigationDetail implements OnInit, OnDestroy {
  private cdr = inject(ChangeDetectorRef);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private navigationService = inject(NavigationManagementService);
  private messageService = inject(MessageService);
  private translocoService = inject(TranslocoService);
  private destroy$ = new Subject<void>();

  // State signals
  protected readonly isOpen = signal(true);
  protected readonly isLoading = signal(false);
  protected readonly isSaving = signal(false);
  protected readonly isFormValid = signal(false);
  protected readonly formData = signal<any>(null);
  protected readonly item = signal<NavigationItemDto | null>(null);
  protected readonly mode = signal<'create' | 'edit' | 'view'>('view');
  protected readonly defaultScope = signal<'global' | 'module'>('global');
  protected readonly defaultModule = signal<string | null>(null);
  protected readonly availableParents = signal<NavigationItemDto[]>([]);

  // Computed values
  protected readonly drawerTitle = computed(() => {
    const currentMode = this.mode();
    if (currentMode === 'create') {
      return this.translocoService.translate('navigationManagement.editor.title.create');
    } else if (currentMode === 'edit') {
      return this.translocoService.translate('navigationManagement.editor.title.edit');
    } else {
      return this.translocoService.translate('navigationManagement.editor.title.view');
    }
  });

  ngOnInit(): void {
    // Subscribe to route params
    this.route.params.pipe(takeUntil(this.destroy$)).subscribe((params) => {
      const id = params['id'];
      const moduleId = params['moduleId']; // Check if we're in a module context
      const isEditRoute = this.route.snapshot.url.some((segment) => segment.path === 'edit');
      const isNewRoute = this.route.snapshot.url.some((segment) => segment.path === 'new');

      if (isNewRoute) {
        // Create mode
        this.mode.set('create');
        this.item.set(null);

        // Detect context from route
        if (moduleId) {
          // Creating in module context
          this.defaultScope.set('module');
          this.defaultModule.set(moduleId);
        } else {
          // Creating in global context
          this.defaultScope.set('global');
          this.defaultModule.set(null);
        }
      } else if (id || moduleId) {
        // View or edit mode
        if (isEditRoute) {
          this.mode.set('edit');
        } else {
          this.mode.set('view');
        }
      }
      this.cdr.markForCheck();
    });

    // Load available parents
    this.loadAvailableParents();

    this.route.data.pipe(takeUntil(this.destroy$)).subscribe((data) => {
      if (data['item']) {
        this.item.set(data['item']);
      } else if (data['moduleItem']) {
        this.item.set(data['moduleItem']);
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Handle drawer close
   */
  protected onClose(): void {
    // If we're viewing/editing an item within a module, go back to the module view
    // Otherwise go back to the global list
    this.router.navigate(['../../../'], { relativeTo: this.route }).then(() => {
      this.isOpen.set(false);
    });
  }

  /**
   * Handle form valid state change
   */
  protected onFormValidChange(isValid: boolean): void {
    this.isFormValid.set(isValid);
  }

  /**
   * Handle form data change
   */
  protected onFormDataChange(data: any): void {
    this.formData.set(data);
  }

  /**
   * Handle submit button click
   */
  protected onSubmit(): void {
    const data = this.formData();
    if (!data) {
      return;
    }

    this.isSaving.set(true);

    if (this.mode() === 'create') {
      this.navigationService
        .createNavigationItem(data as CreateNavigationItemDto)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.messageService.add({
              severity: 'success',
              summary: this.translocoService.translate('navigationManagement.messages.success'),
              detail: this.translocoService.translate(
                'navigationManagement.messages.createSuccess'
              ),
            });
            this.isSaving.set(false);
            this.onClose();
          },
          error: (error) => {
            console.error('Failed to create navigation item:', error);
            this.messageService.add({
              severity: 'error',
              summary: this.translocoService.translate('navigationManagement.messages.error'),
              detail: error.message,
            });
            this.isSaving.set(false);
          },
        });
    } else if (this.mode() === 'edit' && this.item()) {
      this.navigationService
        .updateNavigationItem(this.item()!.id, data as UpdateNavigationItemDto)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.messageService.add({
              severity: 'success',
              summary: this.translocoService.translate('navigationManagement.messages.success'),
              detail: this.translocoService.translate(
                'navigationManagement.messages.updateSuccess'
              ),
            });
            this.isSaving.set(false);
            this.onClose();
          },
          error: (error) => {
            console.error('Failed to update navigation item:', error);
            this.messageService.add({
              severity: 'error',
              summary: this.translocoService.translate('navigationManagement.messages.error'),
              detail: error.message,
            });
            this.isSaving.set(false);
          },
        });
    }
  }

  protected onEdit(): void {
    const item = this.item();
    if (item) {
        this.router.navigate(['./edit'], { relativeTo: this.route });
    }
  }

  private loadAvailableParents(): void {
    // Always load global navigation for parents
    this.navigationService
      .getGlobalNavigation({ includeHidden: true })
      .pipe(takeUntil(this.destroy$))
      .subscribe((items) => {
        const flatItems = this.flattenNavigationItems(items);
        this.availableParents.set(flatItems);
        
        if (this.defaultScope() === 'module' && this.defaultModule()) {
           this.navigationService.getModuleNavigation(this.defaultModule()!, { includeHidden: true })
            .pipe(takeUntil(this.destroy$))
            .subscribe(moduleItems => {
                const flatModuleItems = this.flattenNavigationItems(moduleItems);
                this.availableParents.update(current => {
                    // Filter duplicates by ID
                    const ids = new Set(current.map(i => i.id));
                    const newItems = flatModuleItems.filter(i => !ids.has(i.id));
                    return [...current, ...newItems];
                });
            });
        }
      });
  }

  private flattenNavigationItems(items: NavigationItemDto[]): NavigationItemDto[] {
    let result: NavigationItemDto[] = [];
    for (const item of items) {
      result.push(item);
      if (item.items && item.items.length > 0) {
        result = result.concat(this.flattenNavigationItems(item.items));
      }
    }
    return result;
  }

  get availableModules() {
    return [
      {
        label: this.defaultModule() || 'Default Module',
        value: this.defaultModule() || 'default-module',
      },
    ];
  }
}
