import { Component, inject } from '@angular/core';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-confirm-dispatch-dialog',
  standalone: true,
  imports: [
    MatDialogModule,
    MatButtonModule,
    MatIconModule
  ],
  template: `
    <div class="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">

      <!-- HEADER -->
      <div class="flex justify-between items-center mb-4">
        <h3 class="text-xl font-bold text-black">
          Confirmation
        </h3>

        <button
          class="text-gray-500 hover:text-gray-700 transition"
          (click)="close(false)">

          <svg xmlns="http://www.w3.org/2000/svg"
               class="h-6 w-6"
               fill="none"
               viewBox="0 0 24 24"
               stroke="currentColor">
            <path stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M6 18L18 6M6 6l12 12"/>
          </svg>

        </button>
      </div>

      <!-- CONTENT -->
      <div class="mb-6 text-gray-700">
        Voulez-vous vraiment dispatcher les candidats ?
        <p class="mt-2 font-semibold text-black">
          Cette action est irréversible.
        </p>
      </div>

      <!-- ACTIONS -->
      <div class="flex justify-end space-x-2">

        <button
          type="button"
          (click)="close(false)"
          class="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded-lg transition duration-300">
          Annuler
        </button>

        <button
          type="button"
          (click)="close(true)"
          class="bg-orange-500 hover:bg-orange-600 text-white font-bold py-2 px-4 rounded-lg transition duration-300">
          Confirmer
        </button>

      </div>

    </div>
  `
})
export class ConfirmDispatchDialogComponent {
  private dialogRef = inject(MatDialogRef<ConfirmDispatchDialogComponent>);

  close(result: boolean) {
    this.dialogRef.close(result);
  }
}
