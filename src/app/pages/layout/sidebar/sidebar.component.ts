import { NgClass } from '@angular/common';
import { Component, inject, signal, OnDestroy, OnInit } from '@angular/core';
import { NavigationEnd, Router, RouterLink } from '@angular/router';
import { filter, Subscription } from 'rxjs';

import { AuthServices } from '../../../services/auth.service';
import { LocalStorageService } from '../../../services/local-storage.service';
import { UserService } from '../../../services/user.service';
import { EvaluatorService } from '../../../services/evaluator.service';
import { RoleChangeService } from '../../../services/role-change.service';
import { ListeningChangeService } from '../../../services/listening-change.service';

import { User } from '../../../models/user.model';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterLink, NgClass],
  templateUrl: './sidebar.component.html',
})
export class SidebarComponent implements OnInit, OnDestroy {
  router = inject(Router);
  authService = inject(AuthServices);
  userService = inject(UserService);
  evaluatorService = inject(EvaluatorService);
  localStorageService = inject(LocalStorageService);
  roleChangeService = inject(RoleChangeService);
  listeningChangeService = inject(ListeningChangeService);

  hasAdminRole = signal(false);
  isSelectorEvaluator = signal(false);
  isPreselectorEvaluator = signal(false);
  user = signal<User | null>(null);
  userRoleFromStorage = signal<string | null>(null);

  currentPeriodId = signal<number | null>(null);

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
    // Initial
    this.updateActiveTab(this.router.url);
    this.extractPeriodIdFromUrl(this.router.url);
    this.checkRoles(this.currentPeriodId());
    this.userRoleFromStorage.set(this.getUserFromLocalStorage())
    this.getCurrentUser();

    // Navigation
    this.subscriptions.add(
      this.router.events
        .pipe(filter(event => event instanceof NavigationEnd))
        .subscribe((event: NavigationEnd) => {
          const url = event.urlAfterRedirects;

          this.updateActiveTab(url);
          this.extractPeriodIdFromUrl(url);
          this.checkRoles(this.currentPeriodId());
        })
    );

    // Changement de rôle
    this.subscriptions.add(
      this.roleChangeService.roleChanged$.subscribe(changed => {
        if (changed) {
          this.checkRoles(this.currentPeriodId());
          this.roleChangeService.resetNotification();
        }
      })
    );

    // Fermeture modal
    this.subscriptions.add(
      this.listeningChangeService.modalClosed$.subscribe(closed => {
        if (closed) {
          this.checkRoles(this.currentPeriodId());
          this.listeningChangeService.resetNotification();
        }
      })
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  private extractPeriodIdFromUrl(url: string): void {
    const match = url.match(/period\/(\d+)/);
    if (match) {
      this.currentPeriodId.set(Number(match[1]));
    } else {
      this.currentPeriodId.set(null);
    }
  }

  private checkRoles(periodId?: number | null): void {
    this.checkIfUserHasAdminRole();
    this.checkIfIsSelectorEvaluator(periodId);
    this.checkIfIsPreselectorEvaluator(periodId);
  }

  private checkIfUserHasAdminRole(): void {
    this.userService.hasAdminRole().subscribe({
      next: res => this.hasAdminRole.set(res.hasAdminRole),
      error: err => console.error(err),
    });
  }

  private checkIfIsSelectorEvaluator(periodId?: number | null): void {
    console.log('SELECTOR periodId:', periodId);
    this.evaluatorService.isSelectorEvaluator(periodId).subscribe({
      next: res => this.isSelectorEvaluator.set(res.isSelectorEvaluator),
      error: err => console.error(err),
    });
  }

  private checkIfIsPreselectorEvaluator(periodId?: number | null): void {
    this.evaluatorService.isPreselectorEvaluator(periodId).subscribe({
      next: res => this.isPreselectorEvaluator.set(res.isPreselectorEvaluator),
      error: err => console.error(err),
    });
  }

  setActiveTab(tab: typeof this.activeTab): void {
    this.activeTab = tab;
  }

  private updateActiveTab(url: string): void {
    // D'abord vérifier si c'est la page d'accueil (racine)
    if (url === '/' || url === '') {
      this.setActiveTab('home');
    } else if (url.includes('allcandidacy')) {
      this.setActiveTab('allcandidacy');
    } else if (url.includes('import')) {
      this.setActiveTab('import');
    } else if (url.includes('presection')) {
      this.setActiveTab('presection');
    } else if (url.includes('criteria')) {
      this.setActiveTab('criteria');
    } else if (url.includes('users')) {
      this.setActiveTab('users');
    } else if (url.includes('evaluator-candidacies')) {
      this.setActiveTab('evaluator-candidacies');
    } else if (url.includes('preselection-admin')) {
      this.setActiveTab('preselection-admin');
    } else if (url.includes('selections')) {
      this.setActiveTab('selections');
    } else {
      this.setActiveTab('period');
    }
  }

  private getCurrentUser(): void {
    this.userService.getUser().subscribe({
      next: user => this.user.set(user),
      error: err => console.error(err),
    });
  }

  getUserFromLocalStorage(){
    try{
      const userData = this.localStorageService.getData("user");
      if(userData){
        const user = JSON.parse(userData);
        return user.role || null
      }
      return null
    }catch(error){
      console.error("Erreur lors de la lecture du localstorage : ",error)
    }
  }

  logout(): void {
    this.authService.logout().subscribe({
      next: () => {
        this.localStorageService.removeData('token');
        this.localStorageService.removeData('user');
        this.router.navigate(['/login']);
      },
      error: err => console.error('Logout failed', err),
    });
  }
}
