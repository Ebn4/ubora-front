import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { TextCleanerService } from '../../../../services/text-cleaner.service';

@Component({
  standalone: true,
  imports: [CommonModule, MatDialogModule],
  template: `
    <h2 mat-dialog-title class="bg-gradient-to-r from-gray-800 to-gray-900 text-white px-6 py-4 font-bold text-xl flex items-center gap-3 shadow-sm">
      <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
        <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"/>
      </svg>
      Lettre de motivation
    </h2>

    <mat-dialog-content class="p-0">
      <div class="p-6 bg-white border border-gray-200 rounded-b-lg shadow-inner max-h-[85vh] min-h-[60vh] overflow-auto">
        <!-- Contenu nettoyé, optimisé pour la lisibilité -->
        <div class="prose prose-lg max-w-none text-gray-800 whitespace-pre-wrap break-words leading-relaxed">
          {{ cleanedContent }}
        </div>
      </div>
    </mat-dialog-content>

    <mat-dialog-actions align="end" class="bg-gray-50 px-6 py-4 border-t border-gray-200">
      <button mat-button mat-dialog-close class="text-gray-700 hover:bg-gray-100 font-medium px-4 py-2 rounded-md">
        Fermer
      </button>
      <button mat-flat-button color="primary" (click)="copyToClipboard()" class="font-medium px-4 py-2">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 inline mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-4 4h6m-6 4h6m-6 4h6" />
        </svg>
        Copier le texte
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    /* Optionnel : améliore encore la lisibilité du texte long */
    .prose {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
    }
  `]
})
export class TextPreviewDialogComponent implements OnInit {
  cleanedContent: string = '';

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: { content: string },
    private textCleaner: TextCleanerService
  ) {}

  ngOnInit() {
    this.cleanedContent = this.textCleaner.cleanMotivationLetter(this.data.content);
  }

  copyToClipboard(): void {
    navigator.clipboard.writeText(this.cleanedContent).then(() => {
      // ✅ Optionnel : intégrer MatSnackBar ou une toast pour confirmation visuelle
      console.log('✅ Texte copié dans le presse-papier');
    }).catch(err => {
      console.error('❌ Échec de la copie :', err);
    });
  }
}
