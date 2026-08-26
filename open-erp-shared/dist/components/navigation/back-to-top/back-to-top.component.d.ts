import { OnInit } from '@angular/core';
import { BackToTopShape } from '../../../enums/component.enum';
export declare class BackToTopComponent implements OnInit {
    readonly threshold: import("@angular/core").InputSignal<number>;
    readonly shape: import("@angular/core").InputSignal<"circle" | "rounded" | "pill" | BackToTopShape>;
    readonly showProgress: import("@angular/core").InputSignal<boolean>;
    readonly icon: import("@angular/core").InputSignal<string>;
    readonly text: import("@angular/core").InputSignal<string | undefined>;
    readonly tooltip: import("@angular/core").InputSignal<string>;
    readonly targetSelector: import("@angular/core").InputSignal<string | undefined>;
    readonly right: import("@angular/core").InputSignal<string>;
    readonly bottom: import("@angular/core").InputSignal<string>;
    readonly scrollClick: import("@angular/core").OutputEmitterRef<void>;
    visible: import("@angular/core").WritableSignal<boolean>;
    scrollProgress: import("@angular/core").WritableSignal<number>;
    readonly isCircle: import("@angular/core").Signal<boolean>;
    readonly isRounded: import("@angular/core").Signal<boolean>;
    readonly isPill: import("@angular/core").Signal<boolean>;
    ngOnInit(): void;
    onWindowScroll(): void;
    scrollToTop(): void;
    private updateScrollState;
}
