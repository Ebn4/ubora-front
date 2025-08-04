import {Component, inject, signal} from '@angular/core';
import {ImportService} from '../../../services/import.service';
import {MatDialogRef} from '@angular/material/dialog';
import {NgClass, NgIf} from '@angular/common';
import {MatSnackBar} from '@angular/material/snack-bar';

@Component({
  selector: 'app-import-documents',
  imports: [
    NgIf,
    NgClass
  ],
  templateUrl: './import-documents.component.html',
  styles: ``
})
export class ImportDocumentsComponent {
  importService: ImportService = inject(ImportService);
  snackbar = inject(MatSnackBar)

  result = false;
  isLoading = false;

  isProcessing = signal<boolean>(false);
  error = signal<string | null>(null);
  selectedFile = signal<File | null>(null);

  constructor(
    public dialogRef: MatDialogRef<ImportDocumentsComponent>,
  ) {
  }

  closeModal() {
    this.dialogRef.close();
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;

    if (input.files && input.files.length > 0) {
      const file = input.files[0];

      // Validate file type
      if (!file.name.toLowerCase().endsWith('.zip')) {
        this.error.set('Please select a ZIP file');
        return;
      }

      this.selectedFile.set(file);
      this.error.set(null);

    }
  }

  triggerFileInput(): void {
    const fileInput = document.getElementById(
      'zipFileInput'
    ) as HTMLInputElement;
    if (fileInput) {
      fileInput.click();
    }
  }

  onImportClick() {

    this.isLoading = true;

    try {
      const file = this.selectedFile()
      if (file) {
        this.importService
          .uploadDocument(
            file
          )
          .subscribe({
            next: (response) => {
              this.snackbar.open(response.message, 'Fermer', {duration: 3000})
              this.closeModal();
            },
            error: (error) => {
              console.error("Erreur lors de l'envoi des données:", error);
              "Une erreur est survenue lors de l'envoi des données : " + error.message;
            },
          });
      }

    } catch (error) {
      console.error(error);
      alert("Une erreur est survenue lors de l'envoi des données :");
    } finally {
      this.isLoading = false;
    }
  }
}
