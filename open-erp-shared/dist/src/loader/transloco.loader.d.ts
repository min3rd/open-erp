import { TranslocoLoader } from '@jsverse/transloco';
export declare class SharedTranslocoHttpLoader implements TranslocoLoader {
    private http;
    getTranslation(lang: string): any;
}
