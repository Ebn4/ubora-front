import { Component, Inject, inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import {
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { NgIf } from '@angular/common';
import { CriteriaService } from '../../../services/criteria.service';
import { Criteria } from '../../../models/criteria';

@Component({
  selector: 'app-criteria-edit',
  imports: [ReactiveFormsModule, NgIf, FormsModule],
  templateUrl: './criteria-edit.component.html',
})
export class CriteriaEditComponent {
  isChecked = false;
  criteriaService: CriteriaService = inject(CriteriaService);
  form!: FormGroup;
  criteria!: Criteria | undefined;

  constructor(
    public dialogRef: MatDialogRef<CriteriaEditComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { criteriaId: number }
  ) {
    // Initialisation vide du formulaire
    this.form = new FormGroup({
      name: new FormControl('', [Validators.required]),
      description: new FormControl('', [Validators.required]),
    });

    // Chargement des données du critère et mise à jour du formulaire
    this.criteriaService
      .getOneCriteria(this.data.criteriaId)
      .then((criteria) => {
        this.criteria = criteria;
        if (criteria) {
          this.form.patchValue({
            name: criteria.name,
            description: criteria.description,
          });
        }
      });
  }

  submit() {
    if (this.form.valid) {
      this.updateCriteria();
    }
  }

  updateCriteria() {
    const name = this.form.value.name as string;
    const description = this.form.value.description as string;
    const id = this.data.criteriaId;
    this.criteriaService.updateCriteria(id, name, description).then(() => {
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
