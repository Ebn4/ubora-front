import { Component, inject } from '@angular/core';
import { Candidacy } from '../../../models/candidacy';
import { CandidacyService } from '../../../services/candidacy.service';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CriteriaPeriod } from '../../../models/criteria-period';
import { CriteriaService } from '../../../services/criteria.service';
import { PeriodStatus } from '../../../enum/period-status.enum';
import { ImportService } from '../../../services/import.service';
import { NgFor, NgIf } from '@angular/common';
import { PreselectionService } from '../../../services/preselection.service';

@Component({
  selector: 'app-candidacy-preselection',
  imports: [RouterLink, NgIf, NgFor],
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
  periodId: number = 4;
  type: string = PeriodStatus.STATUS_PRESELECTION;
  search: string = '';

  constructor() { }
  ngOnInit() {
    this.loadDataCriteria();
    this.checkPreselection()
  }

  loadDataCandidacy() {
    this.candidacyId = Number(this.route.snapshot.paramMap.get('id'));
    this.candidacyService.getOneCandidacy(this.candidacyId).subscribe({
      next: (response) => {
        this.candidacy = response.data;
      },
      error: (error) => {
        console.error('Error loading candidacies:', error);
      },
    });
  }

  loadDataCriteria() {
    this.criteriaService
      .getPeriodCriterias(this.periodId, this.search)
      .subscribe({
        next: (response) => {
          this.criterias = response.data
            .filter((c) => c.type === "PRESELECTION")
            .map((c) => ({
              ...c,
              isChecked: false,
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
        this.checkPreselection()
      },
      error: (err) => {
        console.error('Erreur lors de la préselection', err);
      }
    });
  }

  checkPreselection() {
    this.dispatch_preselections_id = Number(this.route.snapshot.paramMap.get('dispatchId'));
    this.preselectionService.getPreselectionsForDispatch(this.dispatch_preselections_id).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.preselectionCheck = true
        }
      },
      error: (err) => {
        if (err.status === 404) {
          return;
        }
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
