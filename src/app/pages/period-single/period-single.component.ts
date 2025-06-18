import {Period} from './../../models/period';
import {Component, inject, signal} from '@angular/core';
import {ActivatedRoute, Router, RouterLink} from '@angular/router';
import {PeriodService} from '../../services/period.service';
import {NgClass, NgIf} from '@angular/common';
import {PeriodCriteriaComponent} from './period-criteria/period-criteria.component';
import {PeriodCandidacyComponent} from './period-candidacy/period-candidacy.component';
import {PeriodEvaluateurComponent} from './period-evaluateur/period-evaluateur.component';
import {PeriodLecteurComponent} from './period-lecteur/period-lecteur.component';
import {MatTabsModule} from "@angular/material/tabs";


@Component({
  selector: 'app-period-single',
  imports: [
    RouterLink,
    NgIf,
    NgClass,
    PeriodCriteriaComponent,
    PeriodCandidacyComponent,
    PeriodEvaluateurComponent,
    PeriodLecteurComponent,
    MatTabsModule
  ],
  templateUrl: './period-single.component.html',
})
export class PeriodSingleComponent {
  canDispatch = signal(false)
  periodService: PeriodService = inject(PeriodService);
  route: ActivatedRoute = inject(ActivatedRoute);
  period!: Period | undefined;
  selectedTab: string = "tab1";
  tabIndex: number = 0;
  periodId = -1;
  showModal = false;
  activeTab: 'criteria' | 'candidacy' | 'evaluateur' | 'lecteur' = 'criteria';

  constructor(private router: Router) {
  }

  ngOnInit() {
    this.periodId = Number(this.route.snapshot.paramMap.get('id'));
    this.periodService.getOnePeriod(this.periodId).then((period) => {
      this.period = period;
    });
    this.route.queryParams.subscribe((params) => {
      this.selectedTab = params["tab"] || "criteria";
      this.tabIndex = this.getTabIndex(this.selectedTab);
    });
  }

  getTabIndex(tab: string): number {
    switch (tab) {
      case "criteria":
        return 0;
      case "candidacy":
        return 1;
      case "evaluateur":
        return 2;
      case "lecteur":
        return 3;
      default:
        return 0;
    }
  }

  getTabName(index: number): string {
    switch (index) {
      case 0:
        return "criteria";
      case 1:
        return "candidacy";
      case 2:
        return "evaluateur";
      case 3:
        return "lecteur";
      default:
        return "criteria";
    }
  }

  onTabChange(index: number) {
    this.selectedTab = this.getTabName(index);
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {tab: this.selectedTab},
      queryParamsHandling: "merge",
    });
  }


  openModal() {
  }

  closeModal() {
    this.showModal = false;
  }

  canValidateDispatch(canDispatch: boolean) {
    this.canDispatch.set(canDispatch)
  }
}
