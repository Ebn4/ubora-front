import { Component, type OnInit, Inject } from "@angular/core";
import { MatDialogModule, MAT_DIALOG_DATA } from "@angular/material/dialog";
import { CommonModule } from "@angular/common";
import { TextCleanerService } from "../../../../services/text-cleaner.service";

@Component({
  standalone: true,
  imports: [CommonModule, MatDialogModule],
  template: `
    <h2 mat-dialog-title class="bg-gradient-to-r from-orange-600 to-orange-500 text-white px-8 py-5 font-bold text-2xl flex items-center gap-3 shadow-md">
      <svg xmlns="http://www.w3.org/2000/svg" class="h-7 w-7 opacity-95" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8">
        <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M3 9.75a9 9 0 0118 0m-9 4.5a2.25 2.25 0 110-4.5 2.25 2.25 0 010 4.5z" />
      </svg>
      Lettre de motivation
    </h2>

    <mat-dialog-content class="p-0">
      <div class="p-6 bg-gray-50 rounded-b-xl shadow-inner max-h-[82vh] overflow-auto">
        <!-- Wrapper centré large -->
        <div class="max-w-5xl mx-auto bg-white rounded-xl border border-gray-200 shadow-lg overflow-hidden">
          <!-- En-tête orange -->
          <div class="bg-gradient-to-r from-orange-600 to-orange-500 text-white p-6">
            <h3 class="text-xl font-semibold tracking-tight flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M3 9.75a9 9 0 0118 0m-9 4.5a2.25 2.25 0 110-4.5 2.25 2.25 0 010 4.5z" />
              </svg>

            </h3>
          </div>

          <!-- Corps de la lettre -->
          <div class="p-10 font-sans text-gray-800 leading-relaxed text-lg space-y-6">
            <div class="prose prose-lg max-w-none whitespace-pre-line break-words">
              {{ cleanedContent }}
            </div>
          </div>
        </div>
      </div>
    </mat-dialog-content>

    <mat-dialog-actions align="end" class="bg-gray-50 px-8 py-5 border-t border-gray-200">
      <button
        mat-button
        mat-dialog-close
        class="text-gray-700 hover:bg-gray-100 font-medium px-5 py-2.5 rounded-lg text-base transition duration-200 flex items-center gap-2">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
        Fermer
      </button>
      <button
        mat-flat-button
        (click)="copyToClipboard()"
        class="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold px-6 py-2.5 rounded-lg text-base shadow-md hover:shadow-lg transition-all duration-250 flex items-center gap-2 transform hover:-translate-y-0.5">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-4 4h6m-6 4h6m-6 4h6" />
        </svg>
        Copier la lettre
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    :host ::ng-deep .mat-mdc-dialog-container {
      max-width: 1200px !important; /* ✅ Plus large */
      width: 95vw;
      border-radius: 16px !important;
      overflow: hidden;
    }

    /* Typo moderne — Inter recommandée */
    .prose {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
    }

    /* Mise en valeur subtile des paragraphes */
    .prose > p {
      position: relative;
      padding-left: 1.5rem;
    }

    .prose > p:not(:first-child)::before {
      content: '';
      position: absolute;
      left: 0;
      top: 1rem;
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: #FF9000;
      opacity: 0.8;
    }

    /* Titres dans la lettre */
    .prose h1, .prose h2, .prose h3 {
      color: #1f2937;
      font-weight: 700;
      margin-top: 1.75rem;
      margin-bottom: 0.875rem;
      padding-bottom: 0.375rem;
      border-bottom: 2px solid #FF9000;
      display: inline-block;
    }

    .prose h1 { font-size: 1.5rem; }
    .prose h2 { font-size: 1.375rem; }
    .prose h3 { font-size: 1.25rem; }

    .prose a {
      color: #FF9000;
      font-weight: 600;
      text-decoration: none;
    }
    .prose a:hover {
      text-decoration: underline;
    }

    /* Espacement global */
    .prose > * + * {
      margin-top: 1.25rem;
    }
  `],
})
export class TextPreviewDialogComponent implements OnInit {
  cleanedContent = "";
  currentDate = new Date();

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: { content: string },
    private textCleaner: TextCleanerService,
  ) {}

  ngOnInit() {
    this.cleanedContent = this.textCleaner.cleanMotivationLetter(this.data.content);
  }

  copyToClipboard(): void {
    navigator.clipboard
      .writeText(this.cleanedContent)
      .then(() => {
        console.log("✅ Lettre copiée — orange & puissante !");
      })
      .catch((err) => {
        console.error("❌ Échec de la copie :", err);
      });
  }
}
