export declare class ImageComponent {
    src: string;
    alt: string;
    width?: string;
    height?: string;
    preview: boolean;
    fallbackSrc: string;
    rounded: 'none' | 'sm' | 'md' | 'lg' | 'xl' | 'full';
    isLoaded: boolean;
    hasError: boolean;
    isPreviewOpen: boolean;
    zoomScale: number;
    rotateDeg: number;
    onLoad(): void;
    onError(): void;
    openPreview(event: MouseEvent): void;
    closePreview(): void;
    zoomIn(): void;
    zoomOut(): void;
    rotate(): void;
    getRoundedClass(): string;
}
