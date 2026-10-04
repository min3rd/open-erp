import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButtons,
  IonBackButton,
  IonMenuButton,
} from '@ionic/angular/standalone';
import { forkJoin } from 'rxjs';
import { OrganizationService } from '../../../core/organization.service';
import { IamService } from '../../../core/iam.service';
import {
  BadgeComponent,
  ColorVariant,
  Branch,
  DepartmentNode,
  FlatDepartmentNode,
  I18nService,
  Membership,
  SharpButtonComponent,
  SharpInputComponent,
  TenantUser,
  TranslateDirective,
  TranslatePipe,
  userStatusLabelKey,
  userStatusVariant,
  apiMessage,
} from '@shared';
import { PagedList } from '../../../core/paged-list';

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

  readonly badgeSuccess = ColorVariant.SUCCESS;
  readonly badgeDefault = ColorVariant.DEFAULT;
  readonly buttonSecondary = ColorVariant.SECONDARY;

  readonly userStatusVariant = userStatusVariant;
  readonly userStatusLabelKey = userStatusLabelKey;

  activeTab = signal<'branches' | 'departments' | 'members'>('branches');
  loading = signal<boolean>(true);
  error = signal<string | null>(null);

  branches = signal<Branch[]>([]);
  departments = signal<DepartmentNode[]>([]);
  members = signal<Membership[]>([]);
  expandedIds = signal<Set<string>>(new Set<string>());

  memberSearch = signal<string>('');
  directoryList = new PagedList<TenantUser>(
    (page) => this.iam.getUsers({ keyword: this.memberSearch().trim() || undefined, page, size: 20 }),
    (err) => this.error.set(apiMessage(this.i18n, err))
  );

  visibleDepartments = computed<FlatDepartmentNode[]>(() => {
    const out: FlatDepartmentNode[] = [];
    this.walk(this.departments(), (node, depth) => {
      out.push({ ...node, depth });
      return this.expandedIds().has(node.id);
    });
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
    if (tab === 'members' && this.directoryList.page() === 0 && !this.directoryList.loading()) {
      this.directoryList.load(true);
    }
  }

  onMemberSearchChange(value: string) {
    this.memberSearch.set(value);
    this.directoryList.debounce(() => this.directoryList.load(true));
  }

  membershipOf(userId: string): Membership | undefined {
    return this.members().find((member) => member.user_id === userId);
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
    let name = '';
    this.walk(this.departments(), (node) => {
      if (name) {
        return false;
      }
      if (node.id === departmentId) {
        name = node.name;
      }
      return true;
    });
    return name;
  }

  private walk<T extends { children?: T[] }>(
    nodes: T[],
    visit: (node: T, depth: number) => boolean | void,
    depth = 0
  ): void {
    for (const node of nodes) {
      if (visit(node, depth) === false) {
        continue;
      }
      this.walk(node.children || [], visit, depth + 1);
    }
  }

  private collectIds(nodes: DepartmentNode[]): Set<string> {
    const ids = new Set<string>();
    this.walk(nodes, (node) => {
      ids.add(node.id);
    });
    return ids;
  }
}
