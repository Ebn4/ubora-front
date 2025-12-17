import { Component, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { Candidacy } from '../../../models/candidacy';
import { CandidacyService } from '../../../services/candidacy.service';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { PeriodStatus } from '../../../enum/period-status.enum';
import { ImportService } from '../../../services/import.service';
import { AsyncPipe, CommonModule } from '@angular/common';
import { Interview } from '../../../models/interview';
import { Period } from '../../../models/period';
import { EvaluationComponent } from '../../evaluation/evaluation.component';
import { PeriodService } from '../../../services/period.service';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { DocPreviewComponent } from '../../preselection/candidacy-preselection/doc-preview/doc-preview.component';
import { FilePreviewService } from '../../../services/file-preview.service';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatAutocomplete, MatAutocompleteTrigger, MatOption } from '@angular/material/autocomplete';
import { MatInput } from '@angular/material/input';
import { Observable, of, Subject } from 'rxjs';
import { SelectionService } from '../../../services/selection.service';
import { debounceTime, distinctUntilChanged, switchMap, takeUntil, catchError, tap } from 'rxjs/operators';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TextPreviewDialogComponent } from '../../layout/shared/text-preview-dialog/text-preview-dialog.component';

@Component({
  selector: 'app-candidacy-selection',
  imports: [RouterLink, EvaluationComponent, AsyncPipe, FormsModule, MatAutocomplete, MatAutocompleteTrigger, MatInput, MatOption, ReactiveFormsModule,CommonModule],
  templateUrl: './candidacy-selection.component.html',
})
export class CandidacySelectionComponent implements OnInit, OnDestroy {

  constructor(private _matDialog: MatDialog) {}

  periodService = inject(PeriodService);
  filePreviewService = inject(FilePreviewService);
  candidacyService = inject(CandidacyService);
  route = inject(ActivatedRoute);
  selectionService = inject(SelectionService);
  router = inject(Router);
  importService = inject(ImportService);
  snackBar = inject(MatSnackBar);

  // Données principales
  candidacy?: Candidacy;
  candidatesList: Candidacy[] = [];
  currentIndex: number = 0;

  // Signaux pour les données asynchrones
  interview = signal<Interview | null>(null);
  period = signal<Period | null>(null);
  candidateHasSelected = signal(false);
  isLoading = signal(false);

  // Pour réinitialiser le formulaire
  resetEvaluationForm = signal(0);
  age!:number;

  // Pour la recherche avec debounce
  query = new FormControl('');
  filterCandidates: Observable<Candidacy[]> | undefined;

  // Cache pour éviter les requêtes répétées
  private periodCache = new Map<number, Period>();
  private interviewCache = new Map<number, Interview | null>();
  private destroy$ = new Subject<void>();

  ngOnInit() {
    // this.setupSearch();

    this.route.paramMap.pipe(
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(params => {
      const id = Number(params.get('id'));
      this.loadCandidateData(id);
    });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadCandidateData(candidateId: number) {
    console.log('Chargement candidat ID:', candidateId);

    // Vérifier le cache du service d'abord
    const navData = this.selectionService.getCandidate();

    if (navData?.all && navData.all.length > 0) {
      this.handleNavigationData(navData, candidateId);
    } else {
      this.loadAllCandidates(candidateId);
    }
  }

  private handleNavigationData(navData: any, candidateId: number) {
    const index = navData.all.findIndex((c: Candidacy) => c.id === candidateId);

    if (index !== -1) {
      console.log('Candidat trouvé dans cache service, index:', index);
      this.candidatesList = navData.all;
      this.currentIndex = index;
      this.loadCurrentCandidate();
    } else {
      console.warn('Candidat non trouvé dans cache service');
      this.loadAllCandidates(candidateId);
    }
  }

  private loadAllCandidates(candidateId: number) {
    this.isLoading.set(true);

    // Utiliser le cache local si disponible
    if (this.candidatesList.length > 0) {
      const index = this.candidatesList.findIndex(c => c.id === candidateId);
      if (index !== -1) {
        console.log('Candidat trouvé dans cache local');
        this.currentIndex = index;
        this.loadCurrentCandidate();
        return;
      }
    }

    // Sinon charger depuis l'API
    this.candidacyService.getPreselectedCandidates(1, '', 'all').pipe(
      takeUntil(this.destroy$),
      catchError(error => {
        console.error('Erreur chargement liste:', error);
        this.loadCandidateDirectly(candidateId);
        return of(null);
      })
    ).subscribe(response => {
      if (!response) return;

      const candidates = this.extractCandidatesFromResponse(response);

      if (candidates.length === 0) {
        this.loadCandidateDirectly(candidateId);
        return;
      }

      this.processCandidateList(candidates, candidateId);
    });
  }

  private extractCandidatesFromResponse(response: any): Candidacy[] {
    if (Array.isArray(response)) {
      return response;
    } else if (response?.data && Array.isArray(response.data)) {
      return response.data;
    } else if (response?.candidates && Array.isArray(response.candidates)) {
      return response.candidates;
    }
    return [];
  }

  private processCandidateList(candidates: Candidacy[], candidateId: number) {
    this.candidatesList = candidates;
    console.log('Liste chargée:', candidates.length, 'candidats');

    const index = this.candidatesList.findIndex(c => c.id === candidateId);

    if (index !== -1) {
      this.currentIndex = index;
      this.updateServiceCache();
      this.loadCurrentCandidate();
    } else {
      console.warn('Candidat non trouvé dans liste');
      this.loadCandidateDirectly(candidateId);
    }
  }

  private loadCandidateDirectly(id: number) {
    this.isLoading.set(true);

    this.candidacyService.getOneCandidacy(id).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (resp) => {
        const candidate = (resp as any)?.data ?? resp;
        if (!candidate) {
          this.handleCandidateError();
          return;
        }

        this.candidacy = candidate;
        this.mergeCandidateIntoList(candidate, id);
      },
      error: (error) => {
        console.error('Erreur chargement candidat:', error);
        this.handleCandidateError();
      }
    });
  }

  private mergeCandidateIntoList(candidate: Candidacy, candidateId: number) {
    // Vérifier si le candidat est déjà dans la liste
    const existingIndex = this.candidatesList.findIndex(c => c.id === candidateId);

    if (existingIndex !== -1) {
      // Mettre à jour le candidat existant
      this.candidatesList[existingIndex] = { ...this.candidatesList[existingIndex], ...candidate };
      this.currentIndex = existingIndex;
    } else {
      // Ajouter le candidat à la liste
      this.candidatesList = [candidate, ...this.candidatesList];
      this.currentIndex = 0;
    }

    this.updateServiceCache();
    this.loadCandidateDetails();
  }

  private updateServiceCache() {
    if (this.candidatesList.length > 0 && this.currentIndex >= 0) {
      this.selectionService.setCandidate({
        current: this.candidatesList[this.currentIndex],
        all: this.candidatesList,
        currentIndex: this.currentIndex
      });
    }
  }

  private loadCurrentCandidate() {
    this.isLoading.set(true);

    // Réinitialiser le message de succès
    this.showSuccessMessage = false;

    const candidate = this.candidatesList[this.currentIndex];
    if (!candidate) {
      this.handleCandidateError();
      return;
    }

    this.candidacy = candidate;
    if (candidate.etn_naissance) {
        this.age = this.calculateAge(candidate.etn_naissance);
        console.log('Âge du candidat:', this.age);
    }
    console.log('Chargement candidat:', candidate.id, 'Index:', this.currentIndex + 1, '/', this.candidatesList.length);

    this.resetEvaluationForm.update(v => v + 1);
    this.loadCandidateDetails();
  }

  private loadCandidateDetails() {
    if (!this.candidacy) return;

    // Charger la période (avec cache)
    this.loadPeriodDetails();

    // Charger l'interview (avec cache)
    this.loadInterviewDetails();

    // Vérifier si sélectionné
    this.checkCandidateSelection();
  }

  private loadPeriodDetails() {
    if (!this.candidacy?.period_id) return;

    // Vérifier le cache
    const cachedPeriod = this.periodCache.get(this.candidacy.period_id);
    if (cachedPeriod) {
      this.period.set(cachedPeriod);
    } else {
      this.periodService.getOnePeriod(this.candidacy.period_id).pipe(
        takeUntil(this.destroy$)
      ).subscribe({
        next: (p) => {
          this.periodCache.set(this.candidacy!.period_id, p);
          this.period.set(p);
        },
        error: () => this.period.set(null)
      });
    }
  }

  private loadInterviewDetails() {
    if (!this.candidacy?.id) return;

    const cachedInterview = this.interviewCache.get(this.candidacy.id);
    if (cachedInterview !== undefined) {
      this.interview.set(cachedInterview);
    } else {
      this.candidacyService.getCandidateInterview(this.candidacy.id).pipe(
        takeUntil(this.destroy$)
      ).subscribe({
        next: (res) => {
          const interview = res.data ?? null;
          this.interviewCache.set(this.candidacy!.id, interview);
          this.interview.set(interview);
        },
        error: () => {
          this.interviewCache.set(this.candidacy!.id, null);
          this.interview.set(null);
        }
      });
    }
  }

  private checkCandidateSelection() {
    if (!this.candidacy?.id) return;

    this.candidacyService.candidateHasSelected(this.candidacy.id).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (res) => {
        this.candidateHasSelected.set(res.hasSelection ?? false);
        this.isLoading.set(false);
      },
      error: () => {
        this.candidateHasSelected.set(false);
        this.isLoading.set(false);
      }
    });
  }

  private handleSearchResults(results: Candidacy[]) {
    this.candidatesList = results;
    this.currentIndex = 0;

    if (results.length > 0) {
      this.updateServiceCache();
      this.loadCurrentCandidate();
    }
  }

  private handleCandidateError() {
    console.warn('Candidat introuvable');
    this.router.navigate(['/selections']);
  }

  // Navigation
  goToPrevious() {
    if (this.currentIndex > 0) {
      this.currentIndex--;
      this.updateRouteAndLoad();
    }
  }

  goToNext() {
    if (this.currentIndex < this.candidatesList.length - 1) {
      this.currentIndex++;
      this.updateRouteAndLoad();
    }
  }

  private updateRouteAndLoad() {
    const candidate = this.candidatesList[this.currentIndex];
    if (!candidate) return;

    this.router.navigate(['/selections/candidates', candidate.id], { replaceUrl: true });
    this.updateServiceCache();
    this.loadCurrentCandidate();
  }

  // Évaluation soumise
  onEvaluated() {
    console.log('🎯 Évaluation soumise pour:', this.candidacy?.id);
    this.candidateHasSelected.set(true);

    if (this.candidacy) {
      this.candidacy.hasSelected = true;

      const index = this.candidatesList.findIndex(c => c.id === this.candidacy!.id);
      if (index !== -1) {
        this.candidatesList[index].hasSelected = true;
      }
    }
  }

  displayFn(candidacy: Candidacy): string {
    return candidacy && candidacy.etn_nom ? `${candidacy.etn_prenom} ${candidacy.etn_nom}` : '';
  }

  onSelectedCandidate(candidate: Candidacy) {
    const index = this.candidatesList.findIndex(c => c.id === candidate.id);
    if (index !== -1) {
      this.currentIndex = index;
      this.resetEvaluationForm.update(v => v + 1);
      this.updateRouteAndLoad();
    }
  }

  // Getter pour l'affichage
  get currentPosition(): string {
    return `${this.currentIndex + 1} / ${this.candidatesList.length}`;
  }

  get hasPrevious(): boolean {
    return this.currentIndex > 0;
  }

  get hasNext(): boolean {
    return this.currentIndex < this.candidatesList.length - 1;
  }

  docPreview(fileName: any) {
    if (!fileName) return;

    this.importService.getDocument(fileName).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (file) => {
        const blob = new Blob([file], { type: file.type });
        const fileFromUrl = new File([blob], fileName, { type: blob.type });

        this.filePreviewService.previewFile(fileFromUrl).subscribe({
          next: (result) => {
            const dialogConfig = new MatDialogConfig();
            dialogConfig.disableClose = true;
            dialogConfig.data = { currentPreview: result };

            const dialogRef = this._matDialog.open(DocPreviewComponent, dialogConfig);

            dialogRef.afterClosed().pipe(
              takeUntil(this.destroy$)
            ).subscribe();
          },
          error: (error) => {
            console.log('Erreur preview:', error);
          }
        });
      },
      error: (error) => {
        console.log('Erreur chargement document:', error);
      }
    });
  }

  get isSelectionPhase(): boolean {
    const currentPeriod = this.period();
    return currentPeriod?.status === PeriodStatus.STATUS_SELECTION;
  }

  protected readonly PeriodStatus = PeriodStatus;

  showSuccessMessage = false;

  // Modifiez la méthode onEvaluated pour gérer le message de succès
  onEvaluationSubmitted(event: { success: boolean; candidateId: number; autoNavigate?: boolean }) {
    console.log('🎯 Évaluation soumise pour:', event.candidateId, 'Succès:', event.success);

    if (event.success) {
      // Afficher le message de succès
      this.showSuccessMessage = true;

      // Mettre à jour l'état du candidat
      this.candidateHasSelected.set(true);

      if (this.candidacy) {
        this.candidacy.hasSelected = true;

        const index = this.candidatesList.findIndex(c => c.id === this.candidacy!.id);
        if (index !== -1) {
          this.candidatesList[index].hasSelected = true;
        }
      }

      // Si autoNavigate est true ou undefined, passer automatiquement au suivant
      if (event.autoNavigate !== false) {
        // Attendre 2 secondes puis passer au suivant
        setTimeout(() => {
          this.showSuccessMessage = false;

          // Passer au candidat suivant s'il existe
          if (this.currentIndex < this.candidatesList.length - 1) {
            this.currentIndex++;
            this.updateRouteAndLoad();
          } else {
            // Si c'est le dernier, juste un message console
            // Optionnel : afficher un message à l'utilisateur
            this.snackBar.open('Le dernier été évalué !', 'Fermer', {
              duration: 3000
            });
          }
        }, 2000);
      }
    }
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

  openLetterDialog(content: string | null | undefined) {
    if (!content) {
      this.snackBar.open('Lettre de motivation indisponible', 'Fermer', {
        duration: 3000
      });
      return;
    }

    this._matDialog.open(TextPreviewDialogComponent, {
      width: '600px',
      maxHeight: '80vh',
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
