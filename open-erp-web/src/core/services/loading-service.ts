import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface LoadingState {
  url: string;
  loading: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class LoadingService {
  private _loading: BehaviorSubject<LoadingState[]> = new BehaviorSubject<LoadingState[]>([]);

  get loading$() {
    return this._loading.asObservable();
  }

  append(url: string) {
    const current = this._loading.getValue();
    this._loading.next([...current, { url, loading: true }]);
  }

  remove(url: string) {
    const current = this._loading.getValue();
    this._loading.next(current.filter((item) => item.url !== url));
  }

  clear() {
    this._loading.next([]);
  }

  onLoading$(): Observable<boolean> {
    return new Observable<boolean>((subscriber) => {
      this._loading.subscribe((states) => {
        subscriber.next(states.length > 0);
      });
    });
  }
}
