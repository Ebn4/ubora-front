import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { FilePreviewResult } from '../../../../services/file-preview.service';
import { FilePreviewComponent } from '../../../file-preview/file-preview.component';

@Component({
  selector: 'app-doc-preview',
  imports: [FilePreviewComponent],
  template: `
        <div class="p-3 w-full">
          <app-file-preview [previewResult]="data.currentPreview" (onClose)="closePreview()"></app-file-preview>
        </div>
  `,
})
export class DocPreviewComponent {
  currentPreview: FilePreviewResult | null = null;

  constructor(
    public dialogRef: MatDialogRef<DocPreviewComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { currentPreview: FilePreviewResult | null }
  ) { }

  ngOnInit(){
    this.currentPreview = this.data.currentPreview
    console.log("data : ", this.closePreview)
  }

  closePreview() {
    this.dialogRef.close();
  }

}
