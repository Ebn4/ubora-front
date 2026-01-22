import { NgClass, NgFor, NgIf } from '@angular/common';
import { Period } from '../../models/period';
import { PeriodService } from './../../services/period.service';
import { Component, inject } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { BaseListWidget } from '../../widgets/base-list-widget';
import { PeriodModalComponent } from './period-modal/period-modal.component';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';

@Component({
  selector: 'app-period',
  imports: [NgFor, FormsModule, RouterLink, NgClass, ReactiveFormsModule, NgIf],
  templateUrl: './period.component.html',
})
export class PeriodComponent extends BaseListWidget {
  periodService: PeriodService = inject(PeriodService);
  periods: Period[] = [];

  // Ajout de la propriété isLoading
  isLoading: boolean = true;

  router: Router = inject(Router);
  showModal = false;

  // Ajout de Math pour l'utilisation dans le template
  protected readonly Math = Math;

  constructor(private _matDialog: MatDialog) {
    super();
  }

  ngOnInit(): void {
    this.loadData();
  }

  override loadData() {
    this.isLoading = true;
    this.periodService
      .getPeriod(this.currentPage, this.search, this.status, this.per_page)
      .subscribe({
        next: (response) => {
          this.periods = response.data;
          this.currentPage = response.meta.current_page;
          this.lastPage = response.meta.last_page;
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error loading periods:', error);
          this.isLoading = false;
        }
      });
  }

  openModal() {
    const dialogConfig = new MatDialogConfig();
    dialogConfig.disableClose = true;
    dialogConfig.data = {};

    const dialogRef = this._matDialog.open(PeriodModalComponent, dialogConfig);
    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.loadData();
      }
    });
  }

  closeModal() {
    this.showModal = false;
  }
}