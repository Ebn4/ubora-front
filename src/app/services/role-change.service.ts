import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class RoleChangeService {
  private roleChangedSubject = new BehaviorSubject<boolean>(false);
  roleChanged$ = this.roleChangedSubject.asObservable();

  // Méthode pour notifier qu'un rôle a changé
  notifyRoleChanged() {
    this.roleChangedSubject.next(true);
  }

  // Méthode pour réinitialiser
  resetNotification() {
    this.roleChangedSubject.next(false);
  }
}
