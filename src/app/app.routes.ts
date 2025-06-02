import { Routes } from '@angular/router';
import { PeriodComponent } from './pages/period/period.component';
import { PeriodSingleComponent } from './pages/period-single/period-single.component';
import { ImportComponent } from './pages/import/import.component';
import { CandidaciesComponent } from './pages/candidacies/candidacies.component';
import { CriteriaComponent } from './pages/criteria/criteria.component';
import { SidebarComponent } from './pages/layout/sidebar/sidebar.component';
import { CandidacySingleComponent } from './pages/candidacy-single/candidacy-single.component';

export const routes: Routes = [
  {
    path: '',
    component: SidebarComponent,
    children: [
      {path: '', redirectTo: 'criteria', pathMatch:'full'},
      {path: 'period', component:PeriodComponent},
      {path: 'criteria', component:CriteriaComponent},
      {path: 'period-single/:id', component:PeriodSingleComponent},
      {path: 'import', component:ImportComponent},
      {path: 'candidacy', component:CandidaciesComponent},
      {path: 'candidacy-single/:id', component: CandidacySingleComponent}
    ]
  }
];
