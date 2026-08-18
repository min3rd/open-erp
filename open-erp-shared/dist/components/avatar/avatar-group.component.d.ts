import { AvatarSize, AvatarShape } from '../../enums/component.enum';
export interface AvatarGroupUser {
    name: string;
    imageUrl?: string;
    online?: boolean;
}
export declare class AvatarGroupComponent {
    users: AvatarGroupUser[];
    max: number;
    size: AvatarSize | 'xs' | 'sm' | 'md' | 'lg' | 'xl';
    shape: AvatarShape | 'circle' | 'rounded' | 'square';
    get visibleUsers(): AvatarGroupUser[];
    get remainingCount(): number;
    getSizeClasses(): string;
    getShapeClasses(): string;
}
