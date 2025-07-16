import {Routes} from '@angular/router';
import {PeriodComponent} from './pages/period/period.component';
import {PeriodSingleComponent} from './pages/period-single/period-single.component';
import {SidebarComponent} from './pages/layout/sidebar/sidebar.component';
import {PeriodCandidacyComponent} from './pages/period-single/period-candidacy/period-candidacy.component';
import {CandidacySingleComponent} from './pages/candidacy-single/candidacy-single.component';
import {CriteriaComponent} from './pages/criteria/criteria.component';
import {AuthGuard} from './middlewares/auth.guard';
import {LoggedGuard} from './middlewares/logged.guard';
import {PreselectionComponent} from './pages/preselection/preselection.component';
import {
  CandidacyPreselectionComponent
} from './pages/preselection/candidacy-preselection/candidacy-preselection.component';
import {HasAdminRoleGuard} from './middlewares/has-admin-role.guard';

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
      {path: 'period', component: PeriodComponent, canActivate: [HasAdminRoleGuard]},
      {path: 'period-single/:id', component: PeriodSingleComponent, canActivate: [HasAdminRoleGuard]},
      {path: 'criteria', component: CriteriaComponent, canActivate: [HasAdminRoleGuard]},
      {path: 'candidacy', component: PeriodCandidacyComponent},
      {path: 'candidacy-single/:id', component: CandidacySingleComponent},
      {path: 'evaluator-candidacies', component: PreselectionComponent},
      {path: 'evaluator-candidacies-single/:id/:dispatchId', component: CandidacyPreselectionComponent}
    ]
  }
];
