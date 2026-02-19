import { Component, computed, inject, Input, signal, SimpleChanges } from '@angular/core';
import { Candidacy } from '../../models/candidacy';
import { CandidacyService } from '../../services/candidacy.service';
import { NgClass, NgForOf, NgIf } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { BaseListWidget } from '../../widgets/base-list-widget';
import { Router, RouterLink } from '@angular/router';
import { MatIcon } from '@angular/material/icon';
import { SelectionService } from '../../services/selection.service';
import { PeriodService } from '../../services/period.service';
import { UserService } from '../../services/user.service';
import { User } from '../../models/user.model';
import { Period } from '../../models/period';

@Component({
  selector: 'app-selections',
  imports: [
    NgForOf,
    ReactiveFormsModule,
    FormsModule,
    RouterLink,
    MatIcon,
    NgClass,
    NgIf
  ],
  templateUrl: './selections.component.html',
  styles: ``,
  standalone: true
})
export class SelectionsComponent extends BaseListWidget {

  @Input() period?: Period;
  candidateService = inject(CandidacyService);
  selectionService = inject(SelectionService);
  router = inject(Router);

  allCandidates = signal<Candidacy[]>([]);
  candidates = signal<Candidacy[]>([]);
  periods: Period[] = [];

  // Ajout de la propriété isLoading
  isLoading: boolean = true;

  totalCandidates = signal(0);
  evaluatedCandidates = signal(0);
  pendingCandidates = computed(() => this.totalCandidates() - this.evaluatedCandidates());
  periodId!: number;
  periodService: PeriodService = inject(PeriodService);
  userService: UserService = inject(UserService);
  user!: User
  evaluateurId!: number;

  protected readonly Math = Math;

  ngOnInit() {
    this.periodService.getYearsPeriod().subscribe({
      next: (periods) => {
        this.periods = periods;
        if (!this.periodId && this.periods.length > 0) {
          this.periodId = this.periods[0].id;
          this.getUser()
        }
      },
      error: (error) => {
        console.error('Error fetching periods:', error);
        this.isLoading = false;
      }
    });
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['period']) {
      const current = changes['period'].currentValue;
      this.period = current;
      if (current) this.loadData();
    }
  }

  onPeriodSelect() {
    if (this.periodId) {
      this.loadData();
      this.loadAllCandidates();
    }
  }

  override loadData() {
    this.isLoading = true;
    return this.candidateService
      .getPreselectedCandidates(
        this.currentPage,
        this.search,
        this.per_page,
        this.periodId
      )
      .subscribe({
        next: value => {
          this.candidates.set(value.data);
          this.currentPage = value.meta.current_page;
          this.lastPage = value.meta.last_page;
          this.totalCandidates.set(value.meta?.total || value.data.length);

          // Charger les stats globales
          this.loadSelectionStats();
          this.isLoading = false;
        },
        error: err => {
          console.error(err);
          this.isLoading = false;
        }
      });
  }

  goToCandidateDetail(candidate: Candidacy) {

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
    this.candidateService.getPreselectedCandidates(1, '', 'all', this.periodId).subscribe({
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

    this.candidateService.getAllSelectedStats(this.periodId).subscribe({
      next: (stats) => {
        this.totalCandidates.set(stats.total);
        this.evaluatedCandidates.set(stats.evaluated);
      },
      error: (err) => {
        console.error('Erreur chargement stats:', err);
      }
    });
  }

  getUser() {
    this.userService.getUser().subscribe({
      next: (user) => {
        this.user = user;
        this.evaluateurId = this.user.id;
        this.loadData();
        this.loadAllCandidates();
      },
      error: (error) => {
        console.error("Erreur lors de la récupération de l'utilisateur :", error);
        this.isLoading = false;
      }
    });
  }
}