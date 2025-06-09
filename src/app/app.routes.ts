import { Routes } from '@angular/router';
import { PeriodComponent } from './pages/period/period.component';
import { PeriodSingleComponent } from './pages/period-single/period-single.component';
import { SidebarComponent } from './pages/layout/sidebar/sidebar.component';

export const routes: Routes = [
  {
    path: '',
    component: SidebarComponent,
    children: [
      {path: '', redirectTo: 'period', pathMatch:'full'},
      {path: 'period', component:PeriodComponent},
      {path: 'period-single/:id', component:PeriodSingleComponent},
    ]
  }
];
