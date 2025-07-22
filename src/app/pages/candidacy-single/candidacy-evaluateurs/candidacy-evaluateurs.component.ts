import {NgForOf, NgIf} from '@angular/common';
import {Component, inject, Input, signal} from '@angular/core';
import {Evaluator} from '../../../models/evaluator.model';
import {CandidacyService} from '../../../services/candidacy.service';
import {FormsModule} from '@angular/forms';
import {ActivatedRoute, RouterLink} from '@angular/router';

@Component({
  selector: 'app-candidacy-evaluateurs',
  imports: [
    FormsModule,
    NgForOf,
    RouterLink
  ],
  templateUrl: './candidacy-evaluateurs.component.html',
})
export class CandidacyEvaluateursComponent {
  isopen = false;

  candidacyService = inject(CandidacyService)
  evaluators = signal<Evaluator[]>([])
  route: ActivatedRoute = inject(ActivatedRoute);

  candidateId = signal(0)

  ngOnInit() {
    this.candidateId.set(Number(this.route.snapshot.paramMap.get('id')))
    this.loadData()
  }

  loadData() {
    console.log(this.candidateId())
    if (this.candidateId() > 0) {
      this.candidacyService
        .getCandidateEvaluators(this.candidateId())
        .subscribe({
          next: value => {
            this.evaluators.set(value.data)
            console.log(value)
          },
          error: err => {
            console.error(err)
          }
        })
    }
  }
}
