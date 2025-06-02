import {Routes} from '@angular/router';
import {LoggedGuard} from './middlewares/logged.guard';

export const routes: Routes = [
  {
    path: 'login',
    title: 'Connexion',
    canActivate: [LoggedGuard],
    loadComponent: () => import('./pages/login/login.component').then(r => r.LoginComponent)
  }
];
