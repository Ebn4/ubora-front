import {Component, inject, Input, signal} from '@angular/core';
import {MatDialog} from '@angular/material/dialog';
import {AddEvaluatorDialogComponent} from '../add-evaluator-dialog/add-evaluator-dialog.component';
import {EvaluatorService} from '../../../services/evaluator.service';
import {Evaluator} from '../../../models/evaluator.model';
import {RouterLink} from '@angular/router';

@Component({
  selector: 'app-period-evaluateur',
  imports: [
    RouterLink
  ],
  templateUrl: './period-evaluateur.component.html',
  standalone: true
})
export class PeriodEvaluateurComponent {

  readonly dialog = inject(MatDialog);
  evaluators = signal<Evaluator[]>([])
  @Input() periodId: number = -1

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

  ngOnInit(){
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
    this.evaluatorService.getEvaluators(this.periodId)
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
