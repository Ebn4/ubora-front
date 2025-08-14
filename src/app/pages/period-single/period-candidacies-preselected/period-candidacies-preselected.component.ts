import {Component, inject, Input, signal, SimpleChanges} from '@angular/core';
import {BaseListWidget} from '../../../widgets/base-list-widget';
import {Candidacy} from '../../../models/candidacy';
import {Period} from '../../../models/period';
import {CandidacyService} from '../../../services/candidacy.service';
import {NgForOf} from '@angular/common';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {RouterLink} from '@angular/router';
import {MatSnackBar} from '@angular/material/snack-bar';

@Component({
  selector: 'app-period-candidacies-preselected',
  imports: [
    NgForOf,
    ReactiveFormsModule,
    FormsModule,
    RouterLink
  ],
  templateUrl: './period-candidacies-preselected.component.html',
  styles: ``
})
export class PeriodCandidaciesPreselectedComponent extends BaseListWidget {

  @Input() period?: Period;
  candidacies = signal<Candidacy[]>([])
  isLoading = signal(false)

  candidacyService: CandidacyService = inject(CandidacyService);
  snackbar = inject(MatSnackBar)

  ngOnInit() {
    this.loadData()
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['period']) {
      const current = changes['period'].currentValue;
      this.period = current;
      if (current) {
        this.loadData();
      }
    }
  }

  override loadData() {
    this.isLoading.set(true)
    this.candidacyService
      .getPreselectedCandidates(
        this.currentPage,
        this.search,
        this.per_page,
        this.period?.id ?? 0
      )
      .subscribe({
        next: (response) => {
          this.candidacies.set(response.data);
          this.currentPage = response.meta.current_page;
          this.lastPage = response.meta.last_page;
          this.isLoading.set(false)
        },
        error: (error) => {
          console.error('Error loading candidacies:', error);
          this.snackbar.open('Erreur lors de la recuperation des candidats', 'Actualiser', {
            duration: 3000,
          })
          this.isLoading.set(false)
        }
      });
  }
}
