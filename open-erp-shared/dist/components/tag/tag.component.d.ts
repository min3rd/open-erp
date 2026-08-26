import { TagColor, TagVariant } from '../../enums/component.enum';
export declare class TagComponent {
    readonly label: import("@angular/core").InputSignal<string>;
    readonly icon: import("@angular/core").InputSignal<string | undefined>;
    readonly color: import("@angular/core").InputSignal<"primary" | "secondary" | "danger" | "success" | "warning" | "info" | "neutral" | "purple" | "pink" | TagColor>;
    readonly variant: import("@angular/core").InputSignal<"outline" | "solid" | "subtle" | TagVariant>;
    readonly size: import("@angular/core").InputSignal<"sm" | "md" | "lg">;
    readonly removable: import("@angular/core").InputSignal<boolean>;
    readonly clickable: import("@angular/core").InputSignal<boolean>;
    readonly selectable: import("@angular/core").InputSignal<boolean>;
    readonly selected: import("@angular/core").ModelSignal<boolean>;
    readonly disabled: import("@angular/core").InputSignal<boolean>;
    readonly loading: import("@angular/core").InputSignal<boolean>;
    readonly remove: import("@angular/core").OutputEmitterRef<MouseEvent | KeyboardEvent>;
    readonly tagClick: import("@angular/core").OutputEmitterRef<MouseEvent | KeyboardEvent>;
    readonly isInteractive: import("@angular/core").Signal<boolean>;
    readonly iconSize: import("@angular/core").Signal<12 | 14 | 10>;
    readonly removeIconSize: import("@angular/core").Signal<12 | 10>;
    readonly tagClasses: import("@angular/core").Signal<string>;
    onTagClick(event: MouseEvent | KeyboardEvent): void;
    onRemove(event: MouseEvent | KeyboardEvent): void;
    onKeyDown(event: KeyboardEvent): void;
}
