import { Component, Input, Output, EventEmitter, Inject, inject } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { PeriodService } from '../../../services/period.service';

@Component({
  selector: 'app-period-modal',
  imports: [ReactiveFormsModule],
  templateUrl: './period-modal.component.html',
})
export class PeriodModalComponent {

  periodService:PeriodService = inject(PeriodService);


  constructor(
    public dialogRef: MatDialogRef<PeriodModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
  ){

  }

  form = new FormGroup({
    year: new FormControl(new Date().getFullYear(), [Validators.required])
  });

  closeModal() {
    this.dialogRef.close();
  }

  submit() {
    if (this.form.valid) {
      this.createPeriod();
    }
  }

  createPeriod() {
    const year = this.form.value.year as number;
    this.periodService.createPeriod({ year: year }).subscribe({
      next: () => {
        this.dialogRef.close(true);
      },
      error: (error) => {
        console.error('Error creating period:', error);
        this.dialogRef.close(false);
      }
    });
  }
}
