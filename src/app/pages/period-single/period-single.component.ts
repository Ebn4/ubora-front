import {CriteriaAttachComponent} from './criteria-attach/criteria-attach.component';
import {Period} from './../../models/period';
import {Component, inject, signal, HostListener} from '@angular/core';
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
  ],
  templateUrl: './period-single.component.html',
})
export class PeriodSingleComponent {

  periodService: PeriodService = inject(PeriodService);
  preselectionService: PreselectionService = inject(PreselectionService)
  route: ActivatedRoute = inject(ActivatedRoute);
  readonly snackbar = inject(MatSnackBar)

  period!: Period | undefined;
  selectedTab: string = 'tab1';
  tabIndex: number = 0;
  periodId!: number;
  year!: number
  showModal = false;
  isDropdownVisible = false;

  canDispatch = signal(false);
  validateDispatchPeriodStatus = PeriodStatus.STATUS_DISPATCH
  dispatchStatus = signal(PeriodStatus.STATUS_DISPATCH);
  preselectionStatus = signal(PeriodStatus.STATUS_PRESELECTION);

  private subscription!: Subscription;

  event = false;

  constructor(private router: Router, private _matDialog: MatDialog, private modalService: ListeningChangeService) {
  }

  toggleDropdown() {
    this.isDropdownVisible = !this.isDropdownVisible;
  }

  @HostListener('document:click', ['$event'])
  closeDropdownOnClick(event: MouseEvent) {
    const dropdownDefaultButton = document.getElementById(
      'dropdownDefaultButton'
    );

    if (
      dropdownDefaultButton &&
      !dropdownDefaultButton.contains(event.target as Node)
    ) {
      this.isDropdownVisible = false;
    }
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
    this.periodId = Number(this.route.snapshot.paramMap.get('id'));
    this.periodService.getOnePeriod(this.periodId).subscribe({
      next: (period) => {
        this.period = period;
        this.year = this.period.year
        this.route.queryParams.subscribe((params) => {
          this.selectedTab = params['tab'] || 'criteria';
          this.tabIndex = this.getTabIndex(this.selectedTab);
        });
      },
      error: (error) => {
        console.error('Error fetching period:', error);
      },
    });
  }

  getTabIndex(tab: string): number {
    switch (tab) {
      case 'criteria':
        return 0;
      case 'candidacy':
        return 1;
      case 'evaluateur':
        return 2;
      case 'lecteur':
        return 3;
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
        return 'evaluateur';
      case 3:
        return 'lecteur';
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

  openModal() {
  }

  closeModal() {
    this.showModal = false;
  }

  sendEmails() {
    this.preselectionService.sendDispatchNotification().subscribe({
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
    this.periodService
      .changePeriodStatus(this.periodId, {status: PeriodStatus.STATUS_PRESELECTION})
      .subscribe({
        next: value => {
          this.loadData()
          this.sendEmails()
        },
        error: err => {
          console.error(err)
        }
      })
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

  protected readonly PeriodStatus = PeriodStatus;
}
