import { Component, type OnInit, Inject } from "@angular/core";
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";
import { CommonModule } from "@angular/common";
import { TextCleanerService } from "../../../../services/text-cleaner.service";
import { MatSnackBarModule, MatSnackBar } from "@angular/material/snack-bar";

@Component({
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatSnackBarModule],
  template: `
    <!-- En-tête fixe -->
    <div class="sticky top-0 z-10 bg-white border-b border-gray-200 px-6 py-4 shadow-sm">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-3">
          <div class="p-2 rounded-lg bg-gradient-to-r from-blue-50 to-blue-100">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <div>
            <h2 class="text-xl font-semibold text-gray-900">Lettre de motivation</h2>
            <p class="text-sm text-gray-500">Consultation et copie</p>
          </div>
        </div>
        <button
          mat-dialog-close
          class="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200 text-gray-500 hover:text-gray-700"
          aria-label="Fermer"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>

    <!-- Contenu principal -->
    <div class="flex-1 overflow-auto bg-gray-50">
      <div class="max-w-4xl mx-auto p-6">
        <!-- Carte de contenu -->
        <div class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <!-- En-tête de la lettre -->
          <div class="border-b border-gray-100 px-8 py-6 bg-gradient-to-r from-blue-50 to-indigo-50">
            <div class="flex items-center justify-between">
              <div>
                <h3 class="text-lg font-medium text-gray-900">Lettre de motivation</h3>
              </div>
            </div>
          </div>

          <!-- Corps de la lettre -->
          <div class="px-8 py-10">
            <div class="prose prose-lg max-w-none min-h-[400px]">
              <div class="whitespace-pre-wrap break-words font-sans leading-relaxed text-gray-800 text-[15px]">
                {{ cleanedContent }}
              </div>

              <!-- État vide -->
              <div *ngIf="!cleanedContent" class="text-center py-12">
                <div class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h4 class="text-lg font-medium text-gray-900 mb-2">Lettre non disponible</h4>
                <p class="text-gray-600">Le contenu de la lettre de motivation est vide ou inaccessible.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Barre d'actions fixe -->
    <div class="sticky bottom-0 border-t border-gray-200 bg-white px-6 py-4 shadow-lg">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-3">
          <button
            mat-button
            mat-dialog-close
            class="px-5 py-2.5 text-gray-700 hover:bg-gray-100 font-medium rounded-lg border border-gray-300 transition-colors duration-200 text-sm"
          >
            Fermer
          </button>
          <button
            mat-flat-button
            (click)="copyToClipboard()"
            class="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-medium rounded-lg shadow-sm hover:shadow transition-all duration-200 text-sm flex items-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-4 4h6m-6 4h6m-6 4h6" />
            </svg>
            Copier la lettre
          </button>
          <button
            mat-stroked-button
            (click)="downloadAsText()"
            class="px-5 py-2.5 border border-blue-600 text-blue-600 hover:bg-blue-50 font-medium rounded-lg transition-colors duration-200 text-sm flex items-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Télécharger
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: flex;
      flex-direction: column;
      height: 100%;
    }

    :host ::ng-deep .mat-mdc-dialog-container {
      max-width: 1200px !important;
      width: 90vw;
      height: 85vh;
      border-radius: 12px !important;
      overflow: hidden;
      padding: 0 !important;
    }

    .prose {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.7;
    }

    .prose p {
      margin-bottom: 1.25em;
      text-align: justify;
    }

    .prose p:first-child {
      text-indent: 2em;
    }

    .prose strong {
      color: #1e40af;
      font-weight: 600;
    }

    /* Styles pour les listes */
    .prose ul, .prose ol {
      margin-left: 1.5em;
      margin-bottom: 1.25em;
    }

    .prose li {
      margin-bottom: 0.5em;
      position: relative;
    }

    .prose ul li::before {
      content: '•';
      color: #3b82f6;
      font-weight: bold;
      position: absolute;
      left: -1em;
    }

    /* Styles pour les signatures */
    .prose p:last-of-type {
      margin-top: 3em;
      text-align: right;
      font-style: italic;
    }
  `],
})
export class TextPreviewDialogComponent implements OnInit {
  cleanedContent = "";
  currentDate = new Date();

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: { content: string },
    private textCleaner: TextCleanerService,
    private snackBar: MatSnackBar,
    private dialogRef: MatDialogRef<TextPreviewDialogComponent>
  ) {}

  ngOnInit() {
    this.cleanedContent = this.textCleaner.cleanMotivationLetter(this.data.content);
  }

  copyToClipboard(): void {
    navigator.clipboard
      .writeText(this.cleanedContent)
      .then(() => {
        this.snackBar.open('Lettre copiée dans le presse-papier', 'Fermer', {
          duration: 3000,
          horizontalPosition: 'center',
          verticalPosition: 'bottom',
        });
      })
      .catch((err) => {
        console.error('Erreur lors de la copie :', err);
        this.snackBar.open('Erreur lors de la copie', 'Fermer', {
          duration: 3000,
        });
      });
  }

  downloadAsText(): void {
    if (!this.cleanedContent) return;

    const blob = new Blob([this.cleanedContent], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    const fileName = `lettre-motivation-${new Date().toISOString().split('T')[0]}.txt`;

    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);

    this.snackBar.open('Téléchargement démarré', 'Fermer', {
      duration: 3000,
    });
  }
}