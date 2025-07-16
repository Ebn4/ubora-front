import {inject} from '@angular/core';
import {CanActivateFn, Router} from '@angular/router';
import {catchError, map, of} from 'rxjs';
import {UserService} from '../services/user.service';

export const HasAdminRoleGuard: CanActivateFn = (route, state) => {
  const userService = inject(UserService)
  const router = inject(Router)

  return userService.hasAdminRole().pipe(
    map(res => {
      if (!res.hasAdminRole) {
        return router.parseUrl('/evaluator-candidacies');
      }
      return true;
    }),
    catchError(() => of(false))
  );

}



