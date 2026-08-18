import { EventEmitter, OnInit, AfterViewInit } from '@angular/core';
import { IconName } from '../../icon/icon.component';
export interface AnchorItem {
    id?: string;
    title: string;
    targetId: string;
    icon?: IconName;
    children?: AnchorItem[];
}
export declare class AnchorComponent implements OnInit, AfterViewInit {
    items: AnchorItem[];
    activeTargetId: string;
    offsetTop: number;
    showRail: boolean;
    title?: string;
    anchorClick: EventEmitter<AnchorItem>;
    activeTargetIdChange: EventEmitter<string>;
    ngOnInit(): void;
    ngAfterViewInit(): void;
    onWindowScroll(): void;
    scrollToTarget(item: AnchorItem, event: MouseEvent): void;
    private checkActiveSection;
}
