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
  age! : number;

  constructor(private router: Router, private _matDialog: MatDialog) { }

  ngOnInit() {
    const navData = this.preselectionService.getCandidacy();

    // Vérification de sécurité
    if (!navData || !navData.all || !Array.isArray(navData.all) || navData.all.length === 0) {
      console.error('Données de navigation invalides :', navData);
      this.router.navigate(['/evaluator-candidacies']);
      return;
    }

    // Récupération des données transmises
    this.candidaciesList = navData.all;
    this.currentIndex = navData.currentIndex;
    this.periodId = Number(this.route.snapshot.paramMap.get('periodId'));
    this.evaluateurId = Number(this.route.snapshot.paramMap.get('evaluateurId'));

    // Charger la candidature + critères
    this.loadDataCandidacy();
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

        if(this.candidacy?.etn_naissance) {
          this.age = this.calculateAge(this.candidacy.etn_naissance);
          console.log("L'âge du candidat :", this.age);
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

    // Mettre à jour l'URL sans recharger le composant
    this.router.navigate(
      ['/evaluator-candidacies-single', candidacy.id, candidacy.dispatch[0].pivot?.id || 0, this.periodId, this.evaluateurId],
      { replaceUrl: true } // ← modifie l’URL sans push dans history
    );

    // Mettre à jour les données locales
    this.loadDataCandidacy();
    this.loadDataCriteria();
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
      const fileFromUrl = new File([blob], fileName, { type: blob.type });

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

  promotionMap: { [key: string]: string } = {
    'L0' : 'Préparatoire',
    'L1': 'Licence 1',
    'L2': 'Licence 2',
    'L3': 'Licence 3',
    'L4' : 'LICENCE 4',
    'B1' : 'BACHELOR 1',
    'B2' : 'Bachelor 2',
    'B3' : 'Bachelor 3',
    'B4' : 'Bachelor 4',
    'M1': 'Master 1',
    'M2': 'Master 2',
    'D1': 'Doctorat 1',
    'D2': 'Doctorat 2',
    'D3': 'Doctorat 3',
    'D4': 'Doctorat 4',
    'D5': 'Doctorat 5',
    'D6': 'Doctorat 6'
  };

  getPromotionName(promo?: string): string {
    return this.promotionMap[promo || ''] || promo || 'Non renseigné';
  }
}
