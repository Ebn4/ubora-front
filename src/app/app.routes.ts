import {Routes} from '@angular/router';
import {PeriodComponent} from './pages/period/period.component';
import {PeriodSingleComponent} from './pages/period-single/period-single.component';
import {SidebarComponent} from './pages/layout/sidebar/sidebar.component';
import {LoggedGuard} from './middlewares/logged.guard';
import {AuthGuard} from './middlewares/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    title: 'Connexion',
    canActivate: [LoggedGuard],
    loadComponent: () => import('./pages/login/login.component')
  },
  {
    path: '',
    canActivate: [AuthGuard],
    component: SidebarComponent,
    children: [
      {path: '', redirectTo: 'period', pathMatch: 'full'},
      {path: 'period', component: PeriodComponent},
      {path: 'period-single/:id', component: PeriodSingleComponent},
    ]
  }
];
