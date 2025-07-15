import { Component, Inject, inject } from '@angular/core';
import { ImportService } from '../../services/import.service';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-import-file-candidacy',
  imports: [],
  templateUrl: './import-file-candidacy.component.html',
})
export class ImportFileCandidacyComponent {
  importService: ImportService = inject(ImportService);

  periodId: number;
  result = false;

  constructor(
    public dialogRef: MatDialogRef<ImportFileCandidacyComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    this.periodId = data.periodId;
  }

  getDocument() {
    this.importService.getDocument('30 DBA.docx').subscribe((file) => {
      const blob = new Blob([file], { type: file.type });
      const url = window.URL.createObjectURL(blob);
      window.open(url);
    });
  }
}
