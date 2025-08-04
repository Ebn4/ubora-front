import {Component, EventEmitter, inject, Input, OnChanges, Output, signal, SimpleChanges} from '@angular/core';
import {MatDialog} from '@angular/material/dialog';
import {AddEvaluatorDialogComponent} from '../add-evaluator-dialog/add-evaluator-dialog.component';
import {EvaluatorService} from '../../../services/evaluator.service';
import {Evaluator} from '../../../models/evaluator.model';
import {FormControl, FormsModule, ReactiveFormsModule} from '@angular/forms';
import {BaseListWidget} from '../../../widgets/base-list-widget';
import {NgClass, NgForOf} from '@angular/common';
import {Period} from '../../../models/period';
import {MatSnackBar} from '@angular/material/snack-bar';
import {PeriodStatus} from '../../../enum/period-status.enum';
import {PeriodService} from '../../../services/period.service';

@Component({
  selector: 'app-period-evaluateur',
  imports: [
    FormsModule,
    NgForOf,
    ReactiveFormsModule,
    NgClass
  ],
  templateUrl: './period-evaluateur.component.html',
  standalone: true
})
export class PeriodEvaluateurComponent extends BaseListWidget implements OnChanges {

  private _snackBar = inject(MatSnackBar);
  readonly dialog = inject(MatDialog);

  @Input() candidatesCount? = 0;
  @Input() period?: Period
  @Output() canValidateDispatch = new EventEmitter<boolean>()

  perPage = signal(10)
  canDispatch = signal(true)
  isDisableDispatchButton = signal(false)
  evaluators = signal<Evaluator[]>([])
  dispatchStatus = signal(PeriodStatus.STATUS_DISPATCH);
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

  typeForm = new FormControl('')

  evaluatorService = inject(EvaluatorService)
  periodService = inject(PeriodService)

  ngOnInit() {
    this.getEvaluators()
    this.isDispatchable()
    this.periodHasEvaluators()
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
    this.periodHasEvaluators()
  }

  onOpenDialog() {
    const dialogRef = this.dialog.open(AddEvaluatorDialogComponent, {
      data: {periodId: this.period?.id}
    });

    dialogRef.afterClosed().subscribe(result => {
      this.getEvaluators()
    });
  }

  onDispatchEvaluator() {
    if (this.isDisableDispatchButton()) {
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
    } else {
      this._snackBar.open("Vous ne pouvez pas dispatcher car vous n'avez pas encore ajouter des evaluateurs de PRESELECTION pour cette periode", 'fermer', {
        duration: 3000
      });
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
          this.currentPage = value.meta.current_page;
          this.lastPage = value.meta.last_page;
        },
        error: err => {
          console.log(err)
        }
      })


  }

  periodHasEvaluators() {
    if (this.period?.id != null) {

      this.periodService
        .periodHasEvaluators(this.period.id)
        .subscribe({
          next: value => {
            console.log(value.hasEvaluators)
            this.isDisableDispatchButton.set(value.hasEvaluators)
          },
          error: err => {
            console.log(err)
          }
        })

      console.log(this.isDisableDispatchButton())
    }

  }

  deleteEvaluator(id: number) {
    this.evaluatorService.deleteEvaluator(id)
      .subscribe({
        next: value => {
          this._snackBar.open('Evaluateur supprimer', 'Fermer', {duration: 3000})
          this.loadData()
        },
        error: err => {
          this._snackBar.open(err.error.errors, 'Fermer', {
            duration: 3000,
          });
        }
      })
  }
}
