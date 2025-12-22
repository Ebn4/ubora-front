import { ChangeDetectorRef, Component, EventEmitter, inject, Input, OnInit, Output, signal, OnChanges, SimpleChanges } from '@angular/core';
import { CriteriaService } from '../../services/criteria.service';
import { Criteria } from '../../models/criteria';
import { CandidacyService } from '../../services/candidacy.service';
import { FormArray, FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators, FormControl } from '@angular/forms';
import { CandidateEvaluation } from '../../models/candidate-evaluation';
import { MatSnackBar } from '@angular/material/snack-bar';
import { PeriodService } from '../../services/period.service';
import { Period } from '../../models/period';
import { PeriodStatus } from '../../enum/period-status.enum';
import { forkJoin, Observable, of, Subject } from 'rxjs';
import { catchError, finalize, takeUntil } from 'rxjs/operators';

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

  @Output() onEvaluated = new EventEmitter<{
    success: boolean;
    candidateId: number;
    autoNavigate?: boolean;
    error?: string;
  }>();

  snackBar = inject(MatSnackBar)
  criterias = signal<Criteria[]>([]);
  criteriaService = inject(CriteriaService)
  periodService = inject(PeriodService)
  candidateService = inject(CandidacyService)
  formBuilder = inject(FormBuilder)
  cdr = inject(ChangeDetectorRef)

  form!: FormGroup
  generalObservation = new FormControl('', [Validators.required, Validators.minLength(10)]);

  isPeriodHasSelectionStatus = signal(false)
  isCandidateHasSelected = signal(false)

  isLoading = signal(true)
  loadingText = signal('Chargement des données...')

  private destroy$ = new Subject<void>();

  ngOnInit() {
    this.form = this.formBuilder.group({
      crv: this.formBuilder.array([])
    });

    this.initializeData();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['candidateId'] && !changes['candidateId'].firstChange) {
      this.initializeData();
    }

    if (changes['resetTrigger'] && !changes['resetTrigger'].firstChange) {
      this.initializeData();
    }
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private async initializeData() {
    this.isLoading.set(true);
    this.loadingText.set('Chargement des données...');

    try {
      // Charger tout en parallèle
      await Promise.all([
        this.loadPeriod(),
        this.checkCandidateSelection(),
        this.loadCriteriaAsync(),
        this.loadInterviewObservation()
      ]);
    } catch (error) {
      console.error('Erreur initialisation:', error);
    } finally {
      this.isLoading.set(false);
    }
  }

  private async loadCriteriaAsync() {
    if (!this.periodId || !this.interviewId) {
      console.warn('Données manquantes pour charger les critères');
      return;
    }

    try {
      const criteriaResponse = await this.criteriaService.loadCriteriasByPeriodId(
        this.periodId,
        'SELECTION'
      ).toPromise();

      if (!criteriaResponse?.data) {
        this.criterias.set([]);
        return;
      }

      this.criterias.set(criteriaResponse.data);

      const resultObservables = criteriaResponse.data.map(criteria =>
        this.candidateService.getCandidateSelectionResultByCriteria(
          this.interviewId!,
          criteria.id
        ).pipe(
          catchError(error => {
            console.error(`Erreur chargement résultat critère ${criteria.id}:`, error);
            return of({ data: { result: '' } });
          })
        )
      );

      const results = await forkJoin(resultObservables).toPromise();
      this.buildForm(criteriaResponse.data, results || []);

    } catch (error) {
      console.error('Erreur chargement critères:', error);
      this.criterias.set([]);
    }
  }

  private buildForm(criterias: Criteria[], results: any[]) {
    while (this.crv.length !== 0) {
      this.crv.removeAt(0);
    }

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

  private loadInterviewObservation(): Promise<void> {
    return new Promise((resolve) => {
      if (!this.interviewId) {
        this.generalObservation.setValue('');
        resolve();
        return;
      }

      this.candidateService.getInterviewObservation(this.interviewId)
        .pipe(
          takeUntil(this.destroy$),
          catchError(() => of({ data: { observation: '' } }))
        )
        .subscribe({
          next: (response) => {
            this.generalObservation.setValue(response.data.observation || '');
            resolve();
          },
          error: () => {
            this.generalObservation.setValue('');
            resolve();
          }
        });
    });
  }

  get crv(): FormArray {
    return this.form.get('crv') as FormArray;
  }

  onSubmit() {
    console.log('Soumission pour le candidat:', this.candidateId);

    // Valider tous les champs
    this.form.markAllAsTouched();
    this.generalObservation.markAsTouched();

    if (!this.hasSelected && this.form.valid && this.generalObservation.valid) {
      const fields: CandidateEvaluation[] = this.crv.controls.map((control) => ({
        key: control.get('critere')?.value?.id,
        value: control.get('result')?.value
      }));

      if (this.periodId && this.interviewId) {
        this.isLoading.set(true);
        this.loadingText.set('Soumission en cours...');

        const observationValue = this.generalObservation.value?.trim();

        const requestData: any = {
          interviewId: this.interviewId,
          periodId: this.periodId,
          evaluations: fields,
          generalObservation: observationValue // Toujours envoyé (obligatoire)
        };

        this.candidateService.evaluateCandidate(requestData)
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

              this.onEvaluated.emit({
                success: true,
                candidateId: this.candidateId,
                autoNavigate: true
              });

              this.showSnackbar('Évaluation effectuée avec succès');
            }
          },
          error: (err) => {
            if (err.error?.errors) {
              this.snackBar.open(err.error.errors[0], 'Fermer', { duration: 3000 });
            }

            this.onEvaluated.emit({
              success: false,
              candidateId: this.candidateId,
              error: err.error?.errors?.[0] || 'Erreur lors de la soumission'
            });
          }
        });
      }
    } else {
      // Afficher erreur si formulaire invalide
      if (!this.form.valid || !this.generalObservation.valid) {
        this.snackBar.open('Veuillez remplir tous les champs obligatoires', 'Fermer', { duration: 3000 });
      }
    }
  }

  showSnackbar(message: string) {
    this.snackBar.open(message, 'Fermer', { duration: 3000 });
  }

  protected readonly PeriodStatus = PeriodStatus;
}
