import { PreselectionService } from './../../services/preselection.service';
import { NgFor, NgIf } from '@angular/common';
import { Component, inject, Input, SimpleChanges } from '@angular/core';
import { BaseListWidget } from '../../widgets/base-list-widget';
import { Period } from '../../models/period';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CandidacyService } from '../../services/candidacy.service';
import { FormsModule } from '@angular/forms';
import { CandidaciesDispatchEvaluator } from '../../models/candidacies-dispatch-evaluator';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { UserService } from '../../services/user.service';
import { User } from '../../models/user.model';
import { PeriodService } from '../../services/period.service';

@Component({
  selector: 'app-preselection',
  imports: [NgFor, FormsModule, RouterLink, NgIf],
  templateUrl: './preselection.component.html',
})
export class PreselectionComponent extends BaseListWidget {
  showModal = false;

  candidacies: CandidaciesDispatchEvaluator[] = [];
  periods: Period[] = [];
  @Input() period?: Period;
  evaluateurId!: number;
  periodId!: number;
  user!: User
  ville: string = '';
  route: ActivatedRoute = inject(ActivatedRoute);
  candidacyService: CandidacyService = inject(CandidacyService);
  periodService: PeriodService = inject(PeriodService);
  userService: UserService = inject(UserService);
  totalCandidats: number = 0;
  candidatsEvalues: number = 0;
  constructor(
    private preselectionService: PreselectionService) {
    super();
  }

  ngOnInit(): void {
    this.getUser()
    this.periodService.getYearsPeriod().subscribe({
      next: (periods) => {
        this.periods = periods;
        if (!this.periodId && this.periods.length > 0) {
          this.periodId = this.periods[0].id;
          this.loadData()
        }
      },
      error: (error) => {
        console.error('Error fetching periods:', error);
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

  getUser() {
    this.userService.getUser().subscribe({
      next: (user) => {
        this.user = user;
        this.evaluateurId = this.user.id;
        this.loadData();
      },
      error: (error) => {
        console.error("Erreur lors de la récupération de l'utilisateur :", error);
      }
    });
  }

  goToCandidacyDetails(candidacie: any) {
    this.preselectionService.setCandidacy(candidacie);
  }

  onPeriodSelect() {
    if (this.periodId) {
      this.loadData();
    }
  }

  override loadData() {
    if (!this.periodId) {
      return;
    }

    this.candidacyService
      .CandidaciesDispatchEvaluator(
        this.periodId,
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
