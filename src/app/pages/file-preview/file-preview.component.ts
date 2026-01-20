import { PdfService } from './../../services/pdf.service';
import { Component, Input, OnInit, ViewChild, ElementRef, Output, EventEmitter, AfterViewInit, OnDestroy, ChangeDetectorRef, HostListener } from '@angular/core';
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
  @Input() rotation = 0;
  @Output() onClose = new EventEmitter<void>();
  @Output() onRotate = new EventEmitter<number>();
  @Output() onDownload = new EventEmitter<void>();
  @ViewChild('pdfCanvas', { static: false }) pdfCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('previewImage', { static: false }) previewImage!: ElementRef<HTMLImageElement>;

  // Propriétés PDF
  pdfDocument: any = null;
  currentPage = 1;
  totalPages = 0;
  pdfZoomLevel = 1.0;
  isLoading = false;

  // Propriétés Image
  currentImageRotation = 0;
  imageZoomLevel = 1.0;
  minZoom = 0.1;
  maxZoom = 5.0;
  zoomStep = 0.2;

  // Propriétés communes
  isFullscreen = false;
  Math = Math;
  private blobUrls: string[] = [];
  pdfBlobUrl: string | null = null;

  // Pour le drag sur les images
  isDragging = false;
  dragStartX = 0;
  dragStartY = 0;
  imageTranslateX = 0;
  imageTranslateY = 0;
  lastZoom = 1.0;

  constructor(private pdfService: PdfService, private cdr: ChangeDetectorRef) { }

  ngOnInit() {
    if (this.rotation) {
      this.currentImageRotation = this.rotation;
    }
  }

  ngAfterViewInit() {
    if (this.previewResult?.type === 'pdf') {
      this.loadPdf();
    }
  }

  ngOnDestroy() {
    this.blobUrls.forEach(url => {
      this.pdfService.revokeBlobUrl(url);
    });
    this.blobUrls = [];
    if (this.pdfBlobUrl) {
      this.pdfService.revokeBlobUrl(this.pdfBlobUrl);
      this.pdfBlobUrl = null;
    }
  }

  // Méthode spécifique pour télécharger des images
downloadImage() {
  if (!this.previewResult || this.previewResult.type !== 'image') return;

  const imgUrl = this.getImageContent();
  if (!imgUrl) return;

  this.onDownload.emit();

  // Méthode 1: Créer un canvas pour les images
  const img = new Image();
  img.crossOrigin = 'anonymous';
  img.onload = () => {
    const canvas = document.createElement('canvas');
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext('2d');

    if (ctx) {
      // Appliquer la rotation avant de dessiner
      ctx.save();
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate((this.currentImageRotation * Math.PI) / 180);
      ctx.drawImage(img, -img.width / 2, -img.height / 2);
      ctx.restore();

      // Télécharger l'image avec rotation appliquée
      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = this.previewResult!.fileName;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        }
      }, 'image/png');
    }
  };

  img.src = imgUrl;
}

// Mettez à jour la méthode downloadFile()
downloadFile() {
    if (!this.previewResult) return;

    this.onDownload.emit();

    // Utiliser la méthode spécifique pour les images
    if (this.previewResult.type === 'image') {
      this.downloadImage();
      return;
    }

    // Méthode générale pour les autres types
    try {
      const blob = new Blob([this.previewResult.content as ArrayBuffer], {
        type: this.getMimeType(this.previewResult.fileName)
      });

      // Vérifier la taille du blob
      if (blob.size === 0) {
        console.error('Blob is empty');
        alert('Le fichier est vide ou corrompu');
        return;
      }

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = this.previewResult.fileName;
      a.style.display = 'none';

      document.body.appendChild(a);
      a.click();

      // Nettoyer
      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 100);

    } catch (error) {
      console.error('Error downloading file:', error);
      alert('Erreur lors du téléchargement: ' + error);
    }
  }

  // ============= RACCOURCIS CLAVIER =============
  @HostListener('document:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent) {
    if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
      return;
    }

    switch (event.key.toLowerCase()) {
      case 'escape':
        this.onClose.emit();
        break;
      case 'r':
        if (this.previewResult?.type === 'image') {
          this.rotateImage();
          event.preventDefault();
        }
        break;
      case 'd':
        this.downloadFile();
        event.preventDefault();
        break;
      case 'f':
        this.toggleFullscreen();
        event.preventDefault();
        break;
      case 'arrowleft':
        if (this.previewResult?.type === 'pdf' && this.currentPage > 1) {
          this.previousPage();
          event.preventDefault();
        }
        break;
      case 'arrowright':
        if (this.previewResult?.type === 'pdf' && this.currentPage < this.totalPages) {
          this.nextPage();
          event.preventDefault();
        }
        break;
      case '+':
      case '=':
        if (event.ctrlKey || event.metaKey) {
          event.preventDefault();
          if (this.previewResult?.type === 'image') {
            this.zoomImageIn();
          } else if (this.previewResult?.type === 'pdf') {
            this.zoomIn();
          }
        }
        break;
      case '-':
        if (event.ctrlKey || event.metaKey) {
          event.preventDefault();
          if (this.previewResult?.type === 'image') {
            this.zoomImageOut();
          } else if (this.previewResult?.type === 'pdf') {
            this.zoomOut();
          }
        }
        break;
      case '0':
        if (event.ctrlKey || event.metaKey) {
          event.preventDefault();
          if (this.previewResult?.type === 'image') {
            this.resetImageZoom();
          } else if (this.previewResult?.type === 'pdf') {
            this.pdfZoomLevel = 1.0;
            this.renderPageWithRetry();
          }
        }
        break;
    }
  }

  // ============= MÉTHODES IMAGE =============
  rotateImage() {
    this.currentImageRotation = (this.currentImageRotation + 90) % 360;
    this.onRotate.emit(this.currentImageRotation);
  }

  resetImageRotation() {
    this.currentImageRotation = 0;
    this.onRotate.emit(0);
  }

  zoomImageIn() {
    const oldZoom = this.imageZoomLevel;
    this.imageZoomLevel = Math.min(this.imageZoomLevel + this.zoomStep, this.maxZoom);
    this.adjustImagePositionOnZoom(oldZoom, this.imageZoomLevel);
  }

  zoomImageOut() {
    const oldZoom = this.imageZoomLevel;
    this.imageZoomLevel = Math.max(this.imageZoomLevel - this.zoomStep, this.minZoom);
    this.adjustImagePositionOnZoom(oldZoom, this.imageZoomLevel);
  }

  resetImageZoom() {
    this.imageZoomLevel = 1.0;
    this.imageTranslateX = 0;
    this.imageTranslateY = 0;
  }

  adjustImagePositionOnZoom(oldZoom: number, newZoom: number) {
    const zoomFactor = newZoom / oldZoom;
    this.imageTranslateX = this.imageTranslateX * zoomFactor;
    this.imageTranslateY = this.imageTranslateY * zoomFactor;
  }

  // Drag pour les images
  onImageMouseDown(event: MouseEvent) {
    if (this.imageZoomLevel > 1.0) {
      this.isDragging = true;
      this.dragStartX = event.clientX - this.imageTranslateX;
      this.dragStartY = event.clientY - this.imageTranslateY;
      event.preventDefault();
    }
  }

  onImageMouseMove(event: MouseEvent) {
    if (this.isDragging && this.imageZoomLevel > 1.0) {
      this.imageTranslateX = event.clientX - this.dragStartX;
      this.imageTranslateY = event.clientY - this.dragStartY;
    }
  }

  onImageMouseUp() {
    this.isDragging = false;
  }

  onImageWheel(event: WheelEvent) {
    if (event.ctrlKey || event.metaKey) {
      event.preventDefault();
      if (event.deltaY < 0) {
        this.zoomImageIn();
      } else {
        this.zoomImageOut();
      }
    }
  }

  // ============= MÉTHODES PDF =============
  async loadPdf() {
    if (!this.previewResult || this.previewResult.type !== 'pdf') return;

    this.isLoading = true;
    try {
      const arrayBuffer = this.previewResult.content as ArrayBuffer;

      this.pdfBlobUrl = this.pdfService.createBlobUrl(arrayBuffer, 'application/pdf');
      this.blobUrls.push(this.pdfBlobUrl);

      this.pdfDocument = await this.pdfService.loadPdfDocument(arrayBuffer);
      this.totalPages = this.pdfDocument.numPages;
      this.currentPage = 1;

      this.cdr.detectChanges();

      setTimeout(() => {
        this.renderPageWithRetry();
      }, 0);
    } catch (error) {
      console.error('Error loading PDF:', error);
      this.pdfDocument = null;

      // En cas d'erreur, utiliser l'iframe avec le blob URL
      if (this.pdfBlobUrl) {
        console.log('Using iframe fallback for PDF');
      } else {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        console.error('PDF Preview Error:', errorMessage);
      }
    } finally {
      this.isLoading = false;
    }
  }

  async renderPage() {
    if (!this.pdfDocument) return;
    if (!this.pdfCanvas) return;

    try {
      const page = await this.pdfDocument.getPage(this.currentPage);
      await this.pdfService.renderPage(page, this.pdfCanvas.nativeElement, this.pdfZoomLevel);
    } catch (error) {
      console.error('Error rendering PDF page:', error);
      // En cas d'erreur, basculer vers l'iframe
      this.pdfDocument = null;
      this.cdr.detectChanges();
    }
  }

  async renderPageWithRetry(maxRetries: number = 3) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      if (this.pdfCanvas) {
        await this.renderPage();
        return;
      } else {
        if (attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, 50 * attempt));
          this.cdr.detectChanges();
        }
      }
    }
    console.error('Failed to render PDF after all retry attempts');
    // Basculer vers l'iframe en cas d'échec
    this.pdfDocument = null;
    this.cdr.detectChanges();
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
    this.pdfZoomLevel = Math.min(this.pdfZoomLevel * 1.2, 3.0);
    await this.renderPageWithRetry();
  }

  async zoomOut() {
    this.pdfZoomLevel = Math.max(this.pdfZoomLevel / 1.2, 0.5);
    await this.renderPageWithRetry();
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
      case 'gif': return 'image/gif';
      case 'bmp': return 'image/bmp';
      case 'webp': return 'image/webp';
      case 'txt': return 'text/plain';
      case 'csv': return 'text/csv';
      default: return 'application/octet-stream';
    }
  }

  openPdfInNewTab() {
    if (this.previewResult && this.previewResult.type === 'pdf') {
      try {
        let url: string;

        if (this.pdfBlobUrl) {
          url = this.pdfBlobUrl;
        } else {
          const arrayBuffer = this.previewResult.content as ArrayBuffer;
          url = this.pdfService.createBlobUrl(arrayBuffer, 'application/pdf');
          this.blobUrls.push(url);
        }

        const newWindow = window.open(url, '_blank');

        if (!newWindow) {
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

  toggleFullscreen() {
    this.isFullscreen = !this.isFullscreen;
  }
}