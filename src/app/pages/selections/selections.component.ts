import {Component, computed, inject, OnChanges, signal} from '@angular/core';
import {single} from 'rxjs';
import {Candidacy} from '../../models/candidacy';
import {CandidacyService} from '../../services/candidacy.service';
import {NgClass, NgForOf, NgIf} from '@angular/common';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {BaseListWidget} from '../../widgets/base-list-widget';
import {RouterLink} from '@angular/router';
import {MatIcon} from '@angular/material/icon';

@Component({
  selector: 'app-selections',
  imports: [
    NgForOf,
    ReactiveFormsModule,
    FormsModule,
    RouterLink,
    MatIcon,
    NgClass
  ],
  templateUrl: './selections.component.html',
  styles: ``,
  standalone: true
})
export class SelectionsComponent extends BaseListWidget {

  candidateService = inject(CandidacyService)

  candidates = signal<Candidacy[]>([])

  totalCandidates = signal(0);
  evaluatedCandidates = signal(0);
  pendingCandidates = computed(() => this.totalCandidates() - this.evaluatedCandidates());

  protected readonly Math = Math;

  ngOnInit() {
    this.loadData()
  }

  override loadData() {
    super.loadData();
    return this.candidateService
      .getPreselectedCandidates(
        this.currentPage,
        this.search,
        this.per_page,
      )
      .subscribe({
        next: value => {
          this.candidates.set(value.data)
          console.log(value.data)
          this.currentPage = value.meta.current_page;
          this.lastPage = value.meta.last_page;
          this.totalCandidates.set(value.meta?.total || value.data.length);
          console.log("valeur recue", this.candidates().length)
          // Charge les stats globales
          this.loadSelectionStats();
        },
        error: err => {
          console.error(err)
        }
      })
  }

  loadSelectionStats() {
    // Récupère periodId — soit depuis une propriété, soit depuis la première candidature
    const periodId = this.candidates()?.[0]?.period_id;

    if (!periodId) return;

    this.candidateService.getAllSelectedStats(periodId).subscribe({
      next: (stats) => {
        this.totalCandidates.set(stats.total);
        this.evaluatedCandidates.set(stats.evaluated);
      },
      error: (err) => {
        console.error('Erreur chargement stats:', err);
      }
    });
  }


}
