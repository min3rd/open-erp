import { ElementRef, OnInit } from '@angular/core';
import { AffixPosition } from '../../enums/component.enum';
export declare class AffixComponent implements OnInit {
    private el;
    readonly offsetTop: import("@angular/core").InputSignal<number>;
    readonly offsetBottom: import("@angular/core").InputSignal<number>;
    readonly position: import("@angular/core").InputSignal<"top" | "bottom" | AffixPosition>;
    readonly affixChange: import("@angular/core").OutputEmitterRef<boolean>;
    isAffixed: import("@angular/core").WritableSignal<boolean>;
    placeholderHeight: import("@angular/core").WritableSignal<number>;
    width: import("@angular/core").WritableSignal<number>;
    readonly isTop: import("@angular/core").Signal<boolean>;
    constructor(el: ElementRef);
    ngOnInit(): void;
    checkAffix(): void;
}
