import { Translation, TranslocoLoader } from '@jsverse/transloco';
export declare class SharedTranslocoHttpLoader implements TranslocoLoader {
    private http;
    getTranslation(lang: string): import("rxjs").Observable<Translation>;
}
