import { EventEmitter, ElementRef, OnInit } from '@angular/core';
import { AffixPosition } from '../../enums/component.enum';
export declare class AffixComponent implements OnInit {
    private el;
    offsetTop: number;
    offsetBottom: number;
    position: AffixPosition | 'top' | 'bottom';
    affixChange: EventEmitter<boolean>;
    isAffixed: boolean;
    placeholderHeight: number;
    width: number;
    constructor(el: ElementRef);
    ngOnInit(): void;
    checkAffix(): void;
}
