import { AvatarSize, AvatarShape } from '../../enums/component.enum';
export declare class AvatarComponent {
    name: string;
    size: AvatarSize | 'xs' | 'sm' | 'md' | 'lg' | 'xl';
    shape: AvatarShape | 'circle' | 'rounded' | 'square';
    online: boolean;
    imageUrl?: string;
    loading: boolean;
    get initial(): string;
    getSizeClasses(): string;
    getShapeClasses(): string;
}
