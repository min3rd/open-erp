export interface GalleryImage {
    src: string;
    alt?: string;
    title?: string;
}
export declare class ImageGalleryComponent {
    images: (string | GalleryImage)[];
    columns: number;
    height: string;
    get normalizedImages(): GalleryImage[];
    getGridColsClasses(): string;
}
