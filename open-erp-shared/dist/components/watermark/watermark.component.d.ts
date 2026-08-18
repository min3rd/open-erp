import { OnInit, OnChanges, SimpleChanges } from '@angular/core';
export declare class WatermarkComponent implements OnInit, OnChanges {
    content: string | string[];
    image?: string;
    width: number;
    height: number;
    rotate: number;
    opacity: number;
    fontSize: number;
    fontColor: string;
    watermarkPattern: string;
    patternSize: string;
    ngOnInit(): void;
    ngOnChanges(changes: SimpleChanges): void;
    private generateWatermark;
}
