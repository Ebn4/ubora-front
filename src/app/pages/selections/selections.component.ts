import { Component, computed, inject, signal } from '@angular/core';
import { Candidacy } from '../../models/candidacy';
import { CandidacyService } from '../../services/candidacy.service';
import { NgClass, NgForOf, NgIf } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { BaseListWidget } from '../../widgets/base-list-widget';
import { Router, RouterLink } from '@angular/router';
import { MatIcon } from '@angular/material/icon';
import { SelectionService } from '../../services/selection.service';

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

  candidateService = inject(CandidacyService);
  selectionService = inject(SelectionService);
  router = inject(Router);

  allCandidates = signal<Candidacy[]>([]);
  candidates = signal<Candidacy[]>([]);

  totalCandidates = signal(0);
  evaluatedCandidates = signal(0);
  pendingCandidates = computed(() => this.totalCandidates() - this.evaluatedCandidates());

  protected readonly Math = Math;

  ngOnInit() {
    this.loadData();
    this.loadAllCandidates();
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
          this.candidates.set(value.data);
          this.currentPage = value.meta.current_page;
          this.lastPage = value.meta.last_page;
          this.totalCandidates.set(value.meta?.total || value.data.length);

          // Charger les stats globales
          this.loadSelectionStats();
        },
        error: err => {
          console.error(err);
        }
      });
  }

  goToCandidateDetail(candidate: Candidacy) {
    console.log("Navigation vers détail du candidat:", candidate.id, candidate.etn_nom);

    // Trouver l'index dans la liste complète
    const allCandidates = this.allCandidates();
    let index = allCandidates.findIndex(c => c.id === candidate.id);

    if (index === -1) {
      console.warn('Candidat non trouvé dans la liste complète');
      // Fallback temporaire sur la liste paginée
      const paginatedCandidates = this.candidates();
      index = paginatedCandidates.findIndex(c => c.id === candidate.id);

      if (index !== -1) {
        this.selectionService.setCandidate({
          current: candidate,
          all: paginatedCandidates,
          currentIndex: index
        });
      }
    } else {
      // Mode navigation fluide avec liste complète
      console.log('Navigation fluide avec index:', index);
      this.selectionService.setCandidate({
        current: candidate,
        all: allCandidates,
        currentIndex: index
      });
    }

    // Naviguer vers le détail
    this.router.navigate(['/selections/candidates', candidate.id]);
  }

  loadAllCandidates() {
    // Charger TOUS les candidats (sans pagination) pour la navigation fluide
    this.candidateService.getPreselectedCandidates(1, '', 'all').subscribe({
      next: (response) => {
        let candidates: Candidacy[] = [];

        // Gérer les différents formats de réponse
        if (Array.isArray(response)) {
          candidates = response;
        } else if (response?.data && Array.isArray(response.data)) {
          candidates = response.data;
        } else {
          console.error('Format réponse inattendu dans loadAllCandidates:', response);
          return;
        }

        this.allCandidates.set(candidates);
        console.log('Liste complète chargée (sélection):', candidates.length, 'candidats');
      },
      error: (err) => {
        console.error('Erreur chargement liste complète (sélection):', err);
      }
    });
  }

  loadSelectionStats() {
    // Récupérer periodId depuis la première candidature
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
