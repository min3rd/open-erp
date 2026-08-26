import { ToastItem } from './toast.model';
export declare class ToastComponent {
    readonly toast: import("@angular/core").InputSignal<ToastItem>;
    readonly close: import("@angular/core").OutputEmitterRef<void>;
    readonly iconName: import("@angular/core").Signal<string>;
    readonly containerClasses: import("@angular/core").Signal<string>;
    readonly iconColorClass: import("@angular/core").Signal<string>;
    readonly progressBarColor: import("@angular/core").Signal<string>;
}
