import { EventEmitter } from '@angular/core';
import { IconName } from '../icon/icon.component';
import { TagColor, TagVariant } from '../../enums/component.enum';
export declare class TagComponent {
    label: string;
    icon?: IconName;
    color: TagColor | 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'purple' | 'pink';
    variant: TagVariant | 'solid' | 'subtle' | 'outline';
    size: 'sm' | 'md' | 'lg';
    removable: boolean;
    clickable: boolean;
    disabled: boolean;
    loading: boolean;
    remove: EventEmitter<MouseEvent>;
    tagClick: EventEmitter<MouseEvent>;
    onTagClick(event: MouseEvent): void;
    onRemove(event: MouseEvent): void;
    getTagClasses(): string;
}
