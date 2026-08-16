import { TypographyVariant } from '../../enums/component.enum';
export declare class TypographyComponent {
    variant: TypographyVariant | 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'lead' | 'body' | 'small' | 'muted' | 'code';
    weight?: 'light' | 'normal' | 'medium' | 'semibold' | 'bold' | 'black';
    align?: 'left' | 'center' | 'right' | 'justify';
    gradient: boolean;
    truncate: boolean;
    loading: boolean;
    skeletonWidth: string;
    getTypographyClasses(): string;
    getSkeletonHeight(): string;
}
