import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { LocalStorageService } from '../services/local-storage.service';

export const HasAdminRoleGuard: CanActivateFn = () => {
  const storage = inject(LocalStorageService);
  const router = inject(Router);

  const userStr = storage.getData('user');

  if (!userStr) {
    return router.parseUrl('/login');
  }

  try {
    const user = JSON.parse(userStr);

    if (user.role === 'ADMIN') {
      return true;
    }

    return router.parseUrl('/');
  } catch {
    return router.parseUrl('/login');
  }
};
