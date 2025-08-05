import {
  Component,
  inject,
  Input,
  OnChanges, signal,
  SimpleChanges,
} from '@angular/core';
import {Period} from '../../../models/period';
import {Subscription} from 'rxjs';
import {ListeningChangeService} from '../../../services/listening-change.service';
import {FormsModule} from '@angular/forms';
import {NgFor} from '@angular/common';
import {Candidacy} from '../../../models/candidacy';
import {CandidacyService} from '../../../services/candidacy.service';
import {ActivatedRoute, RouterLink} from '@angular/router';
import {BaseListWidget} from '../../../widgets/base-list-widget';
import {PreselectionService} from '../../../services/preselection.service';
import {MatSnackBar} from '@angular/material/snack-bar';
import {PeriodService} from '../../../services/period.service';
import {PeriodStatus} from '../../../enum/period-status.enum';

@Component({
  selector: 'app-period-candidacy-rejected',
  imports: [FormsModule, NgFor, RouterLink],
  templateUrl: './period-candidacy-rejected.component.html',
})
export class PeriodCandidacyRejectedComponent extends BaseListWidget
  implements OnChanges {

  private subscription!: Subscription;
  candidacies: Candidacy[] = [];
  @Input() period?: Period;
  ville: string = '';
  institute_count: number = 0
  candidacy_count: number = 0
  city_count: number = 0
  preselection_count: number = 0
  selection_count: number = 0
  validatedPreselectionPeriodStatus = PeriodStatus.STATUS_PRESELECTION

  readonly snackbar = inject(MatSnackBar)
  route: ActivatedRoute = inject(ActivatedRoute);
  candidacyService: CandidacyService = inject(CandidacyService);
  preselectionService = inject(PreselectionService);
  periodService = inject(PeriodService);

  canValidatePreselection = signal(false)

  constructor(private modalService: ListeningChangeService) {
    super();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['period']) {
      const current = changes['period'].currentValue;
      this.period = current;
      if (current) {
        this.loadData();
        this.checkIdCanValidatePreselection()
      }
    }
  }

  ngOnInit(): void {
    this.loadData();
    this.checkIdCanValidatePreselection()
    this.subscription = this.modalService.modalClosed$.subscribe((modalClosed) => {
      if (modalClosed) {
        this.loadData();
        this.modalService.resetNotification();
      }
    });
  }

  override loadData() {
    this.candidacyService
      .getCandidaciesRejected(
        this.currentPage,
        this.search,
        this.ville,
        this.period?.id,
        this.per_page
      )
      .subscribe({
        next: (response) => {
          this.candidacies = response.data;
          this.currentPage = response.meta.current_page;
          this.lastPage = response.meta.last_page;

          if (this.candidacies.length > 0) {
            this.institute_count = this.candidacies[0].institute_count;
            this.candidacy_count = this.candidacies[0].candidacy_count;
            this.city_count = this.candidacies[0].city_count;
            this.preselection_count = this.candidacies[0].preselection_count;
            this.selection_count = this.candidacies[0].selection_count;
          } else {
            this.institute_count = 0;
            this.candidacy_count = 0;
            this.city_count = 0;
            this.preselection_count = 0
            this.selection_count = 0
          }
        },
        error: (error) => {
          console.error('Error loading candidacies:', error);
        }
      });
  }

  checkIdCanValidatePreselection() {
    if (this.period) {
      this.preselectionService.canValidate(this.period.id)
        .subscribe({
          next: value => {
            this.canValidatePreselection.set(value.canValidate)
          },
          error: err => {
            console.error(err)
          }
        })
    }
  }

  validatePreselection() {
    if (this.period) {
      this.preselectionService.validatePreselection(this.period.id)
        .subscribe({
          next: value => {
            this.canValidatePreselection.set(false)

            this.changePeriodStatus()
            this.snackbar.open(value.message, 'Fermer', {
              duration: 3000,
            });


          },
          error: err => {
            console.error(err)
          }
        })
    }
  }

  changePeriodStatus() {
    if (this.period) {
      this.periodService.changePeriodStatus(this.period.id, {status: PeriodStatus.STATUS_SELECTION})
        .subscribe({
          next: value => {
          },
          error: err => {
            console.error(err)
            this.snackbar.open(err.error.message, 'Fermer', {
              duration: 3000,
            });

          }
        })
    }
  }

}
