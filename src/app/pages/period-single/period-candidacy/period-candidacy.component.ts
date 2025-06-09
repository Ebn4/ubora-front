import {
  Component,
  inject,
  Input,
  OnChanges,
  SimpleChanges,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgFor } from '@angular/common';
import { Candidacy } from '../../../models/candidacy';
import { CandidacyService } from '../../../services/candidacy.service';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { BaseListWidget } from '../../../widgets/base-list-widget';
import { Period } from '../../../models/period';

@Component({
  selector: 'app-period-candidacy',
  imports: [FormsModule, NgFor, RouterLink],
  templateUrl: './period-candidacy.component.html',
})
export class PeriodCandidacyComponent
  extends BaseListWidget
  implements OnChanges
{
  candidacies: Candidacy[] = [];
  @Input() period?: Period;
  ville: string = '';
  route: ActivatedRoute = inject(ActivatedRoute);
  candidacyService: CandidacyService = inject(CandidacyService);
  constructor() {
    super();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['period']) {
      const current = changes['period'].currentValue;
      this.period = current;
      if (current) this.loadData();
    }
  }

  ngOnInit(): void {
    this.loadData();
  }

  override loadData() {
    this.candidacyService
      .getCandidacies(
        this.currentPage,
        this.search,
        this.ville,
        this.period?.id,
        this.per_page
      )
      .then((response) => {
        this.candidacies = response.data;
        this.currentPage = response.current_page;
        this.lastPage = response.last_page;
      });
  }
}
