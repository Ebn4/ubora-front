import { PdfService } from './../../services/pdf.service';
import { Component, Input, OnInit, ViewChild, ElementRef, Output, EventEmitter, AfterViewInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule, NgIf } from '@angular/common';
import { FilePreviewResult } from '../../services/file-preview.service';
import { SafePipe } from '../../pipes/safe.pipe';

@Component({
  selector: 'app-file-preview',
  standalone: true,
  imports: [SafePipe, NgIf],
  templateUrl: './file-preview.component.html',
  styleUrl: './file-preview.component.css'
})
export class FilePreviewComponent implements OnInit, AfterViewInit, OnDestroy {
  @Input() previewResult: FilePreviewResult | null = null;
  @Output() onClose = new EventEmitter<void>();
  @ViewChild('pdfCanvas', { static: false }) pdfCanvas!: ElementRef<HTMLCanvasElement>;

  pdfDocument: any = null;
  currentPage = 1;
  totalPages = 0;
  zoomLevel = 1.0;
  isLoading = false;
  isFullscreen = false;
  Math = Math;
  private blobUrls: string[] = [];
  pdfBlobUrl: string | null = null;

  constructor(private pdfService: PdfService, private cdr: ChangeDetectorRef) { }

  ngOnInit() {
    // Component initialization
  }

  ngAfterViewInit() {
    if (this.previewResult?.type === 'pdf') {
      this.loadPdf();
    }
  }

  ngOnDestroy() {
    // Clean up blob URLs to prevent memory leaks
    this.blobUrls.forEach(url => {
      this.pdfService.revokeBlobUrl(url);
    });
    this.blobUrls = [];
    if (this.pdfBlobUrl) {
      this.pdfService.revokeBlobUrl(this.pdfBlobUrl);
      this.pdfBlobUrl = null;
    }
  }

  async loadPdf() {
    if (!this.previewResult || this.previewResult.type !== 'pdf') return;

    this.isLoading = true;
    try {
      const arrayBuffer = this.previewResult.content as ArrayBuffer;

      // Create blob URL for iframe fallback
      this.pdfBlobUrl = this.pdfService.createBlobUrl(arrayBuffer, 'application/pdf');
      this.blobUrls.push(this.pdfBlobUrl);

      // Use the PDF service to load the document
      this.pdfDocument = await this.pdfService.loadPdfDocument(arrayBuffer);
      this.totalPages = this.pdfDocument.numPages;
      this.currentPage = 1;

      // Force change detection to ensure canvas is rendered
      this.cdr.detectChanges();

      // Wait for the next tick to ensure canvas is available
      setTimeout(() => {
        this.renderPageWithRetry();
      }, 0);
    } catch (error) {
      console.error('Error loading PDF:', error);
      this.pdfDocument = null;

      // Show user-friendly error message
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      alert(`PDF Preview Error: ${errorMessage}\n\nPlease try:\n1. Uploading a different PDF file\n2. Checking if the file is not corrupted\n3. Using the "View PDF in New Tab" option below`);

      // Keep the blob URL for iframe fallback
    } finally {
      this.isLoading = false;
    }
  }

  async renderPage() {
    if (!this.pdfDocument) {
      console.warn('PDF document not available for rendering');
      return;
    }

    if (!this.pdfCanvas) {
      console.warn('PDF canvas not available for rendering');
      return;
    }

    try {
      console.log('Rendering PDF page:', this.currentPage, 'with zoom:', this.zoomLevel);
      const page = await this.pdfDocument.getPage(this.currentPage);
      await this.pdfService.renderPage(page, this.pdfCanvas.nativeElement, this.zoomLevel);
      console.log('PDF page rendered successfully');
    } catch (error) {
      console.error('Error rendering PDF page:', error);
    }
  }

  async renderPageWithRetry(maxRetries: number = 3) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      if (this.pdfCanvas) {
        console.log(`Attempt ${attempt}: Canvas is available, rendering page`);
        await this.renderPage();
        return;
      } else {
        console.log(`Attempt ${attempt}: Canvas not available, waiting...`);
        if (attempt < maxRetries) {
          // Wait a bit longer for each retry
          await new Promise(resolve => setTimeout(resolve, 50 * attempt));
          this.cdr.detectChanges();
        }
      }
    }
    console.error('Failed to render PDF after all retry attempts');
  }

  async previousPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
      await this.renderPageWithRetry();
    }
  }

  async nextPage() {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      await this.renderPageWithRetry();
    }
  }

  async zoomIn() {
    this.zoomLevel = Math.min(this.zoomLevel * 1.2, 3.0);
    await this.renderPageWithRetry();
  }

  async zoomOut() {
    this.zoomLevel = Math.max(this.zoomLevel / 1.2, 0.5);
    await this.renderPageWithRetry();
  }

  toggleFullscreen() {
    this.isFullscreen = !this.isFullscreen;
  }

  downloadFile() {
    if (!this.previewResult) return;

    const blob = new Blob([this.previewResult.content as ArrayBuffer], {
      type: this.getMimeType(this.previewResult.fileName)
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = this.previewResult.fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  getMimeType(fileName: string): string {
    const extension = fileName.toLowerCase().split('.').pop();
    switch (extension) {
      case 'pdf': return 'application/pdf';
      case 'docx': return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
      case 'doc': return 'application/msword';
      case 'png': return 'image/png';
      case 'jpg':
      case 'jpeg': return 'image/jpeg';
      default: return 'application/octet-stream';
    }
  }

  openPdfInNewTab() {
    if (this.previewResult && this.previewResult.type === 'pdf') {
      try {
        let url: string;

        // Use existing blob URL if available, otherwise create a new one
        if (this.pdfBlobUrl) {
          url = this.pdfBlobUrl;
        } else {
          const arrayBuffer = this.previewResult.content as ArrayBuffer;
          url = this.pdfService.createBlobUrl(arrayBuffer, 'application/pdf');
          this.blobUrls.push(url);
        }

        // Open in new tab with proper error handling
        const newWindow = window.open(url, '_blank');

        if (!newWindow) {
          // If popup is blocked, show a message
          alert('Popup blocked. Please allow popups for this site to view PDFs in a new tab.');
          if (url !== this.pdfBlobUrl) {
            this.pdfService.revokeBlobUrl(url);
            this.blobUrls = this.blobUrls.filter(u => u !== url);
          }
        }
      } catch (error) {
        console.error('Error opening PDF in new tab:', error);
        alert('Failed to open PDF in new tab. Please try downloading the file instead.');
      }
    }
  }

  getImageContent(): string {
    return this.previewResult?.type === 'image' ? this.previewResult.content as string : '';
  }

  getHtmlContent(): string {
    return this.previewResult?.type === 'html' ? this.previewResult.content as string : '';
  }

  getTextContent(): string {
    return this.previewResult?.type === 'text' ? this.previewResult.content as string : '';
  }
}
