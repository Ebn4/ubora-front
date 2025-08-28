import {Component, inject, signal} from '@angular/core';
import {Candidacy} from '../../../models/candidacy';
import {CandidacyService} from '../../../services/candidacy.service';
import {ActivatedRoute, RouterLink} from '@angular/router';
import {PeriodStatus} from '../../../enum/period-status.enum';
import {ImportService} from '../../../services/import.service';
import {AsyncPipe} from '@angular/common';
import {Interview} from '../../../models/interview';
import {Period} from '../../../models/period';
import {EvaluationComponent} from '../../evaluation/evaluation.component';
import {PeriodService} from '../../../services/period.service';
import {MatDialog, MatDialogConfig} from '@angular/material/dialog';
import {DocPreviewComponent} from '../../preselection/candidacy-preselection/doc-preview/doc-preview.component';
import {FilePreviewService} from '../../../services/file-preview.service';
import {FormControl, FormsModule, ReactiveFormsModule} from '@angular/forms';
import {MatAutocomplete, MatAutocompleteTrigger, MatOption} from '@angular/material/autocomplete';
import {MatInput} from '@angular/material/input';
import {Observable, of} from 'rxjs';

@Component({
  selector: 'app-candidacy-preselection',
  imports: [RouterLink, EvaluationComponent, AsyncPipe, FormsModule, MatAutocomplete, MatAutocompleteTrigger, MatInput, MatOption, ReactiveFormsModule],
  templateUrl: './candidacy-selection.component.html',
})
export class CandidacySelectionComponent {

  constructor(private _matDialog: MatDialog) {
  }

  periodService = inject(PeriodService);
  filePreviewService = inject(FilePreviewService)
  candidacyService: CandidacyService = inject(CandidacyService);
  route: ActivatedRoute = inject(ActivatedRoute);

  importService = inject(ImportService);

  periodId: number = 4;
  type: string = PeriodStatus.STATUS_PRESELECTION;
  search: string = '';

  candidacy?: Candidacy;
  currentIndex: number = 0;
  query = new FormControl('')
  filterCandidates: Observable<Candidacy[]> | undefined;

  candidateHasSelected = signal(true)
  candidateId = signal(0)
  interview = signal<Interview | null>(null)
  candidates = signal<Candidacy[]>([])
  period = signal<Period | null>(null)

  ngOnInit() {
    const currentId = Number(this.route.snapshot.paramMap.get('id'));
    this.candidateId.set(currentId)
    this.loadDataCandidacy(currentId)
    this.loadCandidateInterviewInfo()
    this.checkIfCandidateHasSelected()

    this.query.valueChanges.subscribe(value => {
      this.onSearchCandidate(value ?? '')
    });
  }

  loadDataCandidacy(candidacyId: number) {
    this.candidacyService.getOneCandidacy(candidacyId).subscribe({
      next: (response) => {
        const candidate = response.data
        this.candidacy = candidate;
        this.loadPeriodById(candidate.period_id)
      },
      error: (error) => {
        console.error('Erreur chargement candidature:', error);
      }
    });
  }

  loadCandidateInterviewInfo() {
    this.candidacyService.getCandidateInterview(this.candidateId())
      .subscribe({
        next: value => {
          this.interview.set(value.data)
        }, error: err => {
          console.error(err)
        }
      })
  }

  loadPeriodById(periodId: number) {
    this.periodService.getOnePeriod(periodId)
      .subscribe({
        next: value => {
          this.period.set(value)
        },
        error: err => {
          console.error(err)
        }
      })
  }

  checkIfCandidateHasSelected() {
    this.candidacyService
      .candidateHasSelected(this.candidateId())
      .subscribe({
        next: value => {
          this.candidateHasSelected.set(value.hasSelection)
        }
      })
  }

  onEvaluated() {
    this.loadDataCandidacy(this.candidateId())
    this.candidateHasSelected.set(true)
    this.loadDataCandidacy(this.candidateId())
    this.loadCandidateInterviewInfo()
    this.checkIfCandidateHasSelected()
  }

  docPreview(fileName: any) {
    const actualFileName = fileName;

    this.importService.getDocument(actualFileName).subscribe((file) => {
      const blob = new Blob([file], {type: file.type});
      const fileFromUrl = new File([blob], "test-doc.docx", {type: blob.type});

      this.filePreviewService.previewFile(fileFromUrl).subscribe({
        next: (result) => {
          const dialogConfig = new MatDialogConfig();
          dialogConfig.disableClose = true;
          dialogConfig.data = {currentPreview: result};

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

  onSearchCandidate(query: string) {
    if (query != "") {
      this.candidacyService.getPreselectedCandidates(1, query, 10).subscribe({
        next: value => {
          console.log(value)
          this.candidates.set(value.data)
          this.filterCandidates = of(value.data)
        },
        error: err => {
          console.log(err)
        }
      })
    }
  }

  displayFn(candidacy: Candidacy): string {
    return candidacy && candidacy.etn_nom ? candidacy.etn_prenom : '';
  }

  onSelectedCandidate(candidate: Candidacy) {
    this.candidacy = candidate
  }

  protected readonly PeriodStatus = PeriodStatus;
}
