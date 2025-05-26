import { NgClass, NgFor, NgIf } from '@angular/common';
import { Period } from '../../models/period';
import { PeriodService } from './../../services/period.service';
import { Component, inject } from '@angular/core';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

@Component({
  selector: 'app-period',
  imports: [NgFor, FormsModule, RouterLink, NgIf, NgClass, ReactiveFormsModule],
  templateUrl: './period.component.html',
  styleUrl: './period.component.css'
})
export class PeriodComponent {
  periods: Period[] = [];
  currentPage: number = 1;
  lastPage: number = 1;
  search: string = '';
  status: string = '';
  periodService:PeriodService = inject(PeriodService);
  router:Router = inject(Router);
  showModal = false;

  constructor() {}

  ngOnInit(): void {
    this.loadPeriods();
  }

  loadPeriods(page: number = 1) {
    this.periodService.getPeriod(page, this.search, this.status).then(response => {
      this.periods = response.data;
      this.currentPage = response.current_page;
      this.lastPage = response.last_page;
    });
  }

  onSearchChange() {
    this.currentPage = 1;
    this.loadPeriods();
  }

  changePage(page: number) {
    if (page >= 1 && page <= this.lastPage) {
      this.loadPeriods(page);
    }
  }

  openModal() {
    this.showModal = true;
  }

  closeModal() {
    this.showModal = false;
  }

  applyForm = new FormGroup({
    year: new FormControl(new Date().getFullYear()),
  })

  createPeriod(){
    this.periodService.createPeriod(
      this.applyForm.value.year?? new Date().getFullYear()
    )


    this.applyForm = new FormGroup({
      year:new FormControl(new Date().getFullYear()),
    });
    this.ngOnInit();
    this.closeModal();
  }
}

