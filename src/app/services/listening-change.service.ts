import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ListeningChangeService {

  constructor() { }
  private modalClosedSubject = new BehaviorSubject<boolean>(false);
  modalClosed$ = this.modalClosedSubject.asObservable();

  notifyModalClosed() {
    this.modalClosedSubject.next(true);
  }

  resetNotification() {
    this.modalClosedSubject.next(false); 
  }
}
