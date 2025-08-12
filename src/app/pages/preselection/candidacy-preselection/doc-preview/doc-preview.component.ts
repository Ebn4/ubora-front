import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { FilePreviewResult } from '../../../../services/file-preview.service';
import { FilePreviewComponent } from '../../../file-preview/file-preview.component';

@Component({
  selector: 'app-doc-preview',
  imports: [FilePreviewComponent],
  template: `
        <div class="fixed inset-0 flex items-center justify-center backdrop-blur-sm p-4">
          <div class="w-full max-w-6xl">
            <app-file-preview [previewResult]="data.currentPreview" (onClose)="closePreview()"></app-file-preview>
          </div>
        </div>
  `,
})
export class DocPreviewComponent {
  currentPreview: FilePreviewResult | null = null;

  constructor(
    public dialogRef: MatDialogRef<DocPreviewComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { currentPreview: FilePreviewResult | null }
  ) { }

  ngOnInit() {
    this.currentPreview = this.data.currentPreview
    console.log("data : ", this.closePreview)
  }

  closePreview() {
    this.dialogRef.close();
  }

}
