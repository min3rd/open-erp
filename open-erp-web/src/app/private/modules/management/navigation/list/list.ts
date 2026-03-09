import {
  ChangeDetectionStrategy,
  Component,
  signal,
  computed,
  inject,
  OnInit,
  OnDestroy,
  effect,
  ChangeDetectorRef,
  ViewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute, RouterOutlet } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TranslocoModule, TranslocoService } from '@jsverse/transloco';
import { Subject, takeUntil } from 'rxjs';

// PrimeNG imports
import { TreeModule } from 'primeng/tree';
import { TreeDragDropService, TreeNode } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { MpToolbar } from '../../../../../../core/components/toolbar';
import { TooltipModule } from 'primeng/tooltip';
import { MessageService } from 'primeng/api';
import { SelectButtonModule } from 'primeng/selectbutton';
import { ContextMenuModule } from 'primeng/contextmenu';
import { ContextMenu } from 'primeng/contextmenu';
import { MenuItem } from 'primeng/api';

// Services and DTOs
import { NavigationManagementService } from '../services/navigation-management.service';
import { NavigationItemDto } from '../dto/navigation-item.dto';

@Component({
  selector: 'app-navigation-list',
  imports: [
    CommonModule,
    RouterOutlet,
    FormsModule,
    TranslocoModule,
    TreeModule,
    ButtonModule,
    MpToolbar,
    TooltipModule,
    SelectButtonModule,
    ContextMenuModule,
  ],
  providers: [TreeDragDropService],
  templateUrl: './list.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NavigationList implements OnInit, OnDestroy {
  private cdr = inject(ChangeDetectorRef);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private navigationService = inject(NavigationManagementService);
  private messageService = inject(MessageService);
  private translocoService = inject(TranslocoService);
  private destroy$ = new Subject<void>();
  private resizeHandler: (() => void) | null = null;

  // Context menu reference
  @ViewChild('contextMenu') contextMenu!: ContextMenu;

  // State signals
  protected readonly isMobile = signal(false);
  protected readonly activeScope = signal<'global' | 'module'>('global');
  protected readonly isLoading = signal(false);
  protected readonly globalNavigationItems = signal<NavigationItemDto[]>([]);
  protected readonly moduleNavigationItems = signal<NavigationItemDto[]>([]);
  protected readonly selectedModule = signal<NavigationItemDto | null>(null);
  protected readonly selectedItem = signal<NavigationItemDto | null>(null);

  // Tab options for mobile
  protected readonly scopeOptions = [
    { label: 'navigationManagement.tabs.global', value: 'global' as const },
    { label: 'navigationManagement.tabs.module', value: 'module' as const },
  ];

  // Context menu items
  protected readonly contextMenuItems = signal<MenuItem[]>([]);

  // Computed values
  protected readonly globalTreeNodes = computed(() =>
    this.convertToTreeNodes(this.globalNavigationItems())
  );
  protected readonly moduleTreeNodes = computed(() =>
    this.convertToTreeNodes(this.moduleNavigationItems())
  );
  protected readonly selectedTreeNode = signal<TreeNode | null>(null);

  constructor() {
    // Detect mobile viewport
    this.checkViewport();
    if (typeof window !== 'undefined') {
      this.resizeHandler = () => this.checkViewport();
      window.addEventListener('resize', this.resizeHandler);
    }

    // Watch route params for scope changes
    effect(() => {
      const scope = this.activeScope();
      if (scope === 'global') {
        this.loadGlobalNavigation();
      } else if (this.selectedModule()?.moduleId) {
        this.loadModuleNavigation(this.selectedModule()!.moduleId!);
      }
    });
  }

  ngOnInit(): void {
    // Initialize context menu items
    this.initializeContextMenu();

    // Subscribe to route params to detect selected item
    this.route.params.pipe(takeUntil(this.destroy$)).subscribe((params) => {
      const scope = params['scope'] || 'global';
      this.activeScope.set(scope as 'global' | 'module');

      // Check if an item ID is in the route
      const itemId = params['id'];
      if (itemId && itemId !== 'new') {
        // Try to find and select the item (will work after global nav is loaded)
        this.findAndSelectItemById(itemId);
      } else {
        // Clear selection if navigating away from an item
        this.selectedItem.set(null);
        this.selectedModule.set(null);
        this.moduleNavigationItems.set([]);
      }
    });

    // Load global navigation
    this.loadGlobalNavigation();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();

    if (typeof window !== 'undefined' && this.resizeHandler) {
      window.removeEventListener('resize', this.resizeHandler);
    }
  }

  /**
   * Check viewport size to detect mobile
   */
  private checkViewport(): void {
    if (typeof window !== 'undefined') {
      this.isMobile.set(window.innerWidth < 768);
    }
  }

  /**
   * Initialize context menu items
   */
  private initializeContextMenu(): void {
    this.contextMenuItems.set([
      {
        label: this.translocoService.translate('navigationManagement.contextMenu.edit'),
        icon: 'pi pi-pencil',
        command: () => this.onEditItem(),
      },
      {
        label: this.translocoService.translate('navigationManagement.contextMenu.delete'),
        icon: 'pi pi-trash',
        command: () => this.onDeleteItem(),
      },
      {
        separator: true,
      },
      {
        label: this.translocoService.translate('navigationManagement.contextMenu.moveUp'),
        icon: 'pi pi-arrow-up',
        command: () => this.onMoveUp(),
      },
      {
        label: this.translocoService.translate('navigationManagement.contextMenu.moveDown'),
        icon: 'pi pi-arrow-down',
        command: () => this.onMoveDown(),
      },
    ]);

    this.cdr.markForCheck();
  }

  /**
   * Handle context menu show event
   */
  protected onContextMenu(event: any): void {
    // The event.node contains the tree node that was right-clicked
    if (event.node) {
      const node = event.node as TreeNode;
      const item = node.data as NavigationItemDto;
      this.selectedItem.set(item);
      this.selectedTreeNode.set(node);
    }
  }

  /**
   * Load global navigation items
   */
  protected loadGlobalNavigation(): void {
    this.isLoading.set(true);
    this.navigationService
      .getCachedGlobalNavigation()
      .pipe(takeUntil(this.destroy$))
      .subscribe((items) => {
        if (!items) {
          return;
        }
        this.globalNavigationItems.set(items);
        this.isLoading.set(false);
        this.cdr.markForCheck();

        // After loading, check if there's an item ID in the route and select it
        const itemId = this.route.snapshot.params['id'];
        if (itemId && itemId !== 'new' && items.length > 0) {
          this.findAndSelectItemById(itemId);
        }
      });
  }

  /**
   * Load module navigation items
   */
  protected loadModuleNavigation(moduleKey: string): void {
    this.isLoading.set(true);
    this.navigationService
      .getModuleNavigation(moduleKey, { includeHidden: true })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (items) => {
          this.moduleNavigationItems.set(items);
          this.isLoading.set(false);
        },
        error: (error) => {
          console.error('Failed to load module navigation:', error);
          this.messageService.add({
            severity: 'error',
            summary: this.translocoService.translate('navigationManagement.messages.error'),
            detail: error.message,
          });
          this.isLoading.set(false);
        },
      });
  }

  /**
   * Convert NavigationItemDto array to TreeNode array
   */
  private convertToTreeNodes(items: NavigationItemDto[]): TreeNode[] {
    return (items || []).map((item) => this.convertItemToTreeNode(item));
  }

  /**
   * Convert a single NavigationItemDto to TreeNode
   */
  private convertItemToTreeNode(item: NavigationItemDto): TreeNode {
    return {
      key: item.id,
      label: item.label,
      data: item,
      icon: item.icon,
      children: item.items?.map((child) => this.convertItemToTreeNode(child)) || [],
      expanded: false,
      draggable: true,
      droppable: true,
    };
  }

  /**
   * Handle scope change
   */
  protected onScopeChange(value: 'global' | 'module'): void {
    this.router.navigate(['../', value], { relativeTo: this.route });
  }

  /**
   * Handle tree node selection
   */
  protected onNodeSelect(event: any): void {
    const node = event.node as TreeNode;
    const item = node.data as NavigationItemDto;
    this.selectedItem.set(item);
    this.selectedTreeNode.set(node);

    // Determine navigation path based on context
    // If selecting from global tree and item has children (is a module)
    const isGlobalModule = item.scope === 'global' && item.id;

    if (isGlobalModule) {
      // This is a top-level module item in global navigation
      this.selectedModule.set(item);
      this.loadModuleNavigation(item.id);
      this.cdr.markForCheck();

      // Navigate to the module view
      this.router.navigate(['modules', item.id], { relativeTo: this.route });
    } else if (this.selectedModule()?.id) {
      // This is a child item within a module - navigate with module context
      const moduleId = this.selectedModule()!.id;
      this.router.navigate(['modules', moduleId, item.id], { relativeTo: this.route });
    } else {
      // Fallback for other cases
      this.router.navigate([item.id], { relativeTo: this.route });
    }
  }

  /**
   * Handle tree node unselection
   */
  protected onNodeUnselect(): void {
    this.selectedItem.set(null);
    this.selectedTreeNode.set(null);
    this.selectedModule.set(null);
    this.moduleNavigationItems.set([]);
    // Navigate back to list
    this.router.navigate(['./'], { relativeTo: this.route });
  }

  /**
   * Navigate to add new item
   */
  protected onAddItem(): void {
    const selected = this.selectedItem();

    // If we're viewing a module item, navigate to add under that module
    if (selected) {
      this.router.navigate(['/modules/management/navigation/global/modules', selected.id, 'new'], {
        relativeTo: this.route,
      });
    } else {
      // Otherwise, add to global navigation
      this.router.navigate(['new'], { relativeTo: this.route });
    }
  }

  /**
   * Navigate to edit selected item
   */
  protected onEditItem(): void {
    const item = this.selectedItem();
    if (!item) return;

    // Check if we're in module context
    const module = this.selectedModule();

    if (module && module.id) {
      // Editing a module navigation item - include module in path
      this.router.navigate(['modules', module.id, item.id, 'edit'], { relativeTo: this.route });
    } else {
      // Editing a global navigation item
      this.router.navigate(['modules', item.id, 'edit'], { relativeTo: this.route });
    }
  }

  /**
   * Delete selected item
   */
  protected onDeleteItem(): void {
    const item = this.selectedItem();
    if (!item) return;

    if (
      confirm(
        this.translocoService.translate('navigationManagement.deleteDialog.message', {
          label: item.label,
        })
      )
    ) {
      this.navigationService
        .deleteNavigationItem(item.id)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.messageService.add({
              severity: 'success',
              summary: this.translocoService.translate('navigationManagement.messages.success'),
              detail: this.translocoService.translate(
                'navigationManagement.messages.deleteSuccess'
              ),
            });
            this.selectedItem.set(null);
            this.loadGlobalNavigation();
            if (this.selectedModule()?.moduleId) {
              this.loadModuleNavigation(this.selectedModule()!.moduleId!);
            }
            // Navigate back to list
            this.router.navigate(['./'], { relativeTo: this.route });
          },
          error: (error) => {
            console.error('Failed to delete navigation item:', error);
            this.messageService.add({
              severity: 'error',
              summary: this.translocoService.translate('navigationManagement.messages.error'),
              detail: error.message,
            });
          },
        });
    }
  }

  /**
   * Refresh current navigation
   */
  protected onRefresh(): void {
    if (this.activeScope() === 'global') {
      this.loadGlobalNavigation();
    } else if (this.selectedModule()?.moduleId) {
      this.loadModuleNavigation(this.selectedModule()!.moduleId!);
    }
  }

  /**
   * Handle drag & drop reorder
   */
  protected onNodeDrop(event: any): void {
    // Extract drag and drop nodes
    const dragNode = event.dragNode as TreeNode;
    const dropNode = event.dropNode as TreeNode;
    const dragItem = dragNode.data as NavigationItemDto;
    const dropItem = dropNode?.data as NavigationItemDto;
    const dropIndex = event.index;

    // Show loading state
    this.isLoading.set(true);

    // Determine new parent and order
    let newParentId: string | null = null;
    let newOrder = 0;

    if (dropNode) {
      // Dropped on a node
      if (event.dropIndex === undefined) {
        // Dropped as child
        newParentId = dropItem.id;
        newOrder = dropItem.items?.length || 0;
      } else {
        // Dropped as sibling
        newParentId = this.findParentId(dropItem);
        newOrder = dropIndex;
      }
    } else {
      // Dropped at root level
      newParentId = null;
      newOrder = dropIndex;
    }

    // Call backend reorder API
    const reorderPayload = [
      {
        id: dragItem.id,
        newOrder,
        newParentId,
      },
    ];

    this.navigationService
      .reorderNavigationItems(reorderPayload)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.messageService.add({
            severity: 'success',
            summary: this.translocoService.translate('navigationManagement.messages.success'),
            detail: this.translocoService.translate('navigationManagement.messages.reorderSuccess'),
          });
          // Refresh to get updated data from backend
          if (this.activeScope() === 'global') {
            this.loadGlobalNavigation();
          } else if (this.selectedModule()?.moduleId) {
            this.loadModuleNavigation(this.selectedModule()!.moduleId!);
          }
          this.isLoading.set(false);
        },
        error: (error) => {
          console.error('Failed to reorder navigation items:', error);
          this.messageService.add({
            severity: 'error',
            summary: this.translocoService.translate('navigationManagement.messages.error'),
            detail: this.translocoService.translate('navigationManagement.messages.reorderError'),
          });
          // Rollback by refreshing from backend
          if (this.activeScope() === 'global') {
            this.loadGlobalNavigation();
          } else if (this.selectedModule()?.moduleId) {
            this.loadModuleNavigation(this.selectedModule()!.moduleId!);
          }
          this.isLoading.set(false);
        },
      });
  }

  /**
   * Find and select an item by ID from the loaded navigation
   */
  private findAndSelectItemById(itemId: string): void {
    const globalItems = this.globalNavigationItems();
    const item = this.findItemById(globalItems, itemId);

    if (item) {
      this.selectedItem.set(item);

      // Find the corresponding tree node and set it as selected
      const treeNode = this.findTreeNodeById(this.globalTreeNodes(), itemId);
      if (treeNode) {
        this.selectedTreeNode.set(treeNode);
      }

      // If the item has a module field, load its module navigation
      if (item.moduleId) {
        this.selectedModule.set(item);
        this.loadModuleNavigation(item.moduleId);
        this.cdr.markForCheck();
      }
    }
  }

  /**
   * Find a tree node by ID recursively
   */
  private findTreeNodeById(nodes: TreeNode[], id: string): TreeNode | null {
    for (const node of nodes) {
      if (node.data?.id === id) {
        return node;
      }
      if (node.children) {
        const found = this.findTreeNodeById(node.children, id);
        if (found) return found;
      }
    }
    return null;
  }

  /**
   * Find parent ID of a navigation item
   */
  private findParentId(item: NavigationItemDto): string | null {
    // Search in global navigation
    const parent = this.findParentInTree(this.globalNavigationItems(), item.id);
    if (parent) return parent.id;

    // Search in module navigation
    const moduleParent = this.findParentInTree(this.moduleNavigationItems(), item.id);
    if (moduleParent) return moduleParent.id;

    return null;
  }

  /**
   * Find parent item in tree recursively
   */
  private findParentInTree(items: NavigationItemDto[], childId: string): NavigationItemDto | null {
    for (const item of items) {
      if (item.items?.some((child) => child.id === childId)) {
        return item;
      }
      if (item.items) {
        const parent = this.findParentInTree(item.items, childId);
        if (parent) return parent;
      }
    }
    return null;
  }

  /**
   * Move item up in order (keyboard accessible alternative to drag & drop)
   */
  protected onMoveUp(): void {
    const item = this.selectedItem();
    if (!item) return;

    const siblings = this.getSiblings(item);
    const currentIndex = siblings.findIndex((s) => s.id === item.id);

    if (currentIndex > 0) {
      const newOrder = siblings[currentIndex - 1].order;
      this.updateItemOrder(item.id, newOrder);
    }
  }

  /**
   * Move item down in order (keyboard accessible alternative to drag & drop)
   */
  protected onMoveDown(): void {
    const item = this.selectedItem();
    if (!item) return;

    const siblings = this.getSiblings(item);
    const currentIndex = siblings.findIndex((s) => s.id === item.id);

    if (currentIndex < siblings.length - 1) {
      const newOrder = siblings[currentIndex + 1].order;
      this.updateItemOrder(item.id, newOrder);
    }
  }

  /**
   * Get siblings of an item (items with same parent)
   */
  private getSiblings(item: NavigationItemDto): NavigationItemDto[] {
    const parentId = this.findParentId(item);
    const items =
      this.activeScope() === 'global' ? this.globalNavigationItems() : this.moduleNavigationItems();

    if (!parentId) {
      // Root level items
      return items;
    } else {
      // Find parent and return its children
      const parent = this.findItemById(items, parentId);
      return parent?.items || [];
    }
  }

  /**
   * Find item by ID in tree recursively
   */
  private findItemById(items: NavigationItemDto[], id: string): NavigationItemDto | null {
    for (const item of items) {
      if (item.id === id) return item;
      if (item.items) {
        const found = this.findItemById(item.items, id);
        if (found) return found;
      }
    }
    return null;
  }

  /**
   * Update item order via API
   */
  private updateItemOrder(itemId: string, newOrder: number): void {
    this.isLoading.set(true);

    const reorderPayload = [
      {
        id: itemId,
        newOrder,
        newParentId: this.findParentId(this.selectedItem()!),
      },
    ];

    this.navigationService
      .reorderNavigationItems(reorderPayload)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.messageService.add({
            severity: 'success',
            summary: this.translocoService.translate('navigationManagement.messages.success'),
            detail: this.translocoService.translate('navigationManagement.messages.reorderSuccess'),
          });
          // Refresh to get updated data
          this.onRefresh();
        },
        error: (error) => {
          console.error('Failed to update item order:', error);
          this.messageService.add({
            severity: 'error',
            summary: this.translocoService.translate('navigationManagement.messages.error'),
            detail: this.translocoService.translate('navigationManagement.messages.reorderError'),
          });
          this.isLoading.set(false);
        },
      });
  }

  /**
   * Called when a child route component deactivates (e.g. form closes).
   * Triggers a list refresh so changes are reflected immediately.
   */
  protected onChildDeactivated(): void {
    this.onRefresh();
  }
}
