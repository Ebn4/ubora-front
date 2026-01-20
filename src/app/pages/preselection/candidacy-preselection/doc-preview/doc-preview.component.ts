import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { FilePreviewResult } from '../../../../services/file-preview.service';
import { FilePreviewComponent } from '../../../file-preview/file-preview.component';

@Component({
  selector: 'app-doc-preview',
  imports: [FilePreviewComponent],
  template: `
    <div class="fixed inset-0 flex items-center justify-center backdrop-blur-sm p-4 z-9999">
      <div class="w-full max-w-6xl">
        <app-file-preview
          [previewResult]="data.currentPreview"
          [rotation]="data.rotation || 0"
          (onClose)="closePreview()"
          (onRotate)="onRotate($event)"
          (onDownload)="onDownload()">
        </app-file-preview>
      </div>
    </div>
  `,
})
export class DocPreviewComponent {
  currentPreview: FilePreviewResult | null = null;
  rotation = 0;

  constructor(
    public dialogRef: MatDialogRef<DocPreviewComponent>,
    @Inject(MAT_DIALOG_DATA) public data: {
      currentPreview: FilePreviewResult | null,
      rotation?: number
    }
  ) { }

  ngOnInit() {
    this.currentPreview = this.data.currentPreview;
    this.rotation = this.data.rotation || 0;
  }

  onRotate(newRotation: number) {
    this.rotation = newRotation;
  }

  onDownload() {
    // Vous pouvez logger le téléchargement si besoin
    console.log('Document téléchargé depuis la prévisualisation');
  }

  closePreview() {
    this.dialogRef.close({ rotation: this.rotation });
  }
}