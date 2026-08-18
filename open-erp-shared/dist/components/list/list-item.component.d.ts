import { EventEmitter } from '@angular/core';
import { IconName } from '../icon/icon.component';
export declare class ListItemComponent {
    title?: string;
    description?: string;
    icon?: IconName;
    clickable: boolean;
    disabled: boolean;
    active: boolean;
    itemClick: EventEmitter<MouseEvent>;
    onClick(event: MouseEvent): void;
}
