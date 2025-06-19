import { Component, EventEmitter, inject, Input, OnChanges, Output, signal, SimpleChanges } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { AddEvaluatorDialogComponent } from '../add-evaluator-dialog/add-evaluator-dialog.component';
import { EvaluatorService } from '../../../services/evaluator.service';
import { Evaluator } from '../../../models/evaluator.model';
import { RouterLink } from '@angular/router';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { BaseListWidget } from '../../../widgets/base-list-widget';
import { NgForOf } from '@angular/common';
import { Period } from '../../../models/period';
import { MatSnackBar } from '@angular/material/snack-bar';
import { PeriodStatus } from '../../../enum/period-status.enum';

@Component({
  selector: 'app-period-evaluateur',
  imports: [
    RouterLink,
    FormsModule,
    NgForOf,
    ReactiveFormsModule
  ],
  templateUrl: './period-evaluateur.component.html',
  standalone: true
})
export class PeriodEvaluateurComponent extends BaseListWidget implements OnChanges {

  private _snackBar = inject(MatSnackBar);
  canDispatch = signal(true)
  @Input() period?: Period
  @Output() canValidateDispatch = new EventEmitter<boolean>()
  readonly dialog = inject(MatDialog);

  evaluators = signal<Evaluator[]>([])
  perPage = signal(10)
  dispatchStatus = signal(PeriodStatus.STATUS_DISPATCH);
  typeForm = new FormControl('')
  evaluatorTypes = signal<{ name: string, type: string }[]>(
    [
      {
        name: 'Selection',
        type: 'SELECTION'
      }, {
        name: 'Preselection',
        type: 'PRESELECTION'
      }
    ]
  )

  evaluatorService = inject(EvaluatorService)

  ngOnInit() {
    console.log('once')
    this.getEvaluators()
    this.isDispatchable()
    this.typeForm.valueChanges.subscribe(value => {
      this.loadData()
    })
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['period']) {
      const current = changes['period'].currentValue;
      this.period = current;
      if (current) this.loadData();
    }
  }

  override loadData() {
    this.getEvaluators()
    this.isDispatchable();
  }

  onOpenDialog() {
    const dialogRef = this.dialog.open(AddEvaluatorDialogComponent, {
      data: { periodId: this.period?.id }
    });

    dialogRef.afterClosed().subscribe(result => {
      this.getEvaluators()
    });
  }

  onDispatchEvaluator() {
    if (this.period?.id != null) {
      this.evaluatorService
        .dispatchEvaluators(this.period.id.toString())
        .subscribe({
          next: value => {
            this.isDispatchable()
            this._snackBar.open('Candidats dispatchés', 'fermer', {
              duration: 3000
            });
          },
          error: err => {
            console.log(err)
          }
        })
    }
  }

  onCancelDispatch() {
    if (this.period?.id != null) {
      this.evaluatorService
        .dispatchEvaluators(this.period.id.toString())
        .subscribe({
          next: value => {
            this.canDispatch.set(true)
            this.canValidateDispatch.emit(false)
            this._snackBar.open('Dispatches annuler', 'fermer', {
              duration: 3000
            });
          },
          error: err => {
            console.log(err)
          }
        })
    }
  }

  isDispatchable() {

    if (this.period?.id != null) {

      this.evaluatorService
        .hasEvaluatorBeenDispatched(this.period.id.toString())
        .subscribe({
          next: value => {
            this.canDispatch.set(!value.isDispatch)
            this.canValidateDispatch.emit(value.isDispatch)
          },
          error: err => {
            console.log(err)
          }
        })
    }


  }

  getEvaluators() {

    this.evaluatorService.getEvaluators(
      this.period?.id ?? null,
      this.currentPage,
      this.per_page,
      this.search,
      this.typeForm.value
    )
      .subscribe({
        next: value => {
          this.evaluators.set(value.data)
        },
        error: err => {
          console.log(err)
        }
      })


  }
}
