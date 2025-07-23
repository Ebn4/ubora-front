import { Component, inject, Input, signal } from '@angular/core';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { CriteriaAjoutComponent } from './criteria-ajout/criteria-ajout.component';
import { BaseListWidget } from '../../widgets/base-list-widget';
import { CriteriaService } from '../../services/criteria.service';
import { Criteria } from '../../models/criteria';
import { NgFor, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CriteriaEditComponent } from './criteria-edit/criteria-edit.component';
import { CriteriaConfirmComponent } from './criteria-confirm/criteria-confirm.component';
import { Period } from '../../models/period';
import { ActivatedRoute } from '@angular/router';
import { ListeningChangeService } from '../../services/listening-change.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-criteria',
  imports: [NgFor, FormsModule, NgIf],
  templateUrl: './criteria.component.html',
})
export class CriteriaComponent extends BaseListWidget {
  criterias: Criteria[] = [];
  showModal = false;
  criteriaOng: any;
  type: string = '';
  criteriaService: CriteriaService = inject(CriteriaService);
  route: ActivatedRoute = inject(ActivatedRoute);
  periodId!: number;
  private subscription!: Subscription;


  constructor(private _matDialog: MatDialog, private modalService: ListeningChangeService) {
    super();
  }

  ngOnInit(): void {
    this.loadData();

    this.subscription = this.modalService.modalClosed$.subscribe((modalClosed) => {
      if (modalClosed) {
        this.loadData();
        this.modalService.resetNotification();
      }
    });
  }

  changeStatus(id: number) {
    const dialogRef = this._matDialog.open(CriteriaConfirmComponent, {
      data: { message: 'Voulez-vous vraiment exécuter cette action ?' },
      disableClose: true,
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.criteriaService.deleteCriteria(id).subscribe({
          next: () => {
            this.loadData();
          }
        });
      }
    });
  }

  override loadData() {
    this.periodId = Number(this.route.snapshot.paramMap.get('id'));
    this.criteriaService
      .getCriteria(
        this.currentPage,
        this.search,
        this.type,
        this.per_page,
        this.periodId
      )
      .subscribe({
        next: (response) => {
          this.criterias = response.data;
          this.currentPage = response.current_page;
          this.lastPage = response.last_page;
        },
        error: (error) => {
          console.error('Error loading candidacies:', error);
        }
      });
  }

  openModalAjout() {
    const dialogConfig = new MatDialogConfig();
    dialogConfig.disableClose = true;
    dialogConfig.data = {};

    const dialogRef = this._matDialog.open(
      CriteriaAjoutComponent,
      dialogConfig
    );
    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.loadData();
      }
    });
  }

  openModalEdit(criteriaId: number) {
    const dialogConfig = new MatDialogConfig();
    dialogConfig.disableClose = true;
    dialogConfig.data = { criteriaId };

    const dialogRef = this._matDialog.open(CriteriaEditComponent, dialogConfig);
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
