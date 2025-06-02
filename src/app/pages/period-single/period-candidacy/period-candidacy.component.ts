import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgFor } from '@angular/common';
import { Candidacy } from '../../../models/candidacy';
import { CandidacyService } from '../../../services/candidacy.service';
import { ActivatedRoute } from '@angular/router';
import { BaseListWidget } from '../../../widgets/base-list-widget';


@Component({
  selector: 'app-period-candidacy',
  imports: [FormsModule, NgFor],
  templateUrl: './period-candidacy.component.html',
})
export class PeriodCandidacyComponent extends BaseListWidget{
  candidacies: Candidacy[] = [];
  periodId = -1;
  ville: string = '';
  route:ActivatedRoute = inject(ActivatedRoute);
  candidacyService: CandidacyService = inject(CandidacyService);
  constructor() {
    super();
  }

  ngOnInit(): void {
    this.periodId = Number(this.route.snapshot.paramMap.get('id'));
    this.loadData();
  }

  override loadData() {
    this.candidacyService.getCandidacies(this.currentPage, this.search, this.ville, this.periodId, this.per_page).then(response => {
      this.candidacies = response.data;
      console.log("Les candidatures de la periode", response.data);
      this.currentPage = response.current_page;
      this.lastPage = response.last_page;
    });
  }
}
