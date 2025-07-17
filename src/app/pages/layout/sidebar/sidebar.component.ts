import {NgClass} from '@angular/common';
import {Component, inject, signal} from '@angular/core';
import {NavigationEnd, Router, RouterLink, RouterOutlet} from '@angular/router';
import {filter} from 'rxjs';
import {AuthServices} from '../../../services/auth.service';
import {LocalStorageService} from '../../../services/local-storage.service';
import {UserService} from '../../../services/user.service';

@Component({
  selector: 'app-sidebar',
  imports: [RouterLink, RouterOutlet, NgClass],
  templateUrl: './sidebar.component.html',
})
export class SidebarComponent {

  router: Router = inject(Router);
  authService = inject(AuthServices);
  userService = inject(UserService);

  hasAdminRole = signal(false)
  localStorageService = inject(LocalStorageService);

  ngOnInit() {
    const url = this.router.url;
    this.updateActiveTab(url);
    this.checkIfUserHasAdminRole()

    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        this.updateActiveTab((event as NavigationEnd).urlAfterRedirects);
      })
  }

  activeTab: 'candidacy' | 'allcandidacy' | 'import' | 'presection' | 'period' | 'criteria' | 'users' | 'evaluator-candidacies' | 'preselection-admin' = 'criteria';

  setActiveTab(tab: 'candidacy' | 'allcandidacy' | 'import' | 'presection' | 'period' | 'criteria' | 'users' | 'evaluator-candidacies' | 'preselection-admin') {
    this.activeTab = tab;
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
    } else if (url.includes('candidacy')) {
      this.setActiveTab('candidacy');
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
    } else {
      this.setActiveTab('criteria');
    }
  }
}
