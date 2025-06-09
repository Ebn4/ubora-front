import { Component, inject, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { CriteriaService } from '../../../services/criteria.service';
import {
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { NgIf } from '@angular/common';

@Component({
  selector: 'app-criteria-ajout',
  imports: [ReactiveFormsModule, NgIf, FormsModule],
  templateUrl: './criteria-ajout.component.html',
})
export class CriteriaAjoutComponent {
  criteriaService: CriteriaService = inject(CriteriaService);
  isChecked = false;

  constructor(
    public dialogRef: MatDialogRef<CriteriaAjoutComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {}

  form = new FormGroup({
    name: new FormControl('', [Validators.required]),
    description: new FormControl('', [Validators.required]),
  });

  submit() {
    if (this.form.valid) {
      this.createCriteria();
    }
  }

  createCriteria() {
    const name = this.form.value.name as string;
    const description = this.form.value.description as string;
    this.criteriaService.createCriteria(name, description).then(() => {
      this.dialogRef.close(true);
    });
  }

  closeModal() {
    this.dialogRef.close();
  }

  isCheck(event: Event) {
    const inputElement = event.target as HTMLInputElement;
    this.isChecked = inputElement.checked;
  }
}
