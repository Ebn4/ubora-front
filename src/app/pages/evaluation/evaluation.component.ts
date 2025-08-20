import {ChangeDetectorRef, Component, EventEmitter, inject, Input, OnInit, Output, signal} from '@angular/core';
import {CriteriaService} from '../../services/criteria.service';
import {Criteria} from '../../models/criteria';
import {CandidacyService} from '../../services/candidacy.service';
import {
  FormArray,
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import {CandidateEvaluation} from '../../models/candidate-evaluation';
import {MatSnackBar} from '@angular/material/snack-bar';
import {lastValueFrom} from 'rxjs';
import {PeriodService} from '../../services/period.service';
import {Period} from '../../models/period';
import {PeriodStatus} from '../../enum/period-status.enum';

@Component({
  selector: 'app-evaluation',
  imports: [
    FormsModule,
    ReactiveFormsModule,
  ],
  templateUrl: './evaluation.component.html',
  standalone: true,
  styles: ``
})
export class EvaluationComponent implements OnInit {

  @Input() periodId: number | null = null;
  @Input() hasSelected: boolean = false;
  @Input() interviewId: number | null = null;
  @Input() candidateId: number = 0;

  @Output() onEvaluated = new EventEmitter()

  snackBar = inject(MatSnackBar)
  criterias = signal<Criteria[]>([]);
  criteriaService = inject(CriteriaService)
  periodService = inject(PeriodService)
  candidateService = inject(CandidacyService)
  formBuilder = inject(FormBuilder)
  cdr = inject(ChangeDetectorRef)

  form!: FormGroup
  isPeriodHasSelectionStatus = signal(false)
  isCandidateHasSelected = signal(false)

  ngOnInit() {
    this.form = this.formBuilder.group({
        crv: this.formBuilder.array([])
      }
    )
    this.loadCriteria();
    this.loadPeriod()
    this.candidateHasSelected()
  }

  get crv(): FormArray {
    return this.form.get('crv') as FormArray
  }

  async loadCriteria() {
    if (this.periodId != null) {
      const value = await lastValueFrom(this.criteriaService.loadCriteriasByPeriodId(this.periodId, 'SELECTION'))

      for (const criteria of value.data) {

        const result = await lastValueFrom(this.candidateService.getCandidateSelectionResultByCriteria(this.interviewId ?? 0, criteria.id))

        const a = this.formBuilder.group({
          critere: [criteria],
          result: [result.data.result, [Validators.required, Validators.min(0.5), Validators.max(criteria.ponderation)]]
        })
        this.crv.push(a)
      }

      this.cdr.detectChanges()
      this.criterias.set(value.data);
    }
  }

  async loadPeriod() {
    if (this.periodId != null) {
      this.periodService.getOnePeriod(this.periodId)
        .subscribe({
          next: value => {
            if (value.status == PeriodStatus.STATUS_SELECTION) {
              this.isPeriodHasSelectionStatus.set(true)
            } else {
              this.isPeriodHasSelectionStatus.set(false)
            }
          }
        })
    }
  }

  candidateHasSelected() {
    this.candidateService.candidateHasSelected(this.candidateId)
      .subscribe({
        next: value => {
          this.isCandidateHasSelected.set(value.hasSelection)
        }
      })
  }

  showSnackbar(message: string) {
    this.snackBar.open(message, 'Fermer', {
      duration: 3000
    })
  }

  onSubmit() {

    if (!this.hasSelected) {
      const fields: CandidateEvaluation[] = this.crv.controls.map((e, i) => {
        return {
          key: e.get('critere')?.value?.id,
          value: e.get('result')?.value
        }
      })

      if (this.periodId != null && this.interviewId != null) {
        this.candidateService.evaluateCandidate({
          interviewId: this.interviewId,
          periodId: this.periodId,
          evaluations: fields
        }).subscribe({
          next: value => {
            if (value.errors != null) {
              this.showSnackbar(value.errors)
            }
            if (value.data) {
              this.showSnackbar('evaluation effectuer')
              this.onEvaluated.emit()
            }
          },
          error: err => {
            if (err.error.errors) {
              this.snackBar.open(err.error.errors[0], 'Fermer', {
                duration: 3000
              })
            }
          }
        })
      }
    }

  }

  protected readonly PeriodStatus = PeriodStatus;
}
