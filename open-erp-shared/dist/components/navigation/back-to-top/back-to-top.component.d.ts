import { EventEmitter, OnInit } from '@angular/core';
import { IconName } from '../../icon/icon.component';
import { BackToTopShape } from '../../../enums/component.enum';
export declare class BackToTopComponent implements OnInit {
    threshold: number;
    shape: BackToTopShape | 'circle' | 'rounded' | 'pill';
    showProgress: boolean;
    icon: IconName;
    text?: string;
    tooltip: string;
    targetSelector?: string;
    right: string;
    bottom: string;
    scrollClick: EventEmitter<void>;
    visible: boolean;
    scrollProgress: number;
    get isCircle(): boolean;
    get isRounded(): boolean;
    get isPill(): boolean;
    ngOnInit(): void;
    onWindowScroll(): void;
    scrollToTop(): void;
    private updateScrollState;
}
