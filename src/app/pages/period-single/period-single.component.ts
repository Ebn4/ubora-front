import { Period } from './../../models/period';
import { Component, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { PeriodService } from '../../services/period.service';
import { NgClass, NgIf } from '@angular/common';

@Component({
  selector: 'app-period-single',
  imports: [RouterLink, NgIf, NgClass],
  templateUrl: './period-single.component.html',
})
export class PeriodSingleComponent {
  periodService:PeriodService = inject(PeriodService);
  route:ActivatedRoute = inject(ActivatedRoute)
  period!:Period | undefined
  periodId = -1
  showModal = false;
  criteria = true;
  candidacy = false;
  evaluateur = false;
  lecteur = false;


  ngOnInit(){
    this.periodId = Number(this.route.snapshot.paramMap.get('id'))
    this.periodService.getOnePeriod(this.periodId)
      .then((period) => {
        this.period = period
      })
  }

  criteriaAction(){
    this.candidacy = false
    this.criteria = true
    this.evaluateur = false;
    this.lecteur = false;
  }
  candidacyAction(){
    this.candidacy = true
    this.criteria = false
    this.evaluateur = false;
    this.lecteur = false;
  }
  evaluateurAction(){
    this.candidacy = false
    this.criteria = false
    this.evaluateur = true;
    this.lecteur = false;
  }
  lecteurAction(){
    this.candidacy = false
    this.criteria = false
    this.evaluateur = false;
    this.lecteur = true;
  }

  openModal() {
    this.showModal = true;
  }

  closeModal() {
    this.showModal = false;
  }
}
