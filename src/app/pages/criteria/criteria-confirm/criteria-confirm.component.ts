import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

@Component({
  selector: 'app-criteria-confirm',
  imports: [],
  template: `
    <div class="p-6 bg-white">
      <h2 class="text-lg font-bold mb-2">Confirmation</h2>
      <p class="mb-4">{{ data.message }}</p>
      <div class="flex justify-end gap-2">
      </div>

      <div class="flex justify-end space-x-2">
        <button
          (click)="close()"
          type="button"
          class="bg-gray-300 hover:bg-gray-400 cursor-pointer text-gray-800 font-bold py-2 px-4 rounded-lg transition duration-300"
        >
          Annuler
        </button>
        <button
          (click)="onYes()"
          class="bg-primary hover:bg-orange-600 text-white cursor-pointer font-bold py-2 px-4 rounded-lg transition duration-300"
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
  ) {}

  close() {
    this.dialogRef.close(false);
  }

  onYes() {
    this.dialogRef.close(true);
  }
}
