import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButtons,
  IonBackButton,
  IonMenuButton
} from '@ionic/angular/standalone';
import { forkJoin } from 'rxjs';
import { OrganizationService } from '../../../core/organization.service';
import { IamService } from '../../../core/iam.service';
import {
  BadgeComponent,
  BadgeVariant,
  Branch,
  ButtonVariant,
  DepartmentNode,
  FlatDepartmentNode,
  I18nService,
  Membership,
  SharpButtonComponent,
  SharpInputComponent,
  TenantUser,
  TranslateDirective,
  TranslatePipe,
  UserStatus,
  apiMessage
} from '@shared';

@Component({
  selector: 'app-organization',
  standalone: true,
  imports: [
    CommonModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButtons,
    IonBackButton,
    IonMenuButton,
    BadgeComponent,
    SharpButtonComponent,
    SharpInputComponent,
    TranslateDirective,
    TranslatePipe
  ],
  templateUrl: './organization.page.html'
})
export class OrganizationPage implements OnInit {
  private organization = inject(OrganizationService);
  private iam = inject(IamService);
  private i18n = inject(I18nService);

  readonly badgeSuccess = BadgeVariant.SUCCESS;
  readonly badgeDefault = BadgeVariant.DEFAULT;
  readonly buttonSecondary = ButtonVariant.SECONDARY;

  activeTab = signal<'branches' | 'departments' | 'members'>('branches');
  loading = signal<boolean>(true);
  error = signal<string | null>(null);

  branches = signal<Branch[]>([]);
  departments = signal<DepartmentNode[]>([]);
  members = signal<Membership[]>([]);
  expandedIds = signal<Set<string>>(new Set<string>());

  directoryUsers = signal<TenantUser[]>([]);
  memberSearch = signal<string>('');
  directoryPage = signal<number>(1);
  directoryTotalPages = signal<number>(1);
  loadingDirectory = signal<boolean>(false);
  loadingMoreDirectory = signal<boolean>(false);
  directoryLoaded = signal<boolean>(false);

  private searchTimer: ReturnType<typeof setTimeout> | null = null;

  visibleDepartments = computed<FlatDepartmentNode[]>(() => {
    const out: FlatDepartmentNode[] = [];
    this.walk(this.departments(), 0, out);
    return out;
  });

  ngOnInit() {
    this.load();
  }

  load() {
    this.loading.set(true);
    this.error.set(null);
    forkJoin({
      branches: this.organization.getBranches(),
      departments: this.organization.getDepartmentTree(),
      members: this.organization.getMemberships()
    }).subscribe({
      next: result => {
        this.branches.set(result.branches.data?.items || []);
        const departments = result.departments.data?.items || [];
        this.departments.set(departments);
        this.expandedIds.set(this.collectIds(departments));
        this.members.set(result.members.data?.items || []);
        this.loading.set(false);
      },
      error: err => {
        this.loading.set(false);
        this.error.set(apiMessage(this.i18n, err));
      }
    });
  }

  setTab(tab: 'branches' | 'departments' | 'members') {
    this.activeTab.set(tab);
    if (tab === 'members' && !this.directoryLoaded() && !this.loadingDirectory()) {
      this.loadDirectory(true);
    }
  }

  onMemberSearchChange(value: string) {
    this.memberSearch.set(value);
    if (this.searchTimer) {
      clearTimeout(this.searchTimer);
    }
    this.searchTimer = setTimeout(() => this.loadDirectory(true), 300);
  }

  loadMoreDirectory() {
    if (this.directoryPage() < this.directoryTotalPages() && !this.loadingMoreDirectory()) {
      this.loadDirectory(false);
    }
  }

  hasMoreDirectory(): boolean {
    return this.directoryPage() < this.directoryTotalPages();
  }

  membershipOf(userId: string): Membership | undefined {
    return this.members().find((member) => member.user_id === userId);
  }

  userStatusVariant(status: string | null | undefined): BadgeVariant {
    switch (status) {
      case UserStatus.ACTIVE:
        return BadgeVariant.SUCCESS;
      case UserStatus.LOCKED:
        return BadgeVariant.WARNING;
      case UserStatus.PENDING:
        return BadgeVariant.INFO;
      default:
        return BadgeVariant.DEFAULT;
    }
  }

  userStatusLabelKey(status: string | null | undefined): string {
    return status ? `USER_STATUS_${status}` : 'COMMON_INACTIVE';
  }

  toggleDepartment(node: DepartmentNode) {
    const next = new Set(this.expandedIds());
    if (next.has(node.id)) {
      next.delete(node.id);
    } else {
      next.add(node.id);
    }
    this.expandedIds.set(next);
  }

  isExpanded(node: DepartmentNode): boolean {
    return this.expandedIds().has(node.id);
  }

  hasChildren(node: DepartmentNode): boolean {
    return (node.children?.length || 0) > 0;
  }

  branchName(branchId: string | null | undefined): string {
    if (!branchId) {
      return '';
    }
    return this.branches().find(branch => branch.id === branchId)?.name || '';
  }

  departmentName(departmentId: string | null | undefined): string {
    if (!departmentId) {
      return '';
    }
    const findRecursive = (nodes: DepartmentNode[]): DepartmentNode | null => {
      for (const node of nodes) {
        if (node.id === departmentId) {
          return node;
        }
        const child = findRecursive(node.children || []);
        if (child) {
          return child;
        }
      }
      return null;
    };
    return findRecursive(this.departments())?.name || '';
  }

  private loadDirectory(reset: boolean) {
    if (reset) {
      this.loadingDirectory.set(true);
    } else {
      this.loadingMoreDirectory.set(true);
    }
    const nextPage = reset ? 1 : this.directoryPage() + 1;
    this.iam.getUsers({ keyword: this.memberSearch().trim() || undefined, page: nextPage, size: 20 }).subscribe({
      next: (res) => {
        const items = res.data?.items || [];
        this.directoryUsers.set(reset ? items : [...this.directoryUsers(), ...items]);
        this.directoryTotalPages.set(res.data?.total_pages || 1);
        this.directoryPage.set(nextPage);
        this.directoryLoaded.set(true);
        this.loadingDirectory.set(false);
        this.loadingMoreDirectory.set(false);
      },
      error: (err) => {
        if (reset) {
          this.directoryUsers.set([]);
        }
        this.loadingDirectory.set(false);
        this.loadingMoreDirectory.set(false);
        this.error.set(apiMessage(this.i18n, err));
      }
    });
  }

  private walk(nodes: DepartmentNode[], depth: number, out: FlatDepartmentNode[]) {
    for (const node of nodes) {
      const children = node.children || [];
      out.push({ ...node, depth });
      if (children.length && this.expandedIds().has(node.id)) {
        this.walk(children, depth + 1, out);
      }
    }
  }

  private collectIds(nodes: DepartmentNode[]): Set<string> {
    const ids = new Set<string>();
    const visit = (list: DepartmentNode[]) => {
      for (const node of list) {
        ids.add(node.id);
        visit(node.children || []);
      }
    };
    visit(nodes);
    return ids;
  }
}
