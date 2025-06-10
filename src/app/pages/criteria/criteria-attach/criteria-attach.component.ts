import { NgFor, NgIf } from '@angular/common';
import { Component, Inject, inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { CriteriaService } from '../../../services/criteria.service';
import { BaseListWidget } from '../../../widgets/base-list-widget';
import { Criteria } from '../../../models/criteria';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-criteria-attach',
  imports: [NgFor, FormsModule],
  templateUrl: './criteria-attach.component.html',
})
export class CriteriaAttachComponent extends BaseListWidget {
  criterias: Criteria[] = [];
  selectedCriteriaIds: number[] = [];
  criteriaOng: any;
  criteriaService: CriteriaService = inject(CriteriaService);
  periodId: number = 0;

  constructor(
    public dialogRef: MatDialogRef<CriteriaAttachComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    super();
  }

  ngOnInit(): void {
    this.loadData();
  }

  override loadData() {
    this.criteriaService
      .getCriteria(this.currentPage, this.search, this.per_page)
      .then((response) => {
        this.criterias = response.data;
        this.currentPage = response.current_page;
        this.lastPage = response.last_page;
      });
  }

  onCheckboxChange(event: Event): void {
    const checkbox = event.target as HTMLInputElement;
    const id = parseInt(checkbox.value, 10);

    if (checkbox.checked) {
      this.selectedCriteriaIds.push(id);
    } else {
      this.selectedCriteriaIds = this.selectedCriteriaIds.filter(
        (item) => item !== id
      );
    }
  }
  onperiodIdChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    this.periodId = parseInt(select.value, 10);
  }
  attachCriteria() {
    this.criteriaService
      .attachCriteriaToPeriod(this.periodId, this.selectedCriteriaIds)
      .then(() => {
        this.dialogRef.close(true);
      });
  }

  closeModal() {
    this.dialogRef.close();
  }
}
