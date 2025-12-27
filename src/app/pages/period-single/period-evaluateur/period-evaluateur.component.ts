import {
  Component,
  EventEmitter,
  inject,
  Input,
  OnChanges,
  OnDestroy,
  Output,
  signal,
  SimpleChanges,
  ChangeDetectionStrategy
} from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgClass, NgForOf } from '@angular/common';
import { debounceTime, distinctUntilChanged, Subject, takeUntil } from 'rxjs';

import { AddEvaluatorDialogComponent } from '../add-evaluator-dialog/add-evaluator-dialog.component';
import { EvaluatorService } from '../../../services/evaluator.service';
import { PeriodService } from '../../../services/period.service';
import { ListeningChangeService } from '../../../services/listening-change.service';
import { MatSnackBar } from '@angular/material/snack-bar';

import { BaseListWidget } from '../../../widgets/base-list-widget';
import { Period } from '../../../models/period';
import { Evaluator } from '../../../models/evaluator.model';
import { PeriodStatus } from '../../../enum/period-status.enum';

@Component({
  selector: 'app-period-evaluateur',
  standalone: true,
  imports: [FormsModule, ReactiveFormsModule, NgForOf, NgClass],
  templateUrl: './period-evaluateur.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PeriodEvaluateurComponent
  extends BaseListWidget
  implements OnChanges, OnDestroy {

  private dialog = inject(MatDialog);
  private evaluatorService = inject(EvaluatorService);
  private periodService = inject(PeriodService);
  private snackBar = inject(MatSnackBar);
  private destroy$ = new Subject<void>();
  private _snackBar = inject(MatSnackBar);


  @Input() period?: Period;
  @Input() candidatesCount = 0;
  @Output() evaluatorAdded = new EventEmitter<void>();
  @Output() canValidateDispatch = new EventEmitter<boolean>();

  evaluators = signal<Evaluator[]>([]);
  isLoading = signal(false);
  canDispatch = signal(true);
  isDisableDispatchButton = signal(false);
  dispatchStatus = signal(PeriodStatus.STATUS_DISPATCH);

  Math = Math;

  evaluatorTypes = [
    { name: 'Selection', type: 'SELECTION' },
    { name: 'Preselection', type: 'PRESELECTION' }
  ];

  typeForm = new FormControl('');

  ngOnInit() {
    this.typeForm.valueChanges
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe(() => {
        this.currentPage = 1;
        this.loadPeriodState();
      });
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['period'] && this.period?.id) {
      this.currentPage = 1;
      this.loadPeriodState();
    }
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadPeriodState() {
    if (!this.period?.id || this.isLoading()) return;

    this.isLoading.set(true);

    this.periodService.getPeriodState(
      this.period.id,
      this.currentPage,
      this.per_page,
      this.search,
      this.typeForm.value || ''
    ).subscribe({
      next: res => {
        if (res.success) {
          const state = res.data;

          this.evaluators.set(state.evaluators);
          this.currentPage = state.pagination.current_page;
          this.lastPage = state.pagination.last_page;

          this.canDispatch.set(!state.isDispatched);
          this.canValidateDispatch.emit(state.isDispatched);
          this.isDisableDispatchButton.set(state.hasEvaluators);
        }
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
        this.snackBar.open('Erreur de chargement', 'Fermer', { duration: 3000 });
      }
    });
  }

  override loadData() {
    this.loadPeriodState();
  }

  private searchTimeout?: any;

  override onSearchChange() {
    clearTimeout(this.searchTimeout);
    this.searchTimeout = setTimeout(() => {
      this.currentPage = 1;
      this.loadPeriodState();
    }, 400);
  }

  override changePage(page: number) {
    if (page < 1 || page > this.lastPage) return;
    this.currentPage = page;
    this.loadPeriodState();
  }

  override paginationChange() {
    this.currentPage = 1;
    this.loadPeriodState();
  }

  onOpenDialog() {
    if (!this.period?.id) {
      this.snackBar.open('Veuillez sélectionner une période', 'Fermer', { duration: 3000 });
      return;
    }

    this.dialog.open(AddEvaluatorDialogComponent, {
      data: { periodId: this.period.id }
    }).afterClosed().subscribe(result => {
      if (result) {
        this.currentPage = 1;
        this.loadPeriodState();
      }
    });
  }

  @Output() statsChanged = new EventEmitter<void>();

  deleteEvaluator(id: number) {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet évaluateur ?')) return;

    this.evaluatorService.deleteEvaluator(id).subscribe({
      next: () => {
        // Mise à jour locale de la liste
        this.evaluators.set(
          this.evaluators().filter(e => e.id !== id)
        );

        // Notification utilisateur
        this._snackBar.open('Évaluateur supprimé', 'Fermer', {
          duration: 3000,
        });

        // Notification propre des stats
        this.evaluatorAdded.emit();
      },
      error: err => {
        this._snackBar.open(
          err.error?.errors || 'Erreur lors de la suppression',
          'Fermer',
          { duration: 3000 }
        );
      }
    });
  }


  onDispatchEvaluator() {
    if (!this.isDisableDispatchButton() || !this.period?.id) return;

    this.evaluatorService.dispatchEvaluators(this.period.id.toString())
      .subscribe({
        next: () => {
          this.snackBar.open('Candidats dispatchés', 'Fermer', { duration: 3000 });
          this.loadPeriodState();
        },
        error: () => {
          this.snackBar.open('Erreur lors du dispatch', 'Fermer', { duration: 3000 });
        }
      });
  }

  onCancelDispatch() {
    if (!this.period?.id) return;

    this.evaluatorService.dispatchEvaluators(this.period.id.toString())
      .subscribe({
        next: () => {
          this.snackBar.open('Dispatch annulé', 'Fermer', { duration: 3000 });
          this.loadPeriodState();
        }
      });
  }
}
