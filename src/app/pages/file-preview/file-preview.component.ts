import { PdfService } from './../../services/pdf.service';
import { Component, Input, OnInit, ViewChild, ElementRef, Output, EventEmitter, AfterViewInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule, NgIf } from '@angular/common';
import { FilePreviewResult } from '../../services/file-preview.service';
import { SafePipe } from '../../pipes/safe.pipe';

@Component({
  selector: 'app-file-preview',
  standalone: true,
  imports: [SafePipe, NgIf],
  template: `
    <div class="preview-container" *ngIf="previewResult">
      <div class="preview-header">
        <h3>{{ previewResult.fileName }}</h3>
        <div class="header-controls">
          <button *ngIf="previewResult.type === 'pdf'" class="control-btn" (click)="toggleFullscreen()" [title]="isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'">
            {{ isFullscreen ? '⤓' : '⤢' }}
          </button>
          <button *ngIf="previewResult.type === 'pdf'" class="control-btn" (click)="downloadFile()" title="Download">
            ⬇
          </button>
          <button class="close-btn" (click)="onClose.emit()">×</button>
        </div>
      </div>

      <div class="preview-content" [class.fullscreen]="isFullscreen">
        <!-- Image Preview -->
        <div *ngIf="previewResult.type === 'image'" class="image-preview">
          <img [src]="getImageContent()" [alt]="previewResult.fileName" class="preview-image">
        </div>

        <!-- PDF Preview -->
        <div *ngIf="previewResult.type === 'pdf'" class="pdf-preview">
          <div class="pdf-controls" *ngIf="pdfDocument">
            <button class="nav-btn" (click)="previousPage()" [disabled]="currentPage <= 1">‹</button>
            <span class="page-info">Page {{ currentPage }} of {{ totalPages }}</span>
            <button class="nav-btn" (click)="nextPage()" [disabled]="currentPage >= totalPages">›</button>
            <div class="zoom-controls">
              <button class="zoom-btn" (click)="zoomOut()" title="Zoom Out">−</button>
              <span class="zoom-level">{{ Math.round(zoomLevel * 100) }}%</span>
              <button class="zoom-btn" (click)="zoomIn()" title="Zoom In">+</button>
            </div>
          </div>

          <div class="pdf-viewer-container">
            <!-- Canvas for PDF.js rendering -->
            <canvas #pdfCanvas class="pdf-canvas" *ngIf="pdfDocument"></canvas>

            <!-- Iframe fallback for PDF viewing -->
            <iframe
              *ngIf="!pdfDocument && !isLoading && pdfBlobUrl"
              [src]="pdfBlobUrl | safe"
              class="pdf-iframe"
              title="PDF Preview">
            </iframe>

            <div *ngIf="isLoading" class="loading-overlay">
              <div class="spinner"></div>
              <p>Loading PDF...</p>
            </div>
          </div>

          <div class="pdf-fallback" *ngIf="!pdfDocument && !isLoading && !pdfBlobUrl">
            <p>PDF preview not available. Click the button below to view in a new tab.</p>
            <button class="view-pdf-btn" (click)="openPdfInNewTab()">
              View PDF in New Tab
            </button>
          </div>
        </div>

        <!-- HTML Preview (Word documents) -->
        <div *ngIf="previewResult.type === 'html'" class="html-preview">
          <div class="document-content" [innerHTML]="getHtmlContent()"></div>
        </div>

        <!-- Text Preview (ODF files) -->
        <div *ngIf="previewResult.type === 'text'" class="text-preview">
          <div class="text-content">
            <p>{{ getTextContent() }}</p>
          </div>
        </div>

        <!-- Spreadsheet Preview (Excel files) -->
        <div *ngIf="previewResult.type === 'spreadsheet'" class="spreadsheet-preview">
          <div class="file-info">
            <div class="file-icon">📊</div>
            <h4>Excel Spreadsheet</h4>
            <p>{{ getTextContent() }}</p>
            <div class="file-details">
              <span class="file-size" *ngIf="previewResult.fileSize">Size: {{ previewResult.fileSize }}</span>
            </div>
          </div>
        </div>

        <!-- Presentation Preview (PowerPoint files) -->
        <div *ngIf="previewResult.type === 'presentation'" class="presentation-preview">
          <div class="file-info">
            <div class="file-icon">📈</div>
            <h4>PowerPoint Presentation</h4>
            <p>{{ getTextContent() }}</p>
            <div class="file-details">
              <span class="file-size" *ngIf="previewResult.fileSize">Size: {{ previewResult.fileSize }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .preview-container {
      background: white;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      overflow: hidden;
      max-width: 100%;
      max-height: 80vh;
      display: flex;
      flex-direction: column;
      transition: all 0.3s ease;
    }

    .preview-container.fullscreen {
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      max-width: none;
      max-height: none;
      z-index: 9999;
      border-radius: 0;
    }

    .preview-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1rem;
      background: #f8f9fa;
      border-bottom: 1px solid #dee2e6;
    }

    .preview-header h3 {
      margin: 0;
      font-size: 1.1rem;
      color: #333;
      word-break: break-all;
    }

    .header-controls {
      display: flex;
      gap: 0.5rem;
      align-items: center;
    }

    .control-btn {
      background: none;
      border: none;
      font-size: 1.2rem;
      cursor: pointer;
      color: #666;
      padding: 0.5rem;
      border-radius: 4px;
      transition: all 0.3s ease;
    }

    .control-btn:hover {
      background: #e9ecef;
      color: #333;
    }

    .close-btn {
      background: none;
      border: none;
      font-size: 1.5rem;
      cursor: pointer;
      color: #666;
      padding: 0.25rem 0.5rem;
      border-radius: 4px;
      transition: background 0.3s ease;
    }

    .close-btn:hover {
      background: #e9ecef;
      color: #333;
    }

    .preview-content {
      flex: 1;
      overflow: auto;
      padding: 1rem;
      transition: all 0.3s ease;
    }

    .preview-content.fullscreen {
      padding: 0;
    }

    .image-preview {
      text-align: center;
    }

    .preview-image {
      max-width: 100%;
      max-height: 70vh;
      object-fit: contain;
      border-radius: 4px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }

    .pdf-preview {
      display: flex;
      flex-direction: column;
      height: 100%;
    }

    .pdf-controls {
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 1rem;
      padding: 1rem;
      background: #f8f9fa;
      border-radius: 6px;
      margin-bottom: 1rem;
      flex-wrap: wrap;
    }

    .nav-btn {
      background: #007bff;
      color: white;
      border: none;
      padding: 0.5rem 1rem;
      border-radius: 4px;
      cursor: pointer;
      font-size: 1.2rem;
      transition: background 0.3s ease;
    }

    .nav-btn:hover:not(:disabled) {
      background: #0056b3;
    }

    .nav-btn:disabled {
      background: #ccc;
      cursor: not-allowed;
    }

    .page-info {
      font-weight: 500;
      color: #333;
      min-width: 100px;
      text-align: center;
    }

    .zoom-controls {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .zoom-btn {
      background: #6c757d;
      color: white;
      border: none;
      padding: 0.25rem 0.5rem;
      border-radius: 4px;
      cursor: pointer;
      font-size: 1rem;
      transition: background 0.3s ease;
    }

    .zoom-btn:hover {
      background: #545b62;
    }

    .zoom-level {
      font-weight: 500;
      color: #333;
      min-width: 50px;
      text-align: center;
    }

    .pdf-viewer-container {
      position: relative;
      flex: 1;
      display: flex;
      justify-content: center;
      align-items: flex-start;
      overflow: auto;
      background: #f0f0f0;
      border-radius: 6px;
      min-height: 400px;
    }

    .pdf-canvas {
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      background: white;
      margin: 1rem;
    }

    .pdf-iframe {
      width: 100%;
      height: 100%;
      border: none;
      border-radius: 6px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    }

    .loading-overlay {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      background: rgba(255, 255, 255, 0.9);
      z-index: 10;
    }

    .spinner {
      width: 40px;
      height: 40px;
      border: 4px solid #f3f3f3;
      border-top: 4px solid #007bff;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin-bottom: 1rem;
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    .pdf-fallback {
      text-align: center;
      padding: 2rem;
    }

    .pdf-info {
      max-width: 400px;
      margin: 0 auto;
    }

    .pdf-info p {
      margin-bottom: 1rem;
      color: #666;
    }

    .view-pdf-btn {
      background: #007bff;
      color: white;
      border: none;
      padding: 0.75rem 1.5rem;
      border-radius: 6px;
      cursor: pointer;
      font-size: 1rem;
      transition: background 0.3s ease;
    }

    .view-pdf-btn:hover {
      background: #0056b3;
    }

    .html-preview {
      max-width: 800px;
      margin: 0 auto;
    }

    .document-content {
      background: white;
      padding: 2rem;
      border: 1px solid #dee2e6;
      border-radius: 6px;
      line-height: 1.6;
      font-family: 'Times New Roman', serif;
      max-width: 100%;
      overflow-x: auto;
    }

    .document-content h1,
    .document-content h2,
    .document-content h3,
    .document-content h4,
    .document-content h5,
    .document-content h6 {
      margin-top: 1.5rem;
      margin-bottom: 0.5rem;
      color: #333;
    }

    .document-content p {
      margin-bottom: 1rem;
    }

    .document-content table {
      border-collapse: collapse;
      width: 100%;
      margin: 1rem 0;
    }

    .document-content table,
    .document-content th,
    .document-content td {
      border: 1px solid #dee2e6;
    }

    .document-content th,
    .document-content td {
      padding: 0.5rem;
      text-align: left;
    }

    .document-content img {
      max-width: 100%;
      height: auto;
      display: block;
      margin: 1rem auto;
    }

    .document-content .docx-preview {
      width: 100%;
    }

    .document-content .docx-preview img {
      max-width: 100%;
      height: auto;
      display: block;
      margin: 1rem auto;
    }

    .text-preview {
      text-align: center;
      padding: 2rem;
    }

    .text-content {
      max-width: 600px;
      margin: 0 auto;
      background: #f8f9fa;
      padding: 1.5rem;
      border-radius: 6px;
      border-left: 4px solid #007bff;
    }

    .text-content p {
      margin: 0;
      color: #666;
      font-size: 1rem;
      line-height: 1.6;
    }

    .spreadsheet-preview,
    .presentation-preview {
      text-align: center;
      padding: 2rem;
    }

    .file-info {
      max-width: 500px;
      margin: 0 auto;
      background: #f8f9fa;
      padding: 2rem;
      border-radius: 8px;
      border-left: 4px solid #28a745;
    }

    .file-icon {
      font-size: 3rem;
      margin-bottom: 1rem;
    }

    .file-info h4 {
      margin: 0 0 1rem 0;
      color: #333;
      font-size: 1.3rem;
    }

    .file-info p {
      margin: 0 0 1.5rem 0;
      color: #666;
      font-size: 1rem;
      line-height: 1.6;
      white-space: pre-line;
    }

    .file-details {
      display: flex;
      justify-content: center;
      gap: 1rem;
      flex-wrap: wrap;
    }

    .file-size {
      background: #e9ecef;
      padding: 0.5rem 1rem;
      border-radius: 20px;
      font-size: 0.9rem;
      color: #495057;
    }

    .spreadsheet-preview .file-info {
      border-left-color: #17a2b8;
    }

    .presentation-preview .file-info {
      border-left-color: #fd7e14;
    }

    @media (max-width: 768px) {
      .preview-container {
        max-height: 90vh;
      }

      .preview-header {
        padding: 0.75rem;
      }

      .preview-header h3 {
        font-size: 1rem;
      }

      .preview-content {
        padding: 0.75rem;
      }

      .document-content {
        padding: 1rem;
      }

      .pdf-controls {
        flex-direction: column;
        gap: 0.5rem;
      }

      .zoom-controls {
        order: -1;
      }
    }
  `]
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

  constructor(private pdfService: PdfService, private cdr: ChangeDetectorRef) {}

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

  getMimeType(fileName: string ): string {
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
