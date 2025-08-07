import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

@Component({
  selector: 'app-criteria-confirm',
  imports: [],
  template: `
    <div class="p-8 bg-white rounded-3xl shadow-lg">
  <h2 class="text-xl font-semibold text-slate-800 mb-4">Confirmation</h2>
  <p class="text-sm text-slate-600 mb-6">{{ data.message }}</p>

  <div class="flex justify-end gap-4">
    <button
      (click)="close()"
      type="button"
      class="bg-slate-200 hover:bg-slate-300 cursor-pointer text-slate-700 font-semibold py-2 px-6 rounded-xl transition-all duration-200 transform hover:scale-105"
    >
      Annuler
    </button>
    <button
      (click)="onYes()"
      class="bg-orange-500 text-white cursor-pointer font-semibold py-2 px-6 rounded-xl transition-all duration-200 transform hover:scale-105 shadow-md hover:shadow-lg"
    >
      Exécuter
    </button>
  </div>
</div>
  `,
})
export class CriteriaConfirmComponent {
  constructor(
    public dialogRef: MatDialogRef<CriteriaConfirmComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { message: string }
  ) { }

  close() {
    this.dialogRef.close(false);
  }

  onYes() {
    this.dialogRef.close(true);
  }
}
