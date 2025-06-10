import { CriteriaAttachComponent } from './criteria-attach/criteria-attach.component';
import { Component, inject } from '@angular/core';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { CriteriaAjoutComponent } from './criteria-ajout/criteria-ajout.component';
import { BaseListWidget } from '../../widgets/base-list-widget';
import { CriteriaService } from '../../services/criteria.service';
import { Criteria } from '../../models/criteria';
import { NgFor } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CriteriaEditComponent } from './criteria-edit/criteria-edit.component';
import { CriteriaConfirmComponent } from './criteria-confirm/criteria-confirm.component';

@Component({
  selector: 'app-criteria',
  imports: [NgFor, FormsModule],
  templateUrl: './criteria.component.html',
})
export class CriteriaComponent extends BaseListWidget {
  criterias: Criteria[] = [];
  showModal = false;
  criteriaOng: any;
  criteriaService: CriteriaService = inject(CriteriaService);

  constructor(private _matDialog: MatDialog) {
    super();
  }

  ngOnInit(): void {
    this.loadData();
  }

  delete(id: number) {
    const dialogRef = this._matDialog.open(CriteriaConfirmComponent, {
      data: { message: 'Voulez-vous vraiment supprimer ce critère ?' },
      disableClose: true,
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.criteriaService.deleteCriteria(id).then(() => {
          alert('Critère supprimé');
          this.loadData();
        });
      }
    });
  }

  override loadData() {
    this.criteriaService
      .getCriteria(this.currentPage, this.search, this.per_page)
      .then((response) => {
        this.criterias = response.data;
        this.currentPage = response.current_page;
        this.lastPage = response.last_page;
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

  openModalAttach() {
    const dialogConfig = new MatDialogConfig();
    dialogConfig.disableClose = true;
    dialogConfig.data = {};

    const dialogRef = this._matDialog.open(
      CriteriaAttachComponent,
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
