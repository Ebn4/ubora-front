import { Component, Inject, inject, NgModule } from '@angular/core';
import { BaseListWidget } from '../../../widgets/base-list-widget';
import { Criteria } from '../../../models/criteria';
import { CriteriaService } from '../../../services/criteria.service';
import {
  FormControl,
  FormGroup,
  FormsModule,
  Validators,
} from '@angular/forms';
import {
  MatDialogRef,
  MAT_DIALOG_DATA,
} from '@angular/material/dialog';
import { NgFor, NgIf } from '@angular/common';
import { CriteriaPeriod } from '../../../models/criteria-period';
import { PeriodStatus } from '../../../enum/period-status.enum';
import { ListeningChangeService } from '../../../services/listening-change.service';

@Component({
  selector: 'app-criteria-attach-selection',
  imports: [FormsModule, NgFor, NgIf],
  templateUrl: './criteria-attach-selection.component.html',
})
export class CriteriaAttachSelectionComponent extends BaseListWidget {
  selectedCriteriaIds: number[] = [];
  criterias: CriteriaPeriod[] = [];
  criteriaService: CriteriaService = inject(CriteriaService);
  form!: FormGroup;
  periodId!: number;
  type: string = PeriodStatus.STATUS_SELECTION;

  constructor(
    public dialogRef: MatDialogRef<CriteriaAttachSelectionComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private modalService: ListeningChangeService
  ) {
    super();
    this.periodId = data.periodId;
  }

  ngOnInit(): void {
    this.loadData();
  }

  override loadData() {
    this.criteriaService
      .getPeriodCriterias(this.periodId, this.search)
      .subscribe({
        next: (response) => {
          this.criterias = response.data.map((c) => ({
            ...c,
            isChecked: c.type === PeriodStatus.STATUS_SELECTION,
          }));

          this.selectedCriteriaIds = this.criterias
            .filter((c) => c.isChecked)
            .map((c) => c.id);
        },
        error: (error) => {
          console.error('Error fetching criteria:', error);
        },
      });
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
      .attachCriteriaToPeriod(this.periodId, {
        criteria: selectedCriterias,
        type: this.type,
      })
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
