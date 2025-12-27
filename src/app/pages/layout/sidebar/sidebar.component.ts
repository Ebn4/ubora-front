import { NgClass } from '@angular/common';
import { Component, inject, signal, OnDestroy } from '@angular/core';
import { NavigationEnd, Router, RouterLink } from '@angular/router';
import { filter, Subscription } from 'rxjs';
import { AuthServices } from '../../../services/auth.service';
import { LocalStorageService } from '../../../services/local-storage.service';
import { UserService } from '../../../services/user.service';
import { User } from '../../../models/user.model';
import { EvaluatorService } from '../../../services/evaluator.service';
import { RoleChangeService } from '../../../services/role-change.service'; // Importez le service
import { ListeningChangeService } from '../../../services/listening-change.service';

@Component({
  selector: 'app-sidebar',
  imports: [RouterLink, NgClass],
  templateUrl: './sidebar.component.html',
})
export class SidebarComponent implements OnDestroy {

  router: Router = inject(Router);
  authService = inject(AuthServices);
  userService = inject(UserService);
  evaluatorService = inject(EvaluatorService);
  localStorageService = inject(LocalStorageService);
  roleChangeService = inject(RoleChangeService); // Injectez le service
  listeningChangeService = inject(ListeningChangeService);

  hasAdminRole = signal(false)
  isSelectorEvaluator = signal(false)
  isPreselectorEvaluator = signal(false)
  user = signal<User | null>(null)

  private subscriptions: Subscription = new Subscription();

  ngOnInit() {
    const url = this.router.url;
    this.updateActiveTab(url);
    this.checkRoles(); // Méthode unique pour vérifier tous les rôles

    this.getCurrentUser()

    // Abonnement aux changements de route
    this.subscriptions.add(
      this.router.events
        .pipe(filter(event => event instanceof NavigationEnd))
        .subscribe((event: NavigationEnd) => {
          this.updateActiveTab((event as NavigationEnd).urlAfterRedirects);
        })
    );

    // Abonnement aux changements de rôle
    this.subscriptions.add(
      this.roleChangeService.roleChanged$.subscribe((roleChanged) => {
        if (roleChanged) {
          this.checkRoles(); // Rechargez les rôles quand un changement est détecté
          this.roleChangeService.resetNotification(); // Réinitialisez la notification
        }
      })
    );

    this.subscriptions.add(
    this.listeningChangeService.modalClosed$.subscribe((modalClosed) => {
      if (modalClosed) {
        console.log('Modal fermé, rechargement des rôles...');
        this.checkRoles(); // Rechargez les rôles
        this.listeningChangeService.resetNotification(); // Réinitialisez
      }
    })
  );
  }

  activeTab: 'allcandidacy' | 'import' | 'presection' | 'period' | 'criteria' | 'users' | 'evaluator-candidacies' | 'selections' | 'preselection-admin' = 'period';

  setActiveTab(tab: 'allcandidacy' | 'import' | 'presection' | 'period' | 'criteria' | 'users' | 'evaluator-candidacies' | 'preselection-admin' | 'selections') {
    this.activeTab = tab;
  }

  // Nouvelle méthode pour vérifier tous les rôles
  checkRoles() {
    this.checkIfUserHasAdminRole();
    this.checkIfIsSelectorEvaluator();
    this.checkIfIsPreselectorEvaluator();
  }

  checkIfUserHasAdminRole() {
    this.userService.hasAdminRole()
      .subscribe({
        next: value => {
          this.hasAdminRole.set(value.hasAdminRole)
        }, error: err => {
          console.error(err)
        }
      })
  }

  checkIfIsSelectorEvaluator() {
    this.evaluatorService.isSelectorEvaluator()
      .subscribe({
        next: value => {
          this.isSelectorEvaluator.set(value.isSelectorEvaluator)
        }, error: err => {
          console.error(err)
        }
      })
  }

  checkIfIsPreselectorEvaluator() {
    this.evaluatorService.isPreselectorEvaluator()
      .subscribe({
        next: value => {
          this.isPreselectorEvaluator.set(value.isPreselectorEvaluator)
        }, error: err => {
          console.error(err)
        }
      })
  }

  logout() {
    this.authService.logout().subscribe({
      next: () => {
        this.localStorageService.removeData('token');
        this.router.navigate(['/login']);
      },
      error: (err) => {
        console.error('Logout failed', err);
      }
    });
  }

  updateActiveTab(url: string) {
    if (url.includes('period')) {
      this.setActiveTab('period');
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

  getCurrentUser() {
    this.userService.getUser()
      .subscribe({
        next: value => {
          this.user.set(value)
        },
        error: err => {
          console.error(err)
        }
      })
  }

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }
}
