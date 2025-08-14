import { Component, inject } from '@angular/core';
import { Candidacy } from '../../../models/candidacy';
import { CandidacyService } from '../../../services/candidacy.service';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CriteriaPeriod } from '../../../models/criteria-period';
import { CriteriaService } from '../../../services/criteria.service';
import { PeriodStatus } from '../../../enum/period-status.enum';
import { ImportService } from '../../../services/import.service';
import { NgClass, NgFor, NgIf } from '@angular/common';
import { PreselectionService } from '../../../services/preselection.service';
import { FilePreviewResult, FilePreviewService } from '../../../services/file-preview.service';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { DocPreviewComponent } from './doc-preview/doc-preview.component';

@Component({
  selector: 'app-candidacy-preselection',
  imports: [RouterLink, NgIf, NgFor, NgClass],
  templateUrl: './candidacy-preselection.component.html',
})
export class CandidacyPreselectionComponent {
  currentPreview: FilePreviewResult | null = null;
  candidacyId!: number;
  dispatch_preselections_id!: number;
  preselectionCheck = false
  period_status: string = PeriodStatus.STATUS_PRESELECTION
  period_status_true: boolean = false;

  candidacy?: Candidacy;
  candidacyService: CandidacyService = inject(CandidacyService);
  filePreviewService = inject(FilePreviewService)
  route: ActivatedRoute = inject(ActivatedRoute);
  importService: ImportService = inject(ImportService);
  preselectionService: PreselectionService = inject(PreselectionService);


  criterias: CriteriaPeriod[] = [];
  selectedCriteriaIds: any[] = [];
  criteriaOng: any;
  criteriaService: CriteriaService = inject(CriteriaService);
  periodId!: number;
  evaluateurId!: number;
  type: string = PeriodStatus.STATUS_PRESELECTION;
  search: string = '';

  candidaciesList: any;
  currentIndex: number = 0;

  constructor(private router: Router, private _matDialog: MatDialog) { }

  ngOnInit() {
    this.candidaciesList = this.preselectionService.getCandidacy();
    const currentId = Number(this.route.snapshot.paramMap.get('id'));
    this.currentIndex = this.candidaciesList.findIndex((c: any) => c.id === currentId);
    this.loadDataCandidacy()
    this.loadDataCriteria();
  }

  loadDataCandidacy() {
    const candidacyId = this.candidaciesList[this.currentIndex]?.id;
    this.candidacyService.getOneCandidacy(candidacyId).subscribe({
      next: (response) => {
        this.candidacy = response.data;
        this.period_status = this.candidacy.period_status;
        if(this.period_status != PeriodStatus.STATUS_PRESELECTION) {
          this.period_status_true = true;
        }
      },
      error: (error) => {
        console.error('Erreur chargement candidature:', error);
      }
    });
  }

  goToPrevious() {
    if (this.currentIndex > 0) {
      this.currentIndex--;
      this.updateRouteAndLoad();
    }
  }

  goToNext() {
    if (this.currentIndex < this.candidaciesList.length - 1) {
      this.currentIndex++;
      this.updateRouteAndLoad();
    }
  }

  updateRouteAndLoad() {
    const candidacy = this.candidaciesList[this.currentIndex];
    this.router.navigate(
      ['/evaluator-candidacies-single', candidacy.id, candidacy.dispatch[0].pivot?.id || 0, this.periodId, this.evaluateurId],
      { replaceUrl: true }
    );
    this.loadDataCandidacy();
    this.loadDataCriteria()
  }

  loadDataCriteria() {
    this.periodId = Number(this.route.snapshot.paramMap.get('periodId'));
    this.evaluateurId = Number(this.route.snapshot.paramMap.get('evaluateurId'));
    const candidacy = this.candidaciesList[this.currentIndex];
    this.criteriaService
      .getPeriodCriterias(this.periodId, this.search, candidacy.dispatch[0].pivot?.id, this.evaluateurId)
      .subscribe({
        next: (response) => {
          this.criterias = response.data
            .filter((c) => c.type === "PRESELECTION")
            .map((c) => ({
              ...c,
              isChecked: c.valeur === 1 ? true : false,
            }));
          this.preselectionCheck = this.criterias.some(c => c.isChecked);
        },
        error: (error) => {
          console.error('Error fetching criteria:', error);
        },
      });
  }

  onToggleCriteria(period_criteria_id: number, event: Event) {
    const checked = (event.target as HTMLInputElement).checked;
    const critere = this.criterias.find((c) => c.period_criteria_id === period_criteria_id);
    if (critere) {
      critere.isChecked = checked;
    }
  }

  preselectionCandidacy() {
    this.dispatch_preselections_id = Number(this.route.snapshot.paramMap.get('dispatchId'));
    const data = this.criterias.map(c => ({
      period_criteria_id: c.period_criteria_id,
      dispatch_preselections_id: this.dispatch_preselections_id,
      valeur: c.isChecked
    }));

    this.preselectionService.preselectionCandidacy(data).subscribe({
      next: (res) => {
        this.preselectionCheck = true
        if (this.currentIndex < this.candidaciesList.length - 1) {
          this.goToNext();
        } else {
          this.router.navigate(['/evaluator-candidacies']);
        }
      },
      error: (err) => {
        console.error('Erreur lors de la préselection', err);
      }
    });
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

  closePreview() {
    this.currentPreview = null;
  }
}
