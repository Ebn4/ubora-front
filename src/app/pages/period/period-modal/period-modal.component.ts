import { Component, Input, Output, EventEmitter, Inject, inject } from '@angular/core';
import { AbstractControl, FormControl, FormGroup, ReactiveFormsModule, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { PeriodService } from '../../../services/period.service';

@Component({
  selector: 'app-period-modal',
  imports: [ReactiveFormsModule],
  templateUrl: './period-modal.component.html',
})
export class PeriodModalComponent {

  periodService:PeriodService = inject(PeriodService);
  currentYear = new Date().getFullYear();


  constructor(
    public dialogRef: MatDialogRef<PeriodModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
  ){

  }

  form = new FormGroup({
    year: new FormControl(new Date().getFullYear(), [Validators.required,
      Validators.pattern('^[0-9]{4}$'), // ← Doit être un nombre à 4 chiffres
      this.minYearValidator(this.currentYear)
    ])
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

  minYearValidator(minYear: number): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const year = control.value;
      // Accepte minYear ou minYear-1
      return year && year < (minYear - 1)
        ? { minYear: { required: minYear - 1, actual: year } }
        : null;
    };
  }

}
