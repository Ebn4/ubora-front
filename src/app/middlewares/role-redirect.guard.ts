// src/app/middlewares/role-redirect.guard.ts
import { Injectable, inject } from '@angular/core';
import { CanActivateFn, Router, UrlTree } from '@angular/router';
import { LocalStorageService } from '../services/local-storage.service';

@Injectable({ providedIn: 'root' })
export class RoleRedirectService {
  private localStorageService = inject(LocalStorageService);
  private router = inject(Router);

  canActivate(): boolean | UrlTree {
    const userData = this.localStorageService.getData('user');
    if (!userData) {
      return this.router.createUrlTree(['/login']);
    }

    try {
      const user = JSON.parse(userData);
      if (user.role === 'ADMIN') {
        return this.router.createUrlTree(['/period']);
      }
      // Si EVALUATOR (ou autre rôle autorisé), on laisse passer
      return true;
    } catch (e) {
      return this.router.createUrlTree(['/login']);
    }
  }
}

export const RoleRedirectGuard: CanActivateFn = (): boolean | UrlTree => {
  return inject(RoleRedirectService).canActivate();
};
