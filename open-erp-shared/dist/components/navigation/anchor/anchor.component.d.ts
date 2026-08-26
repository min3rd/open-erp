import { OnInit, AfterViewInit } from '@angular/core';
import { IconName } from '../../icon/icon.component';
export interface AnchorItem {
    id?: string;
    title: string;
    targetId: string;
    icon?: IconName;
    children?: AnchorItem[];
}
export declare class AnchorComponent implements OnInit, AfterViewInit {
    readonly items: import("@angular/core").InputSignal<AnchorItem[]>;
    readonly activeTargetId: import("@angular/core").ModelSignal<string>;
    readonly offsetTop: import("@angular/core").InputSignal<number>;
    readonly showRail: import("@angular/core").InputSignal<boolean>;
    readonly title: import("@angular/core").InputSignal<string | undefined>;
    readonly anchorClick: import("@angular/core").OutputEmitterRef<AnchorItem>;
    ngOnInit(): void;
    ngAfterViewInit(): void;
    onWindowScroll(): void;
    scrollToTarget(item: AnchorItem, event: MouseEvent): void;
    private checkActiveSection;
}
