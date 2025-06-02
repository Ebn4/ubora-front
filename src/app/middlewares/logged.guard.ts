import {inject} from '@angular/core';
import {Router} from '@angular/router';
import {LocalStorageService} from '../services/local-storage.service';

export const LoggedGuard = async () => {
  const localStorageService = inject(LocalStorageService)
  const router = inject(Router)

  if (localStorageService.getData("token")) {
    await router.navigateByUrl('/')
    return false
  }

  return true
}
