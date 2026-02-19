import { NgClass } from '@angular/common';
import { Component, inject, signal, OnDestroy, OnInit, computed } from '@angular/core';
import { NavigationEnd, Router, RouterLink } from '@angular/router';
import { filter, Subscription, of, timer } from 'rxjs';
import { catchError, timeout } from 'rxjs/operators';
import { FormsModule } from '@angular/forms';

import { AuthServices } from '../../../services/auth.service';
import { LocalStorageService } from '../../../services/local-storage.service';
import { UserService } from '../../../services/user.service';
import { EvaluatorService } from '../../../services/evaluator.service';
import { RoleChangeService } from '../../../services/role-change.service';
import { ListeningChangeService } from '../../../services/listening-change.service';

import { User } from '../../../models/user.model';
import { AuthStateService } from '../../../services/auth-state.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterLink, NgClass, FormsModule],
  templateUrl: './sidebar.component.html',
})
export class SidebarComponent implements OnInit, OnDestroy {
  private router = inject(Router);
  private authService = inject(AuthServices);
  private userService = inject(UserService);
  private evaluatorService = inject(EvaluatorService);
  private localStorageService = inject(LocalStorageService);
  private roleChangeService = inject(RoleChangeService);
  private listeningChangeService = inject(ListeningChangeService);
  authState = inject(AuthStateService);

  user = signal<User | null>(null);
  userRoleFromStorage = signal<string | null>(null);

  currentPeriodId = signal<number | null>(null);
  availablePeriods = signal<any[]>([]);
  selectedPeriodId = signal<number | null>(null);

  // Active tab
  activeTab:
    | 'home'
    | 'allcandidacy'
    | 'import'
    | 'presection'
    | 'period'
    | 'criteria'
    | 'users'
    | 'evaluator-candidacies'
    | 'selections'
    | 'preselection-admin' = 'period';

  private subscriptions = new Subscription();

  ngOnInit(): void {

    // Initialiser le rôle depuis le stockage (instantané)
    this.userRoleFromStorage.set(this.getUserRoleFromStorage());

    // Attendre un peu pour laisser la navigation se stabiliser
    timer(200).subscribe(() => {
      this.initializeSidebar();
    });

    // Écouter la navigation
    this.setupNavigationListener();

    // Écouter les changements de rôle
    this.setupRoleChangeListener();

    // Écouter la fermeture de modals
    this.setupModalCloseListener();
  }

  private initializeSidebar(): void {

    this.updateActiveTab(this.router.url);

    // Récupérer l'utilisateur (priorité au cache, puis API)
    this.getCurrentUser(() => {
      // Trouver ou déterminer le periodId
      this.findAndSetPeriodId(() => {
        this.authState.loadRolesForPeriod(this.currentPeriodId());
      });
    });
  }

  private setupNavigationListener(): void {
    this.subscriptions.add(
      this.router.events
        .pipe(filter(event => event instanceof NavigationEnd))
        .subscribe((event: NavigationEnd) => {
          const url = event.urlAfterRedirects;
          this.updateActiveTab(url);

          // Extraire periodId de la nouvelle URL si présent
          const urlPeriodId = this.extractPeriodIdFromUrl(url);
          if (urlPeriodId && urlPeriodId !== this.currentPeriodId()) {
            this.currentPeriodId.set(urlPeriodId);
            this.selectedPeriodId.set(urlPeriodId);
            this.storePeriodId(urlPeriodId);

            timer(100).subscribe(() => {
              this.authState.loadRolesForPeriod(urlPeriodId);
            });
          }
        })
    );
  }

  getUserRoleFromStorage(): string | null {
    try {
      const userData = localStorage.getItem('user');
      if (userData) {
        const user = JSON.parse(userData);
        return user.data?.role || user.role || null;
      }
      return null;
    } catch (error) {
      console.error('Erreur lors de la lecture du localStorage:', error);
      return null;
    }
  }

  private setupRoleChangeListener(): void {
    this.subscriptions.add(
      this.roleChangeService.roleChanged$.subscribe(changed => {
        if (changed) {
          this.authState.reloadPeriodRoles(this.currentPeriodId());
          this.roleChangeService.resetNotification();
        }
      })
    );
  }

  private setupModalCloseListener(): void {
    this.subscriptions.add(
      this.listeningChangeService.modalClosed$.subscribe(closed => {
        if (closed) {
          this.authState.reloadPeriodRoles(this.currentPeriodId());
          this.listeningChangeService.resetNotification();
        }
      })
    );
  }

  private getCurrentUser(callback?: () => void): void {

    const cachedUser = this.getCachedUser();
    if (cachedUser) {
      this.user.set(cachedUser);
      this.userRoleFromStorage.set(cachedUser.role);

      this.authState.loadAdminRole();

      if (callback) callback();
      return;
    }

    this.loadUserFromAPI(callback);
  }

  private getCachedUser(): User | null {
    try {
      const userStr = this.localStorageService.getData('user');
      if (!userStr) return null;

      const user = JSON.parse(userStr) as User;
      const token = this.localStorageService.getData('token');
      if (!token) {
        return null;
      }

      return user;
    } catch (error) {
      return null;
    }
  }

  private loadUserFromAPI(callback?: () => void): void {
    this.userService.getUser().pipe(
      timeout(5000),
      catchError(() => {
        return of(null);
      })
    ).subscribe({
      next: (user) => {
        if (user) {
          this.user.set(user);
          this.userRoleFromStorage.set(user.role);

          this.authState.loadAdminRole();

          this.localStorageService.saveData('user', JSON.stringify(user));
        } else {
          this.user.set(null);
          this.userRoleFromStorage.set(null);
        }

        if (callback) callback();
      },
      error: (err) => {
        this.user.set(null);
        this.userRoleFromStorage.set(null);
        if (callback) callback();
      }
    });
  }

  private findAndSetPeriodId(callback: () => void): void {

    // 1. Extraire de l'URL
    const urlPeriodId = this.extractPeriodIdFromUrl(this.router.url);
    if (urlPeriodId) {
      this.setPeriodId(urlPeriodId);
      callback();
      return;
    }

    // 2. Chercher dans localStorage
    const storedPeriodId = this.localStorageService.getData('currentPeriodId');
    if (storedPeriodId) {
      const periodId = Number(storedPeriodId);
      this.setPeriodId(periodId);
      callback();
      return;
    }

    // 3. Chercher dans les données utilisateur
    const userData = this.localStorageService.getData('user');
    if (userData) {
      try {
        const user = JSON.parse(userData);
        if (user.lastPeriodId) {
          this.setPeriodId(user.lastPeriodId);
          callback();
          return;
        }
      } catch (e) {
        console.error('Erreur parsing user data:', e);
      }
    }

    // 4. Si admin, charger la dernière période
    if (this.user()?.role === 'ADMIN' || this.authState.hasAdminRole()) {
      this.loadLatestPeriod(callback);
      return;
    }

    // 5. Pas de periodId trouvé
    this.currentPeriodId.set(null);
    this.selectedPeriodId.set(null);
    callback();
  }

  private setPeriodId(periodId: number): void {
    this.currentPeriodId.set(periodId);
    this.selectedPeriodId.set(periodId);
    this.storePeriodId(periodId);
  }

  private storePeriodId(periodId: number): void {
    this.localStorageService.saveData('currentPeriodId', periodId.toString());

    const userData = this.localStorageService.getData('user');
    if (userData) {
      try {
        const user = JSON.parse(userData);
        user.lastPeriodId = periodId;
        this.localStorageService.saveData('user', JSON.stringify(user));
      } catch (e) {
        console.error('Erreur mise à jour user data:', e);
      }
    }
  }

  private loadLatestPeriod(callback: () => void): void {

    this.evaluatorService.getEvaluatorPeriods().pipe(
      timeout(5000),
      catchError(() => {
        console.warn('Timeout chargement périodes');
        return of({ success: false, periods: [], count: 0 });
      })
    ).subscribe({
      next: (response) => {
        if (response.success && response.periods.length > 0) {
          const latestPeriod = response.periods[0];
          this.setPeriodId(latestPeriod.id);
          this.availablePeriods.set(response.periods);
        } else {
          this.currentPeriodId.set(null);
          this.selectedPeriodId.set(null);
        }
        callback();
      },
      error: (err) => {
        console.error('Erreur chargement périodes:', err);
        this.currentPeriodId.set(null);
        this.selectedPeriodId.set(null);
        callback();
      }
    });
  }

  private extractPeriodIdFromUrl(url: string): number | null {
    const match = url.match(/period\/(\d+)/);
    return match ? Number(match[1]) : null;
  }

  onPeriodChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    const periodId = Number(select.value);

    if (periodId && periodId !== this.currentPeriodId()) {
      this.setPeriodId(periodId);

      this.authState.loadRolesForPeriod(periodId);

      if (this.router.url.includes('/period/')) {
        this.router.navigate([`/period/${periodId}`]);
      }
    }
  }

  getPeriodName(periodId: number | null): string {
    if (!periodId) return 'Sélectionner une période';
    const period = this.availablePeriods().find(p => p.id === periodId);
    return period ? `${period.year}${period.name ? ' - ' + period.name : ''}` : `Période #${periodId}`;
  }

  setActiveTab(tab: typeof this.activeTab): void {
    this.activeTab = tab;
  }

  private updateActiveTab(url: string): void {
    if (url === '/' || url === '') this.setActiveTab('home');
    else if (url.includes('allcandidacy')) this.setActiveTab('allcandidacy');
    else if (url.includes('import')) this.setActiveTab('import');
    else if (url.includes('presection')) this.setActiveTab('presection');
    else if (url.includes('criteria')) this.setActiveTab('criteria');
    else if (url.includes('users')) this.setActiveTab('users');
    else if (url.includes('evaluator-candidacies')) this.setActiveTab('evaluator-candidacies');
    else if (url.includes('preselection-admin')) this.setActiveTab('preselection-admin');
    else if (url.includes('selections')) this.setActiveTab('selections');
    else this.setActiveTab('period');
  }

  isEvaluatorUser = computed(() => this.user()?.role === 'EVALUATOR');

  logout(): void {
    this.authService.logout().subscribe({
      next: () => {
        this.authState.reset();

        this.localStorageService.removeData('token');
        this.localStorageService.removeData('user');
        this.localStorageService.removeData('currentPeriodId');
        this.router.navigate(['/login']);
      },
      error: (err) => {
        console.error('Erreur lors de la déconnexion:', err);
        this.router.navigate(['/login']);
      }
    });
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
}