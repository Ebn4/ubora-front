import { Injectable } from '@angular/core';
import * as pdfjsLib from 'pdfjs-dist';

@Injectable({
  providedIn: 'root'
})
export class PdfService {
  private isInitialized = false;

  constructor() {
    this.initializePdfJs();
  }

  private initializePdfJs() {
    if (this.isInitialized) return;

    try {
      // Set up PDF.js worker with fallback options
      if (typeof window !== 'undefined' && 'Worker' in window) {
        // Use the specific version we have installed (3.11.174)
        pdfjsLib.GlobalWorkerOptions.workerSrc = '//cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
      }
      
      this.isInitialized = true;
    } catch (error) {
      console.error('Failed to initialize PDF.js:', error);
    }
  }

  async loadPdfDocument(arrayBuffer: ArrayBuffer): Promise<any> {
    try {
      this.initializePdfJs();
      
      // Check if the array buffer is empty
      if (!arrayBuffer || arrayBuffer.byteLength === 0) {
        throw new Error('The PDF file is empty, i.e. its size is zero bytes.');
      }
      
      // Check if the file has a valid PDF header
      const uint8Array = new Uint8Array(arrayBuffer);
      const pdfHeader = String.fromCharCode(...uint8Array.slice(0, 4));
      if (pdfHeader !== '%PDF') {
        throw new Error('Invalid PDF file: File does not have a valid PDF header.');
      }
      
      const loadingTask = pdfjsLib.getDocument({
        data: arrayBuffer,
        verbosity: 0,
        cMapUrl: '//cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/cmaps/',
        cMapPacked: true
      });

      return await loadingTask.promise;
    } catch (error) {
      console.error('Error loading PDF document:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to load PDF: ${errorMessage}`);
    }
  }

  async renderPage(page: any, canvas: HTMLCanvasElement, scale: number = 1.0): Promise<void> {
    try {
      const viewport = page.getViewport({ scale });
      const context = canvas.getContext('2d');

      if (!context) {
        throw new Error('Could not get 2D context from canvas');
      }

      // Set canvas dimensions
      canvas.height = viewport.height;
      canvas.width = viewport.width;
      
      console.log('Canvas dimensions set:', canvas.width, 'x', canvas.height, 'scale:', scale);

      const renderContext = {
        canvasContext: context,
        viewport: viewport
      };

      await page.render(renderContext).promise;
      console.log('PDF page rendered to canvas successfully');
    } catch (error) {
      console.error('Error rendering PDF page:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to render PDF page: ${errorMessage}`);
    }
  }

  createBlobUrl(arrayBuffer: ArrayBuffer, mimeType: string = 'application/pdf'): string {
    try {
      const blob = new Blob([arrayBuffer], { type: mimeType });
      return URL.createObjectURL(blob);
    } catch (error) {
      console.error('Error creating blob URL:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to create blob URL: ${errorMessage}`);
    }
  }

  revokeBlobUrl(url: string): void {
    try {
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error revoking blob URL:', error);
    }
  }
} 