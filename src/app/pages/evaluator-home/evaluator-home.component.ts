import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { EvaluatorService } from '../../services/evaluator.service';
import { Subscription, forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Component({
  selector: 'app-evaluator-home',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './evaluator-home.component.html',
})
export class EvaluatorHomeComponent implements OnInit, OnDestroy {
  userName: string = '';
  currentYear: number = new Date().getFullYear();
  userRole: string = 'Évaluateur';
  isPreselection: boolean = false;
  isSelection: boolean = false;
  isLoading: boolean = true;
  private subscriptions: Subscription = new Subscription();

  constructor(private evaluatorService: EvaluatorService) {}

  ngOnInit() {
    this.loadUserInfoAndRoles();
  }

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }

  private loadUserInfoAndRoles() {
    // Récupérer le nom de l'utilisateur depuis localStorage
    this.userName = this.getUserNameFromStorage();

    // Vérifier les rôles de l'évaluateur
    this.checkEvaluatorRoles();
  }

  private getUserNameFromStorage(): string {
    try {
      const userData = localStorage.getItem('user');
      if (userData) {
        const user = JSON.parse(userData);
        return user?.name || user?.email || 'Évaluateur';
      }
    } catch (error) {
      console.error('Error parsing user data from localStorage:', error);
    }
    return 'Évaluateur';
  }

  private checkEvaluatorRoles() {
    this.isLoading = true;

    // Vérifier les deux rôles en parallèle (sans periodId pour vérifier globalement)
    const checkPreselection$ = this.evaluatorService.isPreselectorEvaluator(null).pipe(
      catchError(() => of({ isPreselectorEvaluator: false }))
    );

    const checkSelection$ = this.evaluatorService.isSelectorEvaluator(null).pipe(
      catchError(() => of({ isSelectorEvaluator: false }))
    );

    const subscription = forkJoin({
      preselection: checkPreselection$,
      selection: checkSelection$
    }).subscribe({
      next: (results) => {
        this.isPreselection = results.preselection.isPreselectorEvaluator;
        this.isSelection = results.selection.isSelectorEvaluator;

        this.updateUserRole();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error checking evaluator roles:', error);
        this.isLoading = false;
      }
    });

    this.subscriptions.add(subscription);
  }

  private updateUserRole() {
    if (this.isPreselection && this.isSelection) {
      this.userRole = 'Évaluateur (Présélection & Sélection)';
    } else if (this.isPreselection) {
      this.userRole = 'Évaluateur de Présélection';
    } else if (this.isSelection) {
      this.userRole = 'Évaluateur de Sélection';
    } else {
      this.userRole = 'Utilisateur';
    }
  }
}
