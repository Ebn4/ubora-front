import { ActivatedRoute } from '@angular/router';
import { Component, inject, signal } from '@angular/core';
import { BaseListWidget } from '../../../widgets/base-list-widget';
import { Candidacy } from '../../../models/candidacy';
import { CandidacyService } from '../../../services/candidacy.service';
import { Interview } from '../../../models/interview';
import { PeriodService } from '../../../services/period.service';
import { Period } from '../../../models/period';
import { PeriodStatus } from '../../../enum/period-status.enum';
import { FilePreviewService } from '../../../services/file-preview.service';
import { ImportService } from '../../../services/import.service';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { DocPreviewComponent } from '../../preselection/candidacy-preselection/doc-preview/doc-preview.component';
import { NgFor, NgIf } from '@angular/common';
import { TextPreviewDialogComponent } from '../../layout/shared/text-preview-dialog/text-preview-dialog.component';
import { MatSnackBar } from '@angular/material/snack-bar';
import { catchError, finalize, delay } from 'rxjs/operators';
import { of } from 'rxjs';

@Component({
  selector: 'app-candidacy-informations',
  imports: [NgIf, NgFor],
  templateUrl: './candidacy-informations.component.html',
})
export class CandidacyInformationsComponent extends BaseListWidget {
  constructor(private _matDialog: MatDialog) {
    super();
  }
  protected readonly PeriodStatus = PeriodStatus;

  candidacyId!: number;
  candidacy?: Candidacy;
  candidateHasSelected = signal(true);

  interview = signal<Interview | null>(null);
  period = signal<Period | null>(null);

  rejectionReasonsList: string[] = [];

  candidacyService = inject(CandidacyService);
  filePreviewService = inject(FilePreviewService);
  periodService = inject(PeriodService);
  importService: ImportService = inject(ImportService);
  route: ActivatedRoute = inject(ActivatedRoute);
  snackBar = inject(MatSnackBar);

  age!: number;

  // États de chargement
  isLoading = true;
  isLoadingInterview = true;
  isLoadingPeriod = true;

  ngOnInit(): void {
    this.loadData();
  }

  override loadData() {
    this.isLoading = true;
    this.candidacyId = Number(this.route.snapshot.paramMap.get('id'));

    this.candidacyService
      .getOneCandidacy(this.candidacyId)
      .pipe(
        catchError((error) => {
          console.error('Error loading candidacy:', error);
          return of(null);
        }),
        finalize(() => {
          this.isLoading = false;
        })
      )
      .subscribe({
        next: (response) => {
          if (response?.data) {
            const candidate = response.data;
            this.candidacy = candidate;
            this.parseRejectionReasons();
            this.age = this.calculateAge(this.candidacy?.etn_naissance ?? '');

            // Charger les données supplémentaires
            this.loadCandidateInterviewInfo();
            this.loadPeriodById(candidate.period_id);
            this.checkIfCandidateHasSelected();
          }
        },
      });
  }

  loadCandidateInterviewInfo() {
    this.isLoadingInterview = true;
    this.candidacyService.getCandidateInterview(this.candidacyId ?? 0)
      .pipe(
        catchError((error) => {
          console.error('Error loading interview:', error);
          return of(null);
        }),
        finalize(() => {
          this.isLoadingInterview = false;
        })
      )
      .subscribe({
        next: (value) => {
          if (value?.data) {
            this.interview.set(value.data);
          }
        }
      });
  }

  loadPeriodById(periodId: number) {
    this.isLoadingPeriod = true;
    this.periodService.getOnePeriod(periodId)
      .pipe(
        catchError((error) => {
          console.error('Error loading period:', error);
          return of(null);
        }),
        finalize(() => {
          this.isLoadingPeriod = false;
        })
      )
      .subscribe({
        next: (value) => {
          if (value) {
            this.period.set(value);
          }
        }
      });
  }

  checkIfCandidateHasSelected() {
    this.candidacyService
      .candidateHasSelected(this.candidacyId)
      .pipe(
        catchError((error) => {
          console.error('Error checking selection:', error);
          return of({ hasSelection: false });
        })
      )
      .subscribe({
        next: (value) => {
          this.candidateHasSelected.set(value.hasSelection);
        }
      });
  }

  onEvaluated() {
    this.loadData();
    this.candidateHasSelected.set(true);
  }

  docPreview(fileName: any) {
    const actualFileName = fileName;

    this.importService.getDocument(actualFileName).subscribe((file) => {
      const blob = new Blob([file], { type: file.type });
      const fileFromUrl = new File([blob], "test-doc.docx", { type: blob.type });

      this.filePreviewService.previewFile(fileFromUrl).subscribe({
        next: (result) => {
          const dialogConfig = new MatDialogConfig();
          dialogConfig.disableClose = true;
          dialogConfig.data = { currentPreview: result };

          const dialogRef = this._matDialog.open(DocPreviewComponent, dialogConfig);

          dialogRef.afterClosed().subscribe((result) => {
            if (result) {
            }
          });
        },
        error: (error) => {
          console.log(error);
        }
      });
    });
  }

  calculateAge(dateNaissance: string): number {
    const birthDate = new Date(dateNaissance);
    const today = new Date();

    let age = today.getFullYear() - birthDate.getFullYear();

    const monthDiff = today.getMonth() - birthDate.getMonth();
    const dayDiff = today.getDate() - birthDate.getDate();

    // Si l'anniversaire n'est pas encore passé cette année
    if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
      age--;
    }

    return age;
  }

  parseRejectionReasons() {
    // Réinitialiser la liste
    this.rejectionReasonsList = [];

    // Vérifier si des raisons existent
    if (this.candidacy?.rejection_reasons) {
      const reasons = this.candidacy.rejection_reasons;

      // Si la chaîne contient des points-virgules, séparer
      if (reasons.includes(';')) {
        this.rejectionReasonsList = reasons
          .split(';')
          .map(reason => reason.trim())
          .filter(reason => reason.length > 0);
      }
      // Sinon, utiliser la chaîne complète comme une seule raison
      else if (reasons.trim().length > 0) {
        this.rejectionReasonsList = [reasons.trim()];
      }
    }
  }

  openLetterDialog(content: string | null | undefined) {
    if (!content) {
      this.snackBar.open('Lettre de motivation indisponible', 'Fermer', {
        duration: 3000
      });
      return;
    }

    this._matDialog.open(TextPreviewDialogComponent, {
      width: '1200px',
      maxWidth: '90vw',
      height: '85vh',
      panelClass: 'modern-dialog',
      autoFocus: false,
      data: { content }
    });
  }

  isFile(value: string | null | undefined): boolean {
    if (!value) return false;

    // On considère que si c'est une URL ou un nom de fichier avec extension, c'est un "fichier"
    const fileExtensions = ['.pdf', '.doc', '.docx', '.txt'];
    return fileExtensions.some(ext => value.toLowerCase().endsWith(ext));
  }
}