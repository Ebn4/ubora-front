import { ChangeDetectorRef, Component, EventEmitter, inject, Input, OnInit, Output, signal, OnChanges, SimpleChanges } from '@angular/core';
import { CriteriaService } from '../../services/criteria.service';
import { Criteria } from '../../models/criteria';
import { CandidacyService } from '../../services/candidacy.service';
import { FormArray, FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { CandidateEvaluation } from '../../models/candidate-evaluation';
import { MatSnackBar } from '@angular/material/snack-bar';
import { PeriodService } from '../../services/period.service';
import { Period } from '../../models/period';
import { PeriodStatus } from '../../enum/period-status.enum';
import { forkJoin, Observable, of } from 'rxjs';
import { catchError, finalize } from 'rxjs/operators';

@Component({
  selector: 'app-evaluation',
  imports: [FormsModule, ReactiveFormsModule],
  templateUrl: './evaluation.component.html',
  standalone: true,
  styles: ``
})
export class EvaluationComponent implements OnInit, OnChanges {

  @Input() periodId: number | null = null;
  @Input() hasSelected: boolean = false;
  @Input() interviewId: number | null = null;
  @Input() candidateId: number = 0;
  @Input() resetTrigger = 0;
  @Input() readonly = false;

  @Output() onEvaluated = new EventEmitter()

  snackBar = inject(MatSnackBar)
  criterias = signal<Criteria[]>([]);
  criteriaService = inject(CriteriaService)
  periodService = inject(PeriodService)
  candidateService = inject(CandidacyService)
  formBuilder = inject(FormBuilder)
  cdr = inject(ChangeDetectorRef)

  form!: FormGroup
  isPeriodHasSelectionStatus = signal(false)
  isCandidateHasSelected = signal(false)

  // AJOUTER : État de chargement
  isLoading = signal(true)
  loadingText = signal('Chargement des critères...')

  ngOnInit() {
    this.form = this.formBuilder.group({
      crv: this.formBuilder.array([])
    });

    // Charger initialement sans bloquer
    this.initializeData();
  }

  ngOnChanges(changes: SimpleChanges) {
    // Réinitialiser seulement quand le candidat change vraiment
    if (changes['candidateId'] && !changes['candidateId'].firstChange) {
      console.log('🔄 Candidat changé:', this.candidateId);
      this.initializeData();
    }

    // ResetTrigger pour forcer un rechargement
    if (changes['resetTrigger'] && !changes['resetTrigger'].firstChange) {
      console.log('Reset forcé');
      this.initializeData();
    }
  }

  private async initializeData() {
    this.isLoading.set(true);
    this.loadingText.set('Chargement des données...');

    try {
      // Charger en parallèle
      await Promise.all([
        this.loadPeriod(),
        this.checkCandidateSelection(),
        this.loadCriteriaAsync()
      ]);
    } catch (error) {
      console.error('Erreur initialisation:', error);
    } finally {
      this.isLoading.set(false);
    }
  }

  hasAnyResults(): boolean {
    return this.crv.controls.some(control => {
      const value = control.get('result')?.value;
      return value !== null && value !== undefined && value !== '';
    });
  }

  // Getter pour le FormArray
  get crv(): FormArray {
    return this.form.get('crv') as FormArray;
  }

  private async loadCriteriaAsync() {
    if (!this.periodId || !this.interviewId) {
      console.warn('⚠️ Données manquantes pour charger les critères');
      return;
    }

    this.loadingText.set('Chargement des critères...');

    try {
      // 1. Charger les critères
      const criteriaResponse = await this.criteriaService.loadCriteriasByPeriodId(
        this.periodId,
        'SELECTION'
      ).toPromise();

      if (!criteriaResponse?.data) {
        this.criterias.set([]);
        return;
      }

      this.criterias.set(criteriaResponse.data);

      // Préparer les appels pour les résultats
      const resultObservables = criteriaResponse.data.map(criteria =>
        this.candidateService.getCandidateSelectionResultByCriteria(
          this.interviewId!,
          criteria.id
        ).pipe(
          catchError(error => {
            console.error(`Erreur chargement résultat critère ${criteria.id}:`, error);
            return of({ data: { result: '' } }); // Valeur par défaut
          })
        )
      );

      // Exécuter en parallèle
      const results = await forkJoin(resultObservables).toPromise();

      // Construire le formulaire
      this.buildForm(criteriaResponse.data, results || []);

    } catch (error) {
      console.error('Erreur chargement critères:', error);
      this.criterias.set([]);
    }
  }

  private buildForm(criterias: Criteria[], results: any[]) {
    // Vider le formulaire
    while (this.crv.length !== 0) {
      this.crv.removeAt(0);
    }

    // Ajouter les contrôles avec valeurs par défaut
    criterias.forEach((criteria, index) => {
      const resultValue = results[index]?.data?.result || '0';

      const control = this.formBuilder.group({
        critere: [criteria],
        result: [
          resultValue,
          [
            Validators.required,
            Validators.min(0.5),
            Validators.max(criteria.ponderation)
          ]
        ]
      });

      this.crv.push(control);
    });

    // Marquer le formulaire comme "touché" pour afficher les erreurs
    this.form.markAsTouched();
    this.cdr.detectChanges();
  }

  private loadPeriod(): Promise<void> {
    return new Promise((resolve) => {
      if (!this.periodId) {
        this.isPeriodHasSelectionStatus.set(false);
        resolve();
        return;
      }

      this.periodService.getOnePeriod(this.periodId)
        .pipe(
          catchError(error => {
            console.error('Erreur chargement période:', error);
            return of({ status: null });
          })
        )
        .subscribe({
          next: (value: any) => {
            this.isPeriodHasSelectionStatus.set(value?.status === PeriodStatus.STATUS_SELECTION);
            resolve();
          }
        });
    });
  }

  private checkCandidateSelection(): Promise<void> {
    return new Promise((resolve) => {
      if (!this.candidateId) {
        this.isCandidateHasSelected.set(false);
        resolve();
        return;
      }

      this.candidateService.candidateHasSelected(this.candidateId)
        .pipe(
          catchError(error => {
            console.error('Erreur vérification sélection:', error);
            return of({ hasSelection: false });
          })
        )
        .subscribe({
          next: (value) => {
            this.isCandidateHasSelected.set(value.hasSelection);
            resolve();
          }
        });
    });
  }

  onSubmit() {
    console.log('Soumission pour le candidat:', this.candidateId);

    if (!this.hasSelected && this.form.valid) {
      const fields: CandidateEvaluation[] = this.crv.controls.map((control, index) => ({
        key: control.get('critere')?.value?.id,
        value: control.get('result')?.value
      }));

      if (this.periodId && this.interviewId) {
        this.isLoading.set(true);
        this.loadingText.set('Soumission en cours...');

        this.candidateService.evaluateCandidate({
          interviewId: this.interviewId,
          periodId: this.periodId,
          evaluations: fields
        })
        .pipe(
          finalize(() => this.isLoading.set(false))
        )
        .subscribe({
          next: (value) => {
            if (value.errors) {
              this.showSnackbar(value.errors);
            }
            if (value.data) {
              this.isCandidateHasSelected.set(true);
              this.onEvaluated.emit();
              this.showSnackbar('Évaluation effectuée avec succès');
            }
          },
          error: (err) => {
            if (err.error?.errors) {
              this.snackBar.open(err.error.errors[0], 'Fermer', { duration: 3000 });
            }
          }
        });
      }
    }
  }

  showSnackbar(message: string) {
    this.snackBar.open(message, 'Fermer', { duration: 3000 });
  }

  protected readonly PeriodStatus = PeriodStatus;
}
