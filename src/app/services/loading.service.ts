import {Injectable} from '@angular/core';
import {BehaviorSubject} from 'rxjs';

@Injectable({providedIn: 'root'})
export class LoadingService {
  private pendingRequests = 0;
  private _active$ = new BehaviorSubject<boolean>(false);
  active$ = this._active$.asObservable();

  show() {
    if (++this.pendingRequests === 1) this._active$.next(true);
  }

  hide() {
    if (this.pendingRequests > 0 && --this.pendingRequests === 0) {
      this._active$.next(false);
    }
  }
  reset() {
    this.pendingRequests = 0;
    this._active$.next(false);
  }
}
