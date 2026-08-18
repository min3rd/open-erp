var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IconComponent } from '../icon/icon.component';
import { CheckboxComponent } from '../form/checkbox/checkbox.component';
let TreeNodeComponent = class TreeNodeComponent {
    node;
    checkable = false;
    selectable = true;
    nodeClick = new EventEmitter();
    nodeToggle = new EventEmitter();
    checkChange = new EventEmitter();
    get nodeIcon() {
        if (this.node.expanded && this.node.expandedIcon)
            return this.node.expandedIcon;
        if (this.node.icon)
            return this.node.icon;
        if (this.node.children && this.node.children.length > 0) {
            return this.node.expanded ? 'folder-minus' : 'folder';
        }
        return 'file';
    }
    onToggle(event) {
        event.stopPropagation();
        if (this.node.disabled)
            return;
        this.node.expanded = !this.node.expanded;
        this.nodeToggle.emit(this.node);
    }
    onSelect() {
        if (this.node.disabled)
            return;
        if (this.selectable) {
            this.node.selected = !this.node.selected;
        }
        this.nodeClick.emit(this.node);
    }
    onCheckNode(checked) {
        if (this.node.disabled)
            return;
        this.node.checked = checked;
        this.setChildrenChecked(this.node, checked);
        this.checkChange.emit(this.node);
    }
    setChildrenChecked(node, checked) {
        if (node.children) {
            for (const child of node.children) {
                child.checked = checked;
                this.setChildrenChecked(child, checked);
            }
        }
    }
};
__decorate([
    Input({ required: true }),
    __metadata("design:type", Object)
], TreeNodeComponent.prototype, "node", void 0);
__decorate([
    Input(),
    __metadata("design:type", Boolean)
], TreeNodeComponent.prototype, "checkable", void 0);
__decorate([
    Input(),
    __metadata("design:type", Boolean)
], TreeNodeComponent.prototype, "selectable", void 0);
__decorate([
    Output(),
    __metadata("design:type", Object)
], TreeNodeComponent.prototype, "nodeClick", void 0);
__decorate([
    Output(),
    __metadata("design:type", Object)
], TreeNodeComponent.prototype, "nodeToggle", void 0);
__decorate([
    Output(),
    __metadata("design:type", Object)
], TreeNodeComponent.prototype, "checkChange", void 0);
TreeNodeComponent = __decorate([
    Component({
        selector: 'erp-tree-node',
        standalone: true,
        imports: [CommonModule, FormsModule, IconComponent, CheckboxComponent],
        template: `
    <div class="space-y-1">
      <!-- Node Item Row -->
      <div (click)="onSelect()"
           [class.bg-indigo-50/70]="node.selected"
           [class.dark:bg-indigo-950/40]="node.selected"
           [class.text-indigo-600]="node.selected"
           [class.dark:text-indigo-400]="node.selected"
           [class.hover:bg-slate-100]="!node.selected && !node.disabled"
           [class.dark:hover:bg-slate-800]="!node.selected && !node.disabled"
           [class.opacity-40]="node.disabled"
           [class.cursor-not-allowed]="node.disabled"
           [class.cursor-pointer]="!node.disabled"
           class="flex items-center justify-between px-2.5 py-1.5 rounded-xl transition-colors group">
        
        <div class="flex items-center gap-2 min-w-0 flex-1">
          <!-- Expand / Collapse Arrow -->
          @if (node.children && node.children.length > 0) {
            <button (click)="onToggle($event)"
                    type="button"
                    class="p-0.5 rounded-md hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors">
              <erp-icon [name]="node.expanded ? 'chevron-down' : 'chevron-right'" [size]="14"></erp-icon>
            </button>
          } @else {
            <span class="w-4"></span>
          }

          <!-- Checkbox (if checkable) -->
          @if (checkable) {
            <div (click)="$event.stopPropagation()" class="flex items-center">
              <erp-checkbox [ngModel]="node.checked || false"
                            (checkedChange)="onCheckNode($event)">
              </erp-checkbox>
            </div>
          }

          <!-- Node Icon -->
          <erp-icon [name]="nodeIcon"
                    [size]="16"
                    class="shrink-0 text-slate-500 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
          </erp-icon>

          <!-- Node Label -->
          <span class="truncate text-xs font-semibold">{{ node.label }}</span>
        </div>

        <!-- Badge -->
        @if (node.badge) {
          <span [class]="node.badgeColor || 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'"
                class="px-1.5 py-0.2 rounded-md text-[10px] font-bold">
            {{ node.badge }}
          </span>
        }
      </div>

      <!-- Nested Children Nodes -->
      @if (node.children && node.children.length > 0 && node.expanded) {
        <div class="pl-5 border-l border-slate-200/80 dark:border-slate-800 ml-4 space-y-1 animate-in fade-in slide-in-from-top-1 duration-150">
          @for (child of node.children; track child.id) {
            <erp-tree-node [node]="child"
                           [checkable]="checkable"
                           [selectable]="selectable"
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
], TreeNodeComponent);
export { TreeNodeComponent };
let TreeViewComponent = class TreeViewComponent {
    nodes = [];
    checkable = false;
    selectable = true;
    searchable = false;
    searchPlaceholder = 'Tìm kiếm nút cây...';
    nodeClick = new EventEmitter();
    nodeToggle = new EventEmitter();
    checkChange = new EventEmitter();
    searchQuery = '';
};
__decorate([
    Input(),
    __metadata("design:type", Array)
], TreeViewComponent.prototype, "nodes", void 0);
__decorate([
    Input(),
    __metadata("design:type", Boolean)
], TreeViewComponent.prototype, "checkable", void 0);
__decorate([
    Input(),
    __metadata("design:type", Boolean)
], TreeViewComponent.prototype, "selectable", void 0);
__decorate([
    Input(),
    __metadata("design:type", Boolean)
], TreeViewComponent.prototype, "searchable", void 0);
__decorate([
    Input(),
    __metadata("design:type", String)
], TreeViewComponent.prototype, "searchPlaceholder", void 0);
__decorate([
    Output(),
    __metadata("design:type", Object)
], TreeViewComponent.prototype, "nodeClick", void 0);
__decorate([
    Output(),
    __metadata("design:type", Object)
], TreeViewComponent.prototype, "nodeToggle", void 0);
__decorate([
    Output(),
    __metadata("design:type", Object)
], TreeViewComponent.prototype, "checkChange", void 0);
TreeViewComponent = __decorate([
    Component({
        selector: 'erp-tree-view',
        standalone: true,
        imports: [CommonModule, FormsModule, IconComponent, TreeNodeComponent],
        templateUrl: './tree-view.component.html',
        styles: [`
    :host {
      display: block;
      width: 100%;
    }
  `]
    })
], TreeViewComponent);
export { TreeViewComponent };
//# sourceMappingURL=tree-view.component.js.map