import { EventEmitter } from '@angular/core';
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
    node: TreeNode;
    checkable: boolean;
    selectable: boolean;
    nodeClick: EventEmitter<TreeNode>;
    nodeToggle: EventEmitter<TreeNode>;
    checkChange: EventEmitter<TreeNode>;
    get nodeIcon(): IconName;
    onToggle(event: MouseEvent): void;
    onSelect(): void;
    onCheckNode(checked: boolean): void;
    private setChildrenChecked;
}
export declare class TreeViewComponent {
    nodes: TreeNode[];
    checkable: boolean;
    selectable: boolean;
    searchable: boolean;
    searchPlaceholder: string;
    nodeClick: EventEmitter<TreeNode>;
    nodeToggle: EventEmitter<TreeNode>;
    checkChange: EventEmitter<TreeNode>;
    searchQuery: string;
}
