import { IconName } from '../icon/icon.component';
export interface ContextMenuItem {
    id?: string;
    label: string;
    icon?: IconName;
    disabled?: boolean;
    danger?: boolean;
    divider?: boolean;
    shortcut?: string;
    action?: () => void;
}
export declare class ContextMenuComponent {
    readonly items: import("@angular/core").InputSignal<ContextMenuItem[]>;
    readonly disabled: import("@angular/core").InputSignal<boolean>;
    readonly itemClick: import("@angular/core").OutputEmitterRef<ContextMenuItem>;
    isOpen: import("@angular/core").WritableSignal<boolean>;
    posX: import("@angular/core").WritableSignal<number>;
    posY: import("@angular/core").WritableSignal<number>;
    onDocumentClick(): void;
    onDocumentScroll(): void;
    onContextMenu(event: MouseEvent): void;
    handleItemClick(item: ContextMenuItem): void;
}
