export declare class ListItemComponent {
    readonly title: import("@angular/core").InputSignal<string | undefined>;
    readonly description: import("@angular/core").InputSignal<string | undefined>;
    readonly icon: import("@angular/core").InputSignal<string | undefined>;
    readonly clickable: import("@angular/core").InputSignal<boolean>;
    readonly disabled: import("@angular/core").InputSignal<boolean>;
    readonly active: import("@angular/core").InputSignal<boolean>;
    readonly itemClick: import("@angular/core").OutputEmitterRef<MouseEvent>;
    onClick(event: MouseEvent): void;
}
