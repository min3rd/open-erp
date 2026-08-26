export interface GalleryImage {
    src: string;
    alt?: string;
    title?: string;
}
export declare class ImageGalleryComponent {
    readonly images: import("@angular/core").InputSignal<(string | GalleryImage)[]>;
    readonly columns: import("@angular/core").InputSignal<number>;
    readonly height: import("@angular/core").InputSignal<string>;
    readonly normalizedImages: import("@angular/core").Signal<GalleryImage[]>;
    readonly gridColsClass: import("@angular/core").Signal<"grid-cols-2" | "grid-cols-2 sm:grid-cols-3" | "grid-cols-2 sm:grid-cols-3 md:grid-cols-6" | "grid-cols-2 sm:grid-cols-3 md:grid-cols-4">;
}
