import { Component, inject } from '@angular/core';
import { Candidacy } from '../../../models/candidacy';
import { CandidacyService } from '../../../services/candidacy.service';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CriteriaPeriod } from '../../../models/criteria-period';
import { CriteriaService } from '../../../services/criteria.service';
import { PeriodStatus } from '../../../enum/period-status.enum';
import { ImportService } from '../../../services/import.service';
import { NgClass, NgFor, NgIf } from '@angular/common';
import { PreselectionService } from '../../../services/preselection.service';

@Component({
  selector: 'app-candidacy-preselection',
  imports: [RouterLink, NgIf, NgFor, NgClass],
  templateUrl: './candidacy-preselection.component.html',
})
export class CandidacyPreselectionComponent {
  candidacyId!: number;
  dispatch_preselections_id!: number;
  preselectionCheck = false

  candidacy?: Candidacy;
  candidacyService: CandidacyService = inject(CandidacyService);
  route: ActivatedRoute = inject(ActivatedRoute);
  importService: ImportService = inject(ImportService);
  preselectionService: PreselectionService = inject(PreselectionService);


  criterias: CriteriaPeriod[] = [];
  selectedCriteriaIds: any[] = [];
  criteriaOng: any;
  criteriaService: CriteriaService = inject(CriteriaService);
  periodId!: number;
  type: string = PeriodStatus.STATUS_PRESELECTION;
  search: string = '';

  candidaciesList: any;
  currentIndex: number = 0;

  constructor(private router: Router) { }

  ngOnInit() {

    this.candidaciesList = this.preselectionService.getCandidacy();
    const currentId = Number(this.route.snapshot.paramMap.get('id'));
    this.currentIndex = this.candidaciesList.findIndex((c: any) => c.id === currentId);
    this.loadDataCandidacy()
    this.loadDataCriteria();
  }

  loadDataCandidacy() {
    const candidacyId = this.candidaciesList[this.currentIndex]?.id;
    this.candidacyService.getOneCandidacy(candidacyId).subscribe({
      next: (response) => {
        this.candidacy = response.data;
        this.preselectionCheck = this.candidacy.candidacy_preselection
      },
      error: (error) => {
        console.error('Erreur chargement candidature:', error);
      }
    });
  }

  goToPrevious() {
    if (this.currentIndex > 0) {
      this.currentIndex--;
      this.updateRouteAndLoad();
    }
  }

  goToNext() {
    if (this.currentIndex < this.candidaciesList.length - 1) {
      this.currentIndex++;
      this.updateRouteAndLoad();
    }
  }

  updateRouteAndLoad() {
    const candidacy = this.candidaciesList[this.currentIndex];
    this.router.navigate(
      ['/evaluator-candidacies-single', candidacy.id, candidacy.dispatch[0].pivot?.id || 0, this.periodId],
      { replaceUrl: true }
    );
    this.loadDataCandidacy();
    this.loadDataCriteria()
  }

  loadDataCriteria() {
    this.periodId = Number(this.route.snapshot.paramMap.get('periodId'));
    const candidacy = this.candidaciesList[this.currentIndex];
    this.criteriaService
      .getPeriodCriterias(this.periodId, this.search, candidacy.dispatch[0].pivot?.id)
      .subscribe({
        next: (response) => {
          this.criterias = response.data
            .filter((c) => c.type === "PRESELECTION")
            .map((c) => ({
              ...c,
              isChecked: c.valeur === 1 ? true : false,
            }));
        },
        error: (error) => {
          console.error('Error fetching criteria:', error);
        },
      });
  }

  onToggleCriteria(period_criteria_id: number, event: Event) {
    const checked = (event.target as HTMLInputElement).checked;
    const critere = this.criterias.find((c) => c.period_criteria_id === period_criteria_id);
    if (critere) {
      critere.isChecked = checked;
    }
  }

  preselectionCandidacy() {
    this.dispatch_preselections_id = Number(this.route.snapshot.paramMap.get('dispatchId'));
    const data = this.criterias.map(c => ({
      period_criteria_id: c.period_criteria_id,
      dispatch_preselections_id: this.dispatch_preselections_id,
      valeur: c.isChecked
    }));

    this.preselectionService.preselectionCandidacy(data).subscribe({
      next: (res) => {
        this.preselectionCheck = true
        if (this.currentIndex < this.candidaciesList.length - 1) {
          this.goToNext();
        }else{
          this.router.navigate(['/evaluator-candidacies']);
        }
      },
      error: (err) => {
        console.error('Erreur lors de la préselection', err);
      }
    });
  }

  getDocument() {
    this.importService.getDocument('30 DBA.docx').subscribe((file) => {
      const blob = new Blob([file], { type: file.type });
      const url = window.URL.createObjectURL(blob);
      window.open(url);
    });
  }


}
