import { NgClass } from '@angular/common';
import { Component, inject } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';

@Component({
  selector: 'app-sidebar',
  imports: [RouterLink, RouterOutlet, NgClass],
  templateUrl: './sidebar.component.html',
})
export class SidebarComponent {
  router: Router = inject(Router);

  ngOnInit(){
    const url = this.router.url;
    this.updateActiveTab(url);

    this.router.events
    .pipe(filter(event => event instanceof NavigationEnd))
    .subscribe((event: NavigationEnd) => {
      this.updateActiveTab((event as NavigationEnd).urlAfterRedirects);
    })
  }
  activeTab: 'candidacy' | 'allcandidacy' | 'import' | 'presection' | 'period' | 'criteria' | 'user' = 'criteria';
  setActiveTab(tab: 'candidacy' | 'allcandidacy' | 'import' | 'presection' | 'period' | 'criteria' | 'user') {
    this.activeTab = tab;
  }
  updateActiveTab(url: string) {
    if(url.includes('period')) {
      this.setActiveTab('period');
    }
    else if(url.includes('candidacy')) {
      this.setActiveTab('candidacy');
    }
    else if(url.includes('allcandidacy')) {
      this.setActiveTab('allcandidacy');
    }
    else if(url.includes('import')) {
      this.setActiveTab('import');
    }
    else if(url.includes('presection')) {
      this.setActiveTab('presection');
    }
    else if(url.includes('criteria')) {
      this.setActiveTab('criteria');
    }
    else if(url.includes('user')) {
      this.setActiveTab('user');
    }
  }
}
