import { Period } from './../../models/period';
import { Component, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { PeriodService } from '../../services/period.service';
import { NgClass, NgIf } from '@angular/common';
import { PeriodCriteriaComponent } from './period-criteria/period-criteria.component';
import { PeriodCandidacyComponent } from './period-candidacy/period-candidacy.component';
import { PeriodEvaluateurComponent } from './period-evaluateur/period-evaluateur.component';
import { PeriodLecteurComponent } from './period-lecteur/period-lecteur.component';

@Component({
  selector: 'app-period-single',
  imports: [
    RouterLink,
    NgIf,
    NgClass,
    PeriodCriteriaComponent,
    PeriodCandidacyComponent,
    PeriodEvaluateurComponent,
    PeriodLecteurComponent,
  ],
  templateUrl: './period-single.component.html',
})
export class PeriodSingleComponent {
  periodService: PeriodService = inject(PeriodService);
  route: ActivatedRoute = inject(ActivatedRoute);
  period!: Period | undefined;
  periodId = -1;
  showModal = false;
  activeTab: 'criteria' | 'candidacy' | 'evaluateur' | 'lecteur' = 'criteria';

  ngOnInit() {
    this.periodId = Number(this.route.snapshot.paramMap.get('id'));
    this.periodService.getOnePeriod(this.periodId).then((period) => {
      this.period = period;
    });
  }

  setActiveTab(tab: 'criteria' | 'candidacy' | 'evaluateur' | 'lecteur') {
    this.activeTab = tab;
  }
  openModal() {}

  closeModal() {
    this.showModal = false;
  }
}
