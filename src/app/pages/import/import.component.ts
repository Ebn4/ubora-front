import { Component, inject } from '@angular/core';
import { ImportService } from '../../services/import.service';
import { NgIf } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-import',
  imports: [NgIf, FormsModule],
  templateUrl: './import.component.html',
})
export class ImportComponent {
  message: string = '';
  selectedPeriod: string = '';
  isLoading = false;
  isLoadingDoc = false;
  importService: ImportService = inject(ImportService);

  selectedFile: File | null = null;
  selectedDocFile: File | null = null;


  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) {
      this.selectedFile = null;
      return;
    }
    this.selectedFile = input.files[0];
  }

  onFileDocSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedDocFile = input.files[0];
    }
  }

  async onSubmit() {
    if (!this.selectedDocFile) {
      alert('Veuillez sélectionner un document.');
      return;
    }
    this.isLoadingDoc = true;
    const result = await this.importService.uploadDocument(
      this.selectedDocFile
    );
    alert(result.message);
  }

  async onImportClick() {
    if (!this.selectedFile) {
      alert('Veuillez sélectionner un fichier.');
      return;
    }
    this.isLoading = true;
    try {
      const result = await this.importService.uploadCandidacies(
        this.selectedFile,
        this.selectedPeriod
      );
      this.message = result.message;
      alert('Le fichier a été envoyé avec succès.');
    } catch (error) {
      console.error(error);
      alert("Une erreur est survenue lors de l'envoi du fichier.");
    } finally {
      this.isLoading = false;
    }
  }
}
