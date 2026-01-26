import {Routes} from '@angular/router';
import {PeriodComponent} from './pages/period/period.component';
import {PeriodSingleComponent} from './pages/period-single/period-single.component';
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
import {UsersComponent} from './pages/users/users.component';
import {SelectionsComponent} from './pages/selections/selections.component';
import {CandidacySelectionComponent} from './pages/selections/candidacy-selection/candidacy-selection.component';
import {IsSelectorEvaluatorGuard} from './middlewares/is-selector-evaluator.guard';
import {DefaultLayoutComponent} from './pages/layout/default-layout/default-layout.component';
import { EvaluatorHomeComponent } from './pages/evaluator-home/evaluator-home.component';
import { RoleRedirectGuard } from './middlewares/role-redirect.guard';
import { OtpComponent } from './pages/otp/otp.component';

export const routes: Routes = [
  {
    path: 'login',
    title: 'Connexion - Ubora',
    canActivate: [LoggedGuard],
    loadComponent: () => import('./pages/login/login.component')
  },
  {
        path: 'otp',
        title : "OTP verification - Ubora",
        component: OtpComponent
      },
  {
    path: '',
    canActivate: [AuthGuard],
    component: DefaultLayoutComponent,
    children: [
      {path: '', component: EvaluatorHomeComponent, canActivate: [RoleRedirectGuard] ,title : 'Accueil - Ubora'},
      {path: 'users', component: UsersComponent, canActivate: [HasAdminRoleGuard], title : "Gestion des utilisateurs - Ubora"},
      {path: 'period', component: PeriodComponent, canActivate: [HasAdminRoleGuard], title : "Gestion des périodes - - Ubora"},
      {path: 'period-single/:id', component: PeriodSingleComponent, canActivate: [HasAdminRoleGuard], title : "Détails de la période - Ubora"},
      {path: 'criteria', component: CriteriaComponent, canActivate: [HasAdminRoleGuard], title : "Gestion des critères - Ubora"},
      {path: 'selections', component: SelectionsComponent, canActivate: [IsSelectorEvaluatorGuard], title : "Interviews - Ubora"},
      {path: 'selections/candidates/:id', component: CandidacySelectionComponent, title : "Détail de la candidature - Ubora"},
      {path: 'candidacy', component: PeriodCandidacyComponent},
      {path: 'candidacy-single/:id/:period_id', component: CandidacySingleComponent},
      {path: 'evaluator-candidacies', component: PreselectionComponent , title : "Préselection des candidatures - Ubora"},
      {
        path: 'evaluator-candidacies-single/:id/:dispatchId/:periodId/:evaluateurId',
        component: CandidacyPreselectionComponent
      }
    ]
  }
];
