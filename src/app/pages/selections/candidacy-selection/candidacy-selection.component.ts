import {Component, inject, signal} from '@angular/core';
import {Candidacy} from '../../../models/candidacy';
import {CandidacyService} from '../../../services/candidacy.service';
import {ActivatedRoute, Router, RouterLink} from '@angular/router';
import {CriteriaPeriod} from '../../../models/criteria-period';
import {CriteriaService} from '../../../services/criteria.service';
import {PeriodStatus} from '../../../enum/period-status.enum';
import {ImportService} from '../../../services/import.service';
import {NgClass, NgFor, NgIf} from '@angular/common';
import {PreselectionService} from '../../../services/preselection.service';
import {Interview} from '../../../models/interview';
import {Period} from '../../../models/period';
import {EvaluationComponent} from '../../evaluation/evaluation.component';
import {PeriodService} from '../../../services/period.service';

@Component({
  selector: 'app-candidacy-preselection',
  imports: [RouterLink, EvaluationComponent],
  templateUrl: './candidacy-selection.component.html',
})
export class CandidacySelectionComponent {

  periodService = inject(PeriodService);
  candidacyService: CandidacyService = inject(CandidacyService);
  route: ActivatedRoute = inject(ActivatedRoute);

  importService = inject(ImportService);

  periodId: number = 4;
  type: string = PeriodStatus.STATUS_PRESELECTION;
  search: string = '';

  candidacy?: Candidacy;
  currentIndex: number = 0;

  candidateHasSelected = signal(true)
  candidateId = signal(0)
  interview = signal<Interview | null>(null)
  period = signal<Period | null>(null)

  ngOnInit() {
    const currentId = Number(this.route.snapshot.paramMap.get('id'));
    this.candidateId.set(currentId)
    this.loadDataCandidacy(currentId)
    this.loadCandidateInterviewInfo()
    this.checkIfCandidateHasSelected()
  }

  loadDataCandidacy(candidacyId: number) {
    this.candidacyService.getOneCandidacy(candidacyId).subscribe({
      next: (response) => {
        const candidate = response.data
        this.candidacy = candidate;
        this.loadPeriodById(candidate.period_id)
      },
      error: (error) => {
        console.error('Erreur chargement candidature:', error);
      }
    });
  }

  loadCandidateInterviewInfo() {
    this.candidacyService.getCandidateInterview(this.candidateId())
      .subscribe({
        next: value => {
          this.interview.set(value.data)
        }, error: err => {
          console.error(err)
        }
      })
  }

  loadPeriodById(periodId: number) {
    this.periodService.getOnePeriod(periodId)
      .subscribe({
        next: value => {
          this.period.set(value)
        },
        error: err => {
          console.error(err)
        }
      })
  }

  getDocument() {
    this.importService.getDocument('30 DBA.docx').subscribe((file) => {
      const blob = new Blob([file], {type: file.type});
      const url = window.URL.createObjectURL(blob);
      window.open(url);
    });
  }

  checkIfCandidateHasSelected() {
    this.candidacyService
      .candidateHasSelected(this.candidateId())
      .subscribe({
        next: value => {
          this.candidateHasSelected.set(value.hasSelection)
        }
      })
  }

  onEvaluated() {
    this.loadDataCandidacy(this.candidateId())
    this.candidateHasSelected.set(true)
  }

  protected readonly PeriodStatus = PeriodStatus;
}
