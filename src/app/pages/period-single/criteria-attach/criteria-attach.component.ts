import { NgFor, NgIf } from '@angular/common';
import { Component, Inject, inject } from '@angular/core';
import {
  MatDialogRef,
  MAT_DIALOG_DATA,
  MatDialogConfig,
  MatDialog,
} from '@angular/material/dialog';
import { CriteriaService } from '../../../services/criteria.service';
import { BaseListWidget } from '../../../widgets/base-list-widget';
import {
  FormsModule,
  ReactiveFormsModule,
} from '@angular/forms';
import { CriteriaPeriod } from '../../../models/criteria-period';
import { PeriodStatus } from '../../../enum/period-status.enum';
import { ListeningChangeService } from '../../../services/listening-change.service';

@Component({
  selector: 'app-criteria-attach',
  imports: [NgFor, FormsModule, ReactiveFormsModule, NgIf],
  templateUrl: './criteria-attach.component.html',
})
export class CriteriaAttachComponent extends BaseListWidget {
  criterias: CriteriaPeriod[] = [];
  selectedCriteriaIds: number[] = [];
  criteriaOng: any;
  criteriaService: CriteriaService = inject(CriteriaService);
  periodId!: number;
  type: string = PeriodStatus.STATUS_PRESELECTION;

  constructor(
    public dialogRef: MatDialogRef<CriteriaAttachComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private _matDialog: MatDialog,
    private modalService: ListeningChangeService
  ) {
    super();
    this.periodId = data.periodId;
  }

  ngOnInit(): void {
    this.loadData();
  }

  override loadData() {
    this.criteriaService.getPeriodCriterias(this.periodId, this.search).subscribe({
      next: (response) => {
        this.criterias = response.data.map((c) => ({
          ...c,
          isChecked: c.type === PeriodStatus.STATUS_PRESELECTION,
        }));

        this.selectedCriteriaIds = this.criterias
          .filter((c) => c.isChecked)
          .map((c) => c.id);
      },
      error: (error) => {
        console.error('Error fetching criteria:', error);
      },
    })
  }

  onToggleCriteria(id: number, event: Event) {
    const checked = (event.target as HTMLInputElement).checked;

    const critere = this.criterias.find((c) => c.id === id);
    if (critere) {
      critere.isChecked = checked;
    }

    if (checked && !this.selectedCriteriaIds.includes(id)) {
      this.selectedCriteriaIds.push(id);
    } else if (!checked) {
      this.selectedCriteriaIds = this.selectedCriteriaIds.filter(
        (i) => i !== id
      );
    }
  }

  attachCriteria() {
    const selectedCriterias = this.criterias
      .filter((c) => c.isChecked)
      .map((c) => ({
        id: c.id,
        ponderation: Number(c.ponderation) || 0,
      }));

    this.criteriaService
      .attachCriteriaToPeriod(this.periodId, { criteria: selectedCriterias, type: this.type })
      .subscribe({
        next: () => {
          this.closeModal()
        },
        error: (error) => {
          console.error('Error attaching criteria:', error);
        },
      });
  }

  closeModal() {
    this.dialogRef.close();
    this.modalService.notifyModalClosed();
  }
}
