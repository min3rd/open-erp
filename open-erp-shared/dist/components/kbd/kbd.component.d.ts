export declare class KbdComponent {
    key?: string;
    keys?: string[];
    size: 'sm' | 'md' | 'lg';
    get keyList(): string[];
    getSizeClasses(): string;
}
