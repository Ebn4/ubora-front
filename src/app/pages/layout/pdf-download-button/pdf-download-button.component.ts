import { Component, Input, Output, EventEmitter, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar } from '@angular/material/snack-bar';
import { PdfService } from '../../../services/pdf.service';
import { CandidacyService } from '../../../services/candidacy.service';
import { CriteriaService } from '../../../services/criteria.service';

@Component({
  selector: 'app-pdf-download-button',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTooltipModule
  ],
  template: `
    <button
      mat-raised-button
      color="primary"
      [disabled]="isGenerating() || !candidateId || !periodId"
      (click)="generatePdfReport()"
      class="pdf-download-button"
      [matTooltip]="getTooltipText()">

      <div class="button-content">
        <mat-icon *ngIf="!isGenerating()">picture_as_pdf</mat-icon>
        <mat-spinner *ngIf="isGenerating()" diameter="20"></mat-spinner>
        <span class="button-text">
          {{ isGenerating() ? 'Génération...' : 'Télécharger le PDF' }}
        </span>
      </div>
    </button>
  `,
  styles: [`
    .pdf-download-button {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 8px 16px;
      border-radius: 8px;
      font-weight: 500;
      transition: all 0.3s ease;
      background: linear-gradient(135deg, #FF8C00, #FF7A00);
      color: white;
    }

    .pdf-download-button:hover:not([disabled]) {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(255, 140, 0, 0.3);
    }

    .pdf-download-button:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .button-content {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .button-text {
      margin-left: 4px;
    }

    ::ng-deep .mat-mdc-progress-spinner {
      --mdc-circular-progress-active-indicator-color: white;
    }
  `]
})
export class PdfDownloadButtonComponent {
  @Input() candidateId!: number;
  @Input() periodId!: number;
  @Input() candidateData: any;
  @Input() showScore: boolean = false;

  @Output() pdfGenerated = new EventEmitter<void>();
  @Output() pdfError = new EventEmitter<string>();

  private pdfService = inject(PdfService);
  private candidacyService = inject(CandidacyService);
  private criteriaService = inject(CriteriaService);
  private snackBar = inject(MatSnackBar);

  isGenerating = signal(false);

  getTooltipText(): string {
    if (!this.candidateId || !this.periodId) {
      return 'Données manquantes';
    }
    if (this.isGenerating()) {
      return 'Génération du PDF en cours...';
    }
    return 'Télécharger le rapport d\'évaluation en PDF';
  }

  async generatePdfReport() {
    if (!this.candidateId || !this.periodId || this.isGenerating()) {
      return;
    }

    this.isGenerating.set(true);

    try {
      // Récupérer les données
      const data = await this.pdfService.fetchCandidateEvaluationData(
        this.candidateId,
        this.periodId,
        this.candidacyService,
        this.criteriaService
      );

      // Générer le PDF
      await this.pdfService.generateEvaluationReport(
        data.candidateData,
        data.criteriaList,
        data.evaluationResults
      );

      // Succès
      this.snackBar.open('PDF généré avec succès', 'Fermer', {
        duration: 3000,
        panelClass: ['success-snackbar']
      });

      this.pdfGenerated.emit();

    } catch (error: any) {
      console.error('Erreur génération PDF:', error);

      const errorMessage = error?.message || 'Erreur lors de la génération du PDF';
      this.snackBar.open(errorMessage, 'Fermer', {
        duration: 5000,
        panelClass: ['error-snackbar']
      });

      this.pdfError.emit(errorMessage);
    } finally {
      this.isGenerating.set(false);
    }
  }
}
