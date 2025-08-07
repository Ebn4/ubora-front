import { ActivatedRoute } from '@angular/router';
import { Component, inject, signal } from '@angular/core';
import { BaseListWidget } from '../../../widgets/base-list-widget';
import { Candidacy } from '../../../models/candidacy';
import { CandidacyService } from '../../../services/candidacy.service';
import { Interview } from '../../../models/interview';
import { PeriodService } from '../../../services/period.service';
import { Period } from '../../../models/period';
import { PeriodStatus } from '../../../enum/period-status.enum';
import { ImportService } from '../../../services/import.service';

@Component({
  selector: 'app-candidacy-informations',
  imports: [],
  templateUrl: './candidacy-informations.component.html',
})
export class CandidacyInformationsComponent extends BaseListWidget {
  protected readonly PeriodStatus = PeriodStatus;

  candidacyId!: number;
  candidacy?: Candidacy;
  candidateHasSelected = signal(true)

  interview = signal<Interview | null>(null)
  period = signal<Period | null>(null)

  candidacyService = inject(CandidacyService);
  periodService = inject(PeriodService);
  importService: ImportService = inject(ImportService);
  route: ActivatedRoute = inject(ActivatedRoute);

  ngOnInit(): void {
    this.loadData();
    this.loadCandidateInterviewInfo()
    this.checkIfCandidateHasSelected()
  }

  override loadData() {
    this.candidacyId = Number(this.route.snapshot.paramMap.get('id'));
    this.candidacyService
      .getOneCandidacy(this.candidacyId)
      .subscribe({
        next: (response) => {
          const candidate = response.data;
          this.candidacy = candidate
          this.loadPeriodById(candidate.period_id)
        },
        error: (error) => {
          console.error('Error loading candidacies:', error);
        }
      });
  }

  loadCandidateInterviewInfo() {
    this.candidacyService.getCandidateInterview(this.candidacyId ?? 0)
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
          console.log(value)
        },
        error: err => {
          console.error(err)
        }
      })
  }

  checkIfCandidateHasSelected() {
    this.candidacyService
      .candidateHasSelected(this.candidacyId)
      .subscribe({
        next: value => {
          this.candidateHasSelected.set(value.hasSelection)
        }
      })
  }

  onEvaluated() {
    this.loadData()
    this.candidateHasSelected.set(true)
  }

  getDocument(fileName: any) {
    const actualFileName = 'Adonai MUKE CV.pdf';
    this.importService.getDocument(actualFileName).subscribe((file) => {
      const blob = new Blob([file], { type: file.type });
      const url = window.URL.createObjectURL(blob);
      window.open(url);
    });
  }

}
