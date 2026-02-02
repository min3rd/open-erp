import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { UserConfigDto } from '../interfaces/config.types';

@Injectable({
  providedIn: 'root',
})
export class ConfigService {
  private _config: BehaviorSubject<UserConfigDto> = new BehaviorSubject<any>(null);

  get config$(): Observable<UserConfigDto | null> {
    return this._config.asObservable();
  }
}
