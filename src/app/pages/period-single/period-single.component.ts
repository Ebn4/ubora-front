import {CriteriaAttachComponent} from './criteria-attach/criteria-attach.component';
import {Period} from './../../models/period';
import {Component, inject, signal, HostListener, ViewEncapsulation} from '@angular/core';
import {ActivatedRoute, Router, RouterLink} from '@angular/router';
import {PeriodService} from '../../services/period.service';
import {NgClass, NgIf} from '@angular/common';
import {PeriodCandidacyComponent} from './period-candidacy/period-candidacy.component';
import {PeriodEvaluateurComponent} from './period-evaluateur/period-evaluateur.component';
import {MatTabsModule} from '@angular/material/tabs';
import {
  MatDialog,
  MatDialogConfig,
} from '@angular/material/dialog';
import {CriteriaComponent} from '../criteria/criteria.component';
import {CriteriaAttachSelectionComponent} from './criteria-attach-selection/criteria-attach-selection.component';
import {ImportFileCandidaciesComponent} from '../import-file-candidacies/import-file-candidacies.component';
import {PeriodStatus} from '../../enum/period-status.enum';
import {PreselectionService} from '../../services/preselection.service';
import {ListeningChangeService} from '../../services/listening-change.service';
import {Subscription} from 'rxjs';
import {MatSnackBar} from '@angular/material/snack-bar';
import {ImportDocumentsComponent} from './import-documents/import-documents.component';
import {PeriodCandidacyRejectedComponent} from "./period-candidacy-rejected/period-candidacy-rejected.component";
import {ReactiveFormsModule} from '@angular/forms';
import {PeriodCandidaciesSelectedComponent} from './period-candidacies-selected/period-candidacies-selected.component';
import {
  PeriodCandidaciesPreselectedComponent
} from './period-candidacies-preselected/period-candidacies-preselected.component';
import {MatMenuModule} from '@angular/material/menu';
import {MatButtonModule} from '@angular/material/button';

@Component({
  selector: 'app-period-single',
  imports: [
    RouterLink,
    NgClass,
    PeriodCandidacyComponent,
    PeriodEvaluateurComponent,
    MatTabsModule,
    NgIf,
    CriteriaComponent,
    PeriodCandidacyRejectedComponent,
    ReactiveFormsModule,
    PeriodCandidaciesSelectedComponent,
    PeriodCandidaciesPreselectedComponent,
    MatMenuModule,
    MatButtonModule
  ],
  templateUrl: './period-single.component.html',
  encapsulation: ViewEncapsulation.None,
  styles: [`
    .tab-selected {
      background: white;
      color: #FF9000 !important;
    }

    .tab-default {
      color: #475569; /* slate-600 */
    }

    .tab-default:hover {
      color: #1e293b; /* slate-800 */
      background-color: white;
      box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
    }

    .mat-ripple.mat-mdc-tab-header-pagination  .mat-mdc-tab-header-pagination-chevron {
      border-color: #FF9000 !important;
    }

    .mat-mdc-menu-content{
      background-color: white !important;
    }
  `]
})
export class PeriodSingleComponent {

  snackBar = inject(MatSnackBar)
  periodService: PeriodService = inject(PeriodService);
  preselectionService: PreselectionService = inject(PreselectionService)
  route: ActivatedRoute = inject(ActivatedRoute);
  readonly snackbar = inject(MatSnackBar)

  validatedPreselectionPeriodStatus = PeriodStatus.STATUS_PRESELECTION
  canValidatePreselection = signal(false)
  isLoading = signal(false)

  period!: Period | undefined;
  selectedTab: string = 'tab1';
  tabIndex: number = 0;
  periodId!: number;
  year!: number
  showModal = false;

  canDispatch = signal(false);
  validateDispatchPeriodStatus = PeriodStatus.STATUS_DISPATCH
  dispatchStatus = signal(PeriodStatus.STATUS_DISPATCH);
  preselectionStatus = signal(PeriodStatus.STATUS_PRESELECTION);

  private subscription!: Subscription;

  event = false;

  constructor(private router: Router, private _matDialog: MatDialog, private modalService: ListeningChangeService) {
  }

  ngOnInit() {
    this.loadData()
    this.subscription = this.modalService.modalClosed$.subscribe((modalClosed) => {
      if (modalClosed) {
        this.loadData();
        this.modalService.resetNotification();
      }
    });
  }

  loadData() {
    this.isLoading.set(true)
    this.periodId = Number(this.route.snapshot.paramMap.get('id'));
    this.periodService.getOnePeriod(this.periodId).subscribe({
      next: (period) => {
        this.period = period;
        this.year = this.period.year
        this.route.queryParams.subscribe((params) => {
          this.selectedTab = params['tab'] || 'criteria';
          this.tabIndex = this.getTabIndex(this.selectedTab);
        });

        this.checkIdCanValidatePreselection(period)

        this.isLoading.set(false)
      },
      error: (error) => {
        console.error('Error fetching period:', error);
        this.isLoading.set(false)
      },
    });
  }

  getTabIndex(tab: string): number {
    switch (tab) {
      case 'criteria':
        return 0;
      case 'candidacy':
        return 1;
      case 'preselected-candidates':
        return 2;
      case 'selected-candidates':
        return 3;
      case 'candidacy-rejected':
        return 4;
      case 'evaluateur':
        return 5;
      default:
        return 0;
    }
  }

  getTabName(index: number): string {
    switch (index) {
      case 0:
        return 'criteria';
      case 1:
        return 'candidacy';
      case 2:
        return 'preselected-candidates';
      case 3:
        return 'selected-candidates';
      case 4:
        return 'candidacy-rejected';
      case 5:
        return 'evaluateur';
      default:
        return 'criteria';
    }
  }

  onTabChange(index: number) {
    this.selectedTab = this.getTabName(index);
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {tab: this.selectedTab},
      queryParamsHandling: 'merge',
    });
  }

  sendEmails() {
    this.periodService.notifyPreselectionEvaluators(this.period?.id).subscribe({
      next: res => {
      },
      error: err => console.error(err)
    });
  }

  canValidateDispatch(canDispatch: boolean) {
    this.canDispatch.set(canDispatch);
  }

  openModalAttach(periodId: number | undefined) {
    periodId = this.periodId;
    const dialogConfig = new MatDialogConfig();
    dialogConfig.disableClose = true;
    dialogConfig.data = {periodId};

    const dialogRef = this._matDialog.open(
      CriteriaAttachComponent,
      dialogConfig
    );
    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.ngOnInit();
      }
    });
  }

  openModalAttachSelection(periodId: number | undefined) {
    periodId = this.periodId;
    const dialogConfig = new MatDialogConfig();
    dialogConfig.disableClose = true;
    dialogConfig.data = {periodId};

    const dialogRef = this._matDialog.open(
      CriteriaAttachSelectionComponent,
      dialogConfig
    );
    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
      }
    });
  }

  importFileCandidacies(periodId: number | undefined, year: number | undefined) {
    periodId = this.periodId;
    year = this.year;
    const dialogConfig = new MatDialogConfig();
    dialogConfig.disableClose = true;
    dialogConfig.width = '900px';
    dialogConfig.maxWidth = '100vw';
    dialogConfig.data = {periodId, year};

    const dialogRef = this._matDialog.open(
      ImportFileCandidaciesComponent,
      dialogConfig
    );
    dialogRef.afterClosed().subscribe((result) => {
      if (result === true) {
        this.event = true;
      }
    });
  }

  importDocumentsCandidacies() {

    const dialogConfig = new MatDialogConfig();
    dialogConfig.disableClose = true;
    dialogConfig.width = '900px';
    dialogConfig.maxWidth = '100vw';

    const dialogRef = this._matDialog.open(
      ImportDocumentsComponent,
      dialogConfig
    );
    dialogRef.afterClosed().subscribe((result) => {
      if (result === true) {
        this.event = true;
      }
    });
  }

 validateDispatch() {
    // envoyer les notifications (pendant que le statut est encore DISPATCH)
    this.periodService.notifyPreselectionEvaluators(this.periodId).subscribe({
      next: () => {
        // changer le statut
        this.periodService
          .changePeriodStatus(this.periodId, { status: PeriodStatus.STATUS_PRESELECTION })
          .subscribe({
            next: () => {
              this.snackBar.open('Candidats dispatchés avec succès', 'Fermer', { duration: 3000 });
              this.loadData();
            },
            error: (err) => console.error('Erreur changement statut :', err)
          });
      },
      error: (err) => console.error('Erreur envoi notifications :', err)
    });
  }

  closeStatus() {
    if (this.period) {
      this.periodService.changePeriodStatus(this.period.id, {status: PeriodStatus.STATUS_CLOSE})
        .subscribe({
          next: res => {
            this.loadData()
          },
          error: err => {
            this.snackbar.open(err.error.errors, 'Fermer', {
              duration: 3000,
            });
          }
        })
    }
  }

  checkIdCanValidatePreselection(period: Period) {

    this.preselectionService.canValidate(period.id)
      .subscribe({
        next: value => {
          this.canValidatePreselection.set(value.canValidate)
        },
        error: err => {
          console.error(err)
        }
      })

  }

  validatePreselection() {
    if (this.period) {
      this.isLoading.set(true)
      this.preselectionService.validatePreselection(this.period.id)
        .subscribe({
          next: value => {
            this.canValidatePreselection.set(false)

            this.changePeriodStatus()
            this.snackbar.open(value.message, 'Fermer', {
              duration: 3000,
            });

            this.isLoading.set(false)

          },
          error: err => {
            console.error(err)
            this.isLoading.set(false)
          }
        })
    }
  }

  changePeriodStatus() {
    if (this.period) {
      this.isLoading.set(true)
      this.periodService.changePeriodStatus(this.period.id, {status: PeriodStatus.STATUS_SELECTION})
        .subscribe({
          next: value => {
            this.snackBar.open('Le status de la periode est maitenant en SELECTION', 'Fermer', {
              duration: 3000
            })
            this.loadData()
            this.isLoading.set(false)
          },
          error: err => {
            console.error(err)
            this.snackbar.open(err.error.message, 'Fermer', {
              duration: 3000,
            });
            this.isLoading.set(false)
          }
        })
    }
  }

  protected readonly PeriodStatus = PeriodStatus;
}
