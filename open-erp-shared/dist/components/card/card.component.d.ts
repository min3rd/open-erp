import { CardVariant } from '../../enums/component.enum';
export declare class CardComponent {
    readonly title: import("@angular/core").InputSignal<string | undefined>;
    readonly subtitle: import("@angular/core").InputSignal<string | undefined>;
    readonly icon: import("@angular/core").InputSignal<string | undefined>;
    readonly coverImage: import("@angular/core").InputSignal<string | undefined>;
    readonly variant: import("@angular/core").InputSignal<"ghost" | "elevated" | "outlined" | "filled" | CardVariant>;
    readonly hoverable: import("@angular/core").InputSignal<boolean>;
    readonly loading: import("@angular/core").InputSignal<boolean>;
    readonly padded: import("@angular/core").InputSignal<boolean>;
    readonly variantClass: import("@angular/core").Signal<string>;
}
