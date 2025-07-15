import { Component, inject } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatTabsModule } from "@angular/material/tabs";
import { NgClass } from '@angular/common';
import { CandidacyInformationsComponent } from "./candidacy-informations/candidacy-informations.component";
import { CandidacyEvaluateursComponent } from "./candidacy-evaluateurs/candidacy-evaluateurs.component";

@Component({
  selector: 'app-candidacy-single',
  imports: [MatTabsModule, NgClass, CandidacyInformationsComponent, CandidacyEvaluateursComponent],
  templateUrl: './candidacy-single.component.html',
})
export class CandidacySingleComponent {
  selectedTab: string = "tab1";
  tabIndex: number = 0;
  route: ActivatedRoute = inject(ActivatedRoute);

  constructor(private router: Router){

  }
  ngOnInit() {
    this.route.queryParams.subscribe((params) => {
      this.selectedTab = params["tab"] || "information";
      this.tabIndex = this.getTabIndex(this.selectedTab);
    });
  }

  getTabIndex(tab: string): number {
    switch (tab) {
      case 'information':
        return 0;
      case 'evaluateur':
        return 1;
      default:
        return 0;
    }
  }

  getTabName(index: number): string {
    switch (index) {
      case 0:
        return 'information';
      case 1:
        return 'evaluateur';
      default:
        return 'information';
    }
  }

  onTabChange(index: number) {
    this.selectedTab = this.getTabName(index);
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { tab: this.selectedTab },
      queryParamsHandling: 'merge',
    });
  }
}
