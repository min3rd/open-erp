import { IconName } from '../icon/icon.component';
export declare class LinkComponent {
    href?: string;
    routerLink?: string | any[];
    external: boolean;
    underline: 'always' | 'hover' | 'none';
    color: 'primary' | 'muted' | 'danger' | 'slate';
    iconLeft?: IconName;
    iconRight?: IconName;
    disabled: boolean;
    loading: boolean;
    getColorClasses(): string;
    getUnderlineClasses(): string;
}
