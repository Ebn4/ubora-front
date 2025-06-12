import {Component, inject, Input, OnChanges, signal, SimpleChanges} from '@angular/core';
import {MatDialog} from '@angular/material/dialog';
import {AddEvaluatorDialogComponent} from '../add-evaluator-dialog/add-evaluator-dialog.component';
import {EvaluatorService} from '../../../services/evaluator.service';
import {Evaluator} from '../../../models/evaluator.model';
import {RouterLink} from '@angular/router';
import {FormControl, FormsModule, ReactiveFormsModule} from '@angular/forms';
import {BaseListWidget} from '../../../widgets/base-list-widget';
import {NgForOf} from '@angular/common';

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
export class PeriodEvaluateurComponent extends BaseListWidget {

  readonly dialog = inject(MatDialog);
  evaluators = signal<Evaluator[]>([])
  @Input() periodId: number = -1
  perPage = signal(10)
  typeForm = new FormControl('')

  evaluatorService = inject(EvaluatorService)

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

  ngOnInit() {
    this.getEvaluators()
    this.typeForm.valueChanges.subscribe(value => {
      this.loadData()
    })
  }

  override loadData() {
    this.getEvaluators()
  }

  onOpenDialog() {
    const dialogRef = this.dialog.open(AddEvaluatorDialogComponent, {
      data: {periodId: this.periodId}
    });

    dialogRef.afterClosed().subscribe(result => {
      this.getEvaluators()
    });
  }

  getEvaluators() {
    this.evaluatorService.getEvaluators(
      this.periodId,
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
