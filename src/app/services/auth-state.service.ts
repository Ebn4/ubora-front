import { Injectable, signal } from '@angular/core';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { EvaluatorService } from './evaluator.service';
import { UserService } from './user.service';

@Injectable({
  providedIn: 'root'
})
export class AuthStateService {

  // Cache par période
  private roleCache = new Map<number, {
    isSelector: boolean;
    isPreselector: boolean;
    timestamp: number;
  }>();

  // Signals exposés au reste de l'app
  hasAdminRole = signal(false);
  isSelectorEvaluator = signal(false);
  isPreselectorEvaluator = signal(false);

  // Signal pour l'état de chargement
  isLoading = signal(false);

  // Durée de vie du cache (30 minutes)
  private readonly CACHE_DURATION = 30 * 60 * 1000;

  constructor(
    private evaluatorService: EvaluatorService,
    private userService: UserService
  ) {
    // Charger le rôle admin au démarrage
    this.loadAdminRole();
  }

  /**
   * Charger rôle admin (une seule fois)
   */
  loadAdminRole() {
      this.userService.hasAdminRole().pipe(
        catchError(err => {
          console.error('Erreur chargement rôle admin', err);
          return of({ hasAdminRole: false });
        })
      ).subscribe({
        next: res => {
          this.hasAdminRole.set(res.hasAdminRole);
        }
      });
    }

    /**
     * Vérifier si le cache est valide pour une période
     */
    private isCacheValid(periodId: number): boolean {
      const cached = this.roleCache.get(periodId);
      if (!cached) return false;

      const age = Date.now() - cached.timestamp;
      return age < this.CACHE_DURATION;
    }

    /**
     * Charger rôles dépendants de la période
     */
    loadRolesForPeriod(periodId: number | null) {
    this.isLoading.set(true);

    // Faire l'appel API même avec periodId null
    forkJoin({
      selector: this.evaluatorService.isSelectorEvaluator(periodId).pipe(
        catchError(err => {
          console.warn(`Erreur selector`, err);
          return of({ isSelectorEvaluator: false });
        })
      ),
      preselector: this.evaluatorService.isPreselectorEvaluator(periodId).pipe(
        catchError(err => {
          console.warn(`Erreur preselector`, err);
          return of({ isPreselectorEvaluator: false });
        })
      ),
    }).subscribe({
      next: res => {
        this.isSelectorEvaluator.set(res.selector.isSelectorEvaluator);
        this.isPreselectorEvaluator.set(res.preselector.isPreselectorEvaluator);
        this.isLoading.set(false);
      },
      error: err => {
        this.isSelectorEvaluator.set(false);
        this.isPreselectorEvaluator.set(false);
        this.isLoading.set(false);
      }
    });
  }

  /**
   * Forcer le rechargement (utile après changement)
   */
  reloadPeriodRoles(periodId: number | null) {
    if (periodId) {
      this.roleCache.delete(periodId); // Invalider le cache
      this.loadRolesForPeriod(periodId);
    }
  }

  /**
   * Reset complet (au logout)
   */
  reset(): void {
    this.hasAdminRole.set(false);
    this.isSelectorEvaluator.set(false);
    this.isPreselectorEvaluator.set(false);
    this.roleCache.clear();
    this.isLoading.set(false);
  }
}