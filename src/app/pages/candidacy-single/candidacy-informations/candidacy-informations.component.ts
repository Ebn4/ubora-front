import { ActivatedRoute, Router } from '@angular/router';
import { Component, inject } from '@angular/core';
import { BaseListWidget } from '../../../widgets/base-list-widget';
import { Candidacy } from '../../../models/candidacy';
import { CandidacyService } from '../../../services/candidacy.service';
import { NgFor, NgIf } from '@angular/common';

@Component({
  selector: 'app-candidacy-informations',
  imports: [],
  templateUrl: './candidacy-informations.component.html',
})
export class CandidacyInformationsComponent extends BaseListWidget {
  candidacyId!: number;
  candidacy?: Candidacy;
  candidacyService: CandidacyService = inject(CandidacyService);
  route: ActivatedRoute = inject(ActivatedRoute);

  constructor() {
    super();
  }

  ngOnInit(): void {
    this.loadData();
  }

  override loadData() {
    this.candidacyId = Number(this.route.snapshot.paramMap.get('id'));
     this.candidacyService
      .getOneCandidacy(this.candidacyId)
      .subscribe({
        next: (response) => {
          this.candidacy = response.data;
        },
        error: (error) => {
          console.error('Error loading candidacies:', error);
        }
      });
  }
}
