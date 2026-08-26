import { Component, ChangeDetectionStrategy, input, output, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IconComponent, IconName } from '../icon/icon.component';
import { CheckboxComponent } from '../form/checkbox/checkbox.component';

export interface TreeNode {
  id: string;
  label: string;
  icon?: IconName;
  expandedIcon?: IconName;
  expanded?: boolean;
  selected?: boolean;
  checked?: boolean;
  disabled?: boolean;
  badge?: string | number;
  badgeColor?: string;
  children?: TreeNode[];
}

@Component({
  selector: 'erp-tree-node',
  standalone: true,
  imports: [CommonModule, FormsModule, IconComponent, CheckboxComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="space-y-1">
      <!-- Node Item Row -->
      <div (click)="onSelect()"
           [class.bg-indigo-50/70]="node().selected"
           [class.dark:bg-indigo-950/40]="node().selected"
           [class.text-indigo-600]="node().selected"
           [class.dark:text-indigo-400]="node().selected"
           [class.hover:bg-slate-100]="!node().selected && !node().disabled"
           [class.dark:hover:bg-slate-800]="!node().selected && !node().disabled"
           [class.opacity-40]="node().disabled"
           [class.cursor-not-allowed]="node().disabled"
           [class.cursor-pointer]="!node().disabled"
           class="flex items-center justify-between px-2.5 py-1.5 rounded-xl transition-colors group">
        
        <div class="flex items-center gap-2 min-w-0 flex-1">
          <!-- Expand / Collapse Arrow -->
          @if (node().children && node().children!.length > 0) {
            <button (click)="onToggle($event)"
                    type="button"
                    aria-label="Thu gọn hoặc mở rộng"
                    class="p-0.5 rounded-md hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors">
              <erp-icon [name]="node().expanded ? 'chevron-down' : 'chevron-right'" [size]="14"></erp-icon>
            </button>
          } @else {
            <span class="w-4"></span>
          }

          <!-- Checkbox (if checkable) -->
          @if (checkable()) {
            <div (click)="$event.stopPropagation()" class="flex items-center">
              <erp-checkbox [ngModel]="node().checked || false"
                            (checkedChange)="onCheckNode($event)">
              </erp-checkbox>
            </div>
          }

          <!-- Node Icon -->
          <erp-icon [name]="nodeIcon()"
                    [size]="16"
                    class="shrink-0 text-slate-500 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
          </erp-icon>

          <!-- Node Label -->
          <span class="truncate text-xs font-semibold">{{ node().label }}</span>
        </div>

        <!-- Badge -->
        @if (node().badge) {
          <span [class]="node().badgeColor || 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'"
                class="px-1.5 py-0.2 rounded-md text-[10px] font-bold">
            {{ node().badge }}
          </span>
        }
      </div>

      <!-- Nested Children Nodes -->
      @if (node().children && node().children!.length > 0 && node().expanded) {
        <div class="pl-5 border-l border-slate-200/80 dark:border-slate-800 ml-4 space-y-1 animate-in fade-in slide-in-from-top-1 duration-150">
          @for (child of node().children!; track child.id) {
            <erp-tree-node [node]="child"
                           [checkable]="checkable()"
                           [selectable]="selectable()"
                           (nodeClick)="nodeClick.emit($event)"
                           (nodeToggle)="nodeToggle.emit($event)"
                           (checkChange)="checkChange.emit($event)">
            </erp-tree-node>
          }
        </div>
      }
    </div>
  `
})
export class TreeNodeComponent {
  readonly node = input.required<TreeNode>();
  readonly checkable = input<boolean>(false);
  readonly selectable = input<boolean>(true);

  readonly nodeClick = output<TreeNode>();
  readonly nodeToggle = output<TreeNode>();
  readonly checkChange = output<TreeNode>();

  readonly nodeIcon = computed<IconName>(() => {
    const n = this.node();
    if (n.expanded && n.expandedIcon) return n.expandedIcon;
    if (n.icon) return n.icon;
    if (n.children && n.children.length > 0) {
      return n.expanded ? 'folder-minus' : 'folder';
    }
    return 'file';
  });

  onToggle(event: MouseEvent): void {
    event.stopPropagation();
    const n = this.node();
    if (n.disabled) return;
    n.expanded = !n.expanded;
    this.nodeToggle.emit(n);
  }

  onSelect(): void {
    const n = this.node();
    if (n.disabled) return;
    if (this.selectable()) {
      n.selected = !n.selected;
    }
    this.nodeClick.emit(n);
  }

  onCheckNode(checked: boolean): void {
    const n = this.node();
    if (n.disabled) return;
    n.checked = checked;
    this.setChildrenChecked(n, checked);
    this.checkChange.emit(n);
  }

  private setChildrenChecked(node: TreeNode, checked: boolean): void {
    if (node.children) {
      for (const child of node.children) {
        child.checked = checked;
        this.setChildrenChecked(child, checked);
      }
    }
  }
}

@Component({
  selector: 'erp-tree-view',
  standalone: true,
  imports: [CommonModule, FormsModule, IconComponent, TreeNodeComponent],
  templateUrl: './tree-view.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [`
    :host {
      display: block;
      width: 100%;
    }
  `]
})
export class TreeViewComponent {
  readonly nodes = input<TreeNode[]>([]);
  readonly checkable = input<boolean>(false);
  readonly selectable = input<boolean>(true);
  readonly searchable = input<boolean>(false);
  readonly searchPlaceholder = input<string>('Tìm kiếm nút cây...');

  readonly nodeClick = output<TreeNode>();
  readonly nodeToggle = output<TreeNode>();
  readonly checkChange = output<TreeNode>();

  searchQuery: string = '';
}
