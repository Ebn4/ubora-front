import { NgFor } from '@angular/common';
import { Component, inject, Input, SimpleChanges } from '@angular/core';
import { BaseListWidget } from '../../widgets/base-list-widget';
import { Period } from '../../models/period';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CandidacyService } from '../../services/candidacy.service';
import { FormsModule } from '@angular/forms';
import { CandidaciesDispatchEvaluator } from '../../models/candidacies-dispatch-evaluator';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';

@Component({
  selector: 'app-preselection',
  imports: [NgFor, FormsModule, RouterLink],
  templateUrl: './preselection.component.html',
})
export class PreselectionComponent extends BaseListWidget {
  showModal = false;

  candidacies: CandidaciesDispatchEvaluator[] = [];
  @Input() period?: Period;
  evaluateurId: number = 4;
  periodId: number = 4;
  ville: string = '';
  route: ActivatedRoute = inject(ActivatedRoute);
  candidacyService: CandidacyService = inject(CandidacyService);
  totalCandidats: number = 0;
  candidatsEvalues: number = 0;
  constructor() {
    super();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['period']) {
      const current = changes['period'].currentValue;
      this.period = current;
      if (current) this.loadData();
    }
  }

  ngOnInit(): void {
    this.loadData();
  }

  override loadData() {
    this.candidacyService
      .CandidaciesDispatchEvaluator(
        this.currentPage,
        this.search,
        this.ville,
        this.evaluateurId,
        this.per_page
      )
      .subscribe({
        next: (response) => {
          this.candidacies = response.data;
          this.currentPage = response.current_page;
          this.lastPage = response.last_page;

          if (this.candidacies.length > 0) {
            this.totalCandidats = this.candidacies[0].totalCandidats;
            this.candidatsEvalues = this.candidacies[0].candidaciesPreselection;
          } else {
            this.totalCandidats = 0;
            this.candidatsEvalues = 0;
          }
        },
        error: (error) => {
          console.error('Error loading candidacies:', error);
        },
      });
  }
}
