import { IconName } from '../icon/icon.component';
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
export declare class TreeNodeComponent {
    readonly node: import("@angular/core").InputSignal<TreeNode>;
    readonly checkable: import("@angular/core").InputSignal<boolean>;
    readonly selectable: import("@angular/core").InputSignal<boolean>;
    readonly nodeClick: import("@angular/core").OutputEmitterRef<TreeNode>;
    readonly nodeToggle: import("@angular/core").OutputEmitterRef<TreeNode>;
    readonly checkChange: import("@angular/core").OutputEmitterRef<TreeNode>;
    readonly nodeIcon: import("@angular/core").Signal<string>;
    onToggle(event: MouseEvent): void;
    onSelect(): void;
    onCheckNode(checked: boolean): void;
    private setChildrenChecked;
}
export declare class TreeViewComponent {
    readonly nodes: import("@angular/core").InputSignal<TreeNode[]>;
    readonly checkable: import("@angular/core").InputSignal<boolean>;
    readonly selectable: import("@angular/core").InputSignal<boolean>;
    readonly searchable: import("@angular/core").InputSignal<boolean>;
    readonly searchPlaceholder: import("@angular/core").InputSignal<string>;
    readonly nodeClick: import("@angular/core").OutputEmitterRef<TreeNode>;
    readonly nodeToggle: import("@angular/core").OutputEmitterRef<TreeNode>;
    readonly checkChange: import("@angular/core").OutputEmitterRef<TreeNode>;
    searchQuery: string;
}
