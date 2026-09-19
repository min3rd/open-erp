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
  TranslateDirective,
  TranslatePipe,
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
    TranslateDirective,
    TranslatePipe
  ],
  templateUrl: './organization.page.html'
})
export class OrganizationPage implements OnInit {
  private organization = inject(OrganizationService);
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
