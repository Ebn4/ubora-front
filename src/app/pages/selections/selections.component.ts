import {Component, inject, OnChanges, signal} from '@angular/core';
import {single} from 'rxjs';
import {Candidacy} from '../../models/candidacy';
import {CandidacyService} from '../../services/candidacy.service';
import {NgClass, NgForOf, NgIf} from '@angular/common';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {BaseListWidget} from '../../widgets/base-list-widget';
import {RouterLink} from '@angular/router';
import {MatIcon} from '@angular/material/icon';

@Component({
  selector: 'app-selections',
  imports: [
    NgForOf,
    ReactiveFormsModule,
    FormsModule,
    RouterLink,
    MatIcon,
    NgClass
  ],
  templateUrl: './selections.component.html',
  styles: ``,
  standalone: true
})
export class SelectionsComponent extends BaseListWidget {

  candidateService = inject(CandidacyService)

  candidates = signal<Candidacy[]>([])

  ngOnInit() {
    this.loadData()
  }

  override loadData() {
    super.loadData();
    return this.candidateService
      .getPreselectedCandidates(
        this.currentPage,
        this.search,
        this.per_page,
      )
      .subscribe({
        next: value => {
          this.candidates.set(value.data)
          console.log(value.data)
        },
        error: err => {
          console.error(err)
        }
      })
  }


}
