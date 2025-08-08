import { Injectable } from '@angular/core';
import { Observable, from } from 'rxjs';
import * as mammoth from 'mammoth';
import * as docxPreview from 'docx-preview';

export interface FilePreviewResult {
  type: 'text' | 'html' | 'image' | 'pdf' | 'spreadsheet' | 'presentation';
  content: string | ArrayBuffer;
  fileName: string;
  fileType: string;
  fileSize?: string;
}

@Injectable({
  providedIn: 'root'
})
export class FilePreviewService {

  constructor() { }

  previewFile(file: File): Observable<FilePreviewResult> {
    return from(this.processFile(file));
  }

  private async processFile(file: File): Promise<FilePreviewResult> {
    const fileType = file.type.toLowerCase();
    const fileName = file.name;
    const fileExtension = fileName.toLowerCase().split('.').pop() || '';

    // Handle image files
    if (fileType.includes('image/') || ['png', 'jpg', 'jpeg', 'gif', 'bmp', 'webp'].includes(fileExtension)) {
      return this.handleImageFile(file, fileName, fileType);
    }

    // Handle PDF files
    if (fileType === 'application/pdf' || fileExtension === 'pdf') {
      return this.handlePdfFile(file, fileName);
    }

    // Handle Word documents
    if (fileType.includes('word') || fileType.includes('docx') || fileType.includes('doc') ||
      ['docx', 'doc'].includes(fileExtension)) {
      return this.handleWordFile(file, fileName, fileType);
    }

    // Handle Excel files
    if (fileType.includes('excel') || fileType.includes('spreadsheet') ||
      ['xlsx', 'xls'].includes(fileExtension)) {
      return this.handleExcelFile(file, fileName, fileType);
    }

    // Handle PowerPoint files
    if (fileType.includes('powerpoint') || fileType.includes('presentation') ||
      ['pptx', 'ppt'].includes(fileExtension)) {
      return this.handlePowerPointFile(file, fileName, fileType);
    }

    // Handle text files
    if (fileType.includes('text/') || ['txt', 'md', 'csv', 'json', 'xml', 'html', 'htm'].includes(fileExtension)) {
      return this.handleTextFile(file, fileName, fileType);
    }

    // Handle ODF files
    if (fileType.includes('opendocument') || fileExtension === 'odf') {
      return this.handleOdfFile(file, fileName);
    }

    throw new Error(`Unsupported file type: ${fileType} (${fileExtension})`);
  }

  private async handleImageFile(file: File, fileName: string, fileType: string): Promise<FilePreviewResult> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        resolve({
          type: 'image',
          content: e.target?.result as string,
          fileName,
          fileType,
          fileSize: this.formatFileSize(file.size)
        });
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  private async handlePdfFile(file: File, fileName: string): Promise<FilePreviewResult> {
    return new Promise((resolve, reject) => {
      // Check if file is empty
      if (file.size === 0) {
        reject(new Error('The PDF file is empty, i.e. its size is zero bytes.'));
        return;
      }

      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const arrayBuffer = e.target?.result as ArrayBuffer;

          // Additional validation for PDF content
          if (!arrayBuffer || arrayBuffer.byteLength === 0) {
            reject(new Error('The PDF file is empty, i.e. its size is zero bytes.'));
            return;
          }

          // Check for valid PDF header
          const uint8Array = new Uint8Array(arrayBuffer);
          if (uint8Array.length < 4) {
            reject(new Error('Invalid PDF file: File is too small to be a valid PDF.'));
            return;
          }

          const pdfHeader = String.fromCharCode(...uint8Array.slice(0, 4));
          if (pdfHeader !== '%PDF') {
            reject(new Error('Invalid PDF file: File does not have a valid PDF header.'));
            return;
          }

          resolve({
            type: 'pdf',
            content: arrayBuffer,
            fileName,
            fileType: 'application/pdf',
            fileSize: this.formatFileSize(file.size)
          });
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = (error) => {
        reject(new Error(`Failed to read PDF file: ${error}`));
      };
      reader.readAsArrayBuffer(file);
    });
  }

  private async handleWordFile(file: File, fileName: string, fileType: string): Promise<FilePreviewResult> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const arrayBuffer = e.target?.result as ArrayBuffer;

          // Use docx-preview for better style preservation
          const container = document.createElement('div');
          container.style.cssText = `
            font-family: 'Times New Roman', serif;
            line-height: 1.6;
            color: #333;
            background: white;
            padding: 2rem;
            max-width: 800px;
            margin: 0 auto;
          `;

          // Configure docx-preview options for better rendering
          const options = {
            className: 'docx-preview',
            inWrapper: true,
            ignoreWidth: false,
            ignoreHeight: false,
            ignoreFonts: false,
            breakPages: true,
            ignoreLastRenderedPageBreak: true,
            experimental: true,
            trimXmlDeclaration: true,
            useBase64URL: true,
            useMathMLPolyfill: true,
            renderEndnotes: true,
            renderFooters: true,
            renderFootnotes: true,
            renderHeaders: true,
            table: {
              maxWidth: 100,
              usePercentages: true
            },
            image: {
              preserveAspectRatio: true,
              maxWidth: 100,
              maxHeight: 100
            }
          };

          console.log('Rendering DOCX with docx-preview...');
          await docxPreview.renderAsync(arrayBuffer, container, undefined, options);
          console.log('DOCX rendered successfully');

          // Add custom CSS for better styling
          const customStyles = `
            <style>
              .docx-preview {
                font-family: 'Times New Roman', serif !important;
                line-height: 1.6 !important;
                color: #333 !important;
                background: white !important;
              }

              .docx-preview h1, .docx-preview h2, .docx-preview h3,
              .docx-preview h4, .docx-preview h5, .docx-preview h6 {
                margin-top: 1.5rem !important;
                margin-bottom: 0.5rem !important;
                color: #333 !important;
                font-weight: bold !important;
              }

              .docx-preview h1 { font-size: 2rem !important; }
              .docx-preview h2 { font-size: 1.75rem !important; }
              .docx-preview h3 { font-size: 1.5rem !important; }
              .docx-preview h4 { font-size: 1.25rem !important; }
              .docx-preview h5 { font-size: 1.1rem !important; }
              .docx-preview h6 { font-size: 1rem !important; }

              .docx-preview p {
                margin-bottom: 1rem !important;
                text-align: justify !important;
              }

              .docx-preview table {
                border-collapse: collapse !important;
                width: 100% !important;
                margin: 1rem 0 !important;
              }

              .docx-preview table, .docx-preview th, .docx-preview td {
                border: 1px solid #dee2e6 !important;
              }

              .docx-preview th, .docx-preview td {
                padding: 0.5rem !important;
                text-align: left !important;
              }

              .docx-preview img {
                max-width: 100% !important;
                height: auto !important;
                display: block !important;
                margin: 1rem auto !important;
              }

              .docx-preview ul, .docx-preview ol {
                margin-bottom: 1rem !important;
                padding-left: 2rem !important;
              }

              .docx-preview li {
                margin-bottom: 0.5rem !important;
              }

              .docx-preview blockquote {
                border-left: 4px solid #007bff !important;
                padding-left: 1rem !important;
                margin: 1rem 0 !important;
                font-style: italic !important;
                color: #666 !important;
              }

              .docx-preview code {
                background: #f8f9fa !important;
                padding: 0.2rem 0.4rem !important;
                border-radius: 3px !important;
                font-family: 'Courier New', monospace !important;
              }

              .docx-preview pre {
                background: #f8f9fa !important;
                padding: 1rem !important;
                border-radius: 6px !important;
                overflow-x: auto !important;
                margin: 1rem 0 !important;
              }

              .docx-preview .page {
                margin-bottom: 2rem !important;
                page-break-after: always !important;
              }

              .docx-preview .page:last-child {
                page-break-after: auto !important;
              }
            </style>
          `;

          // Combine custom styles with the rendered content
          const htmlContent = customStyles + container.innerHTML;

          resolve({
            type: 'html',
            content: htmlContent,
            fileName,
            fileType,
            fileSize: this.formatFileSize(file.size)
          });
        } catch (error) {
          console.error('docx-preview failed:', error);
          // Fallback to mammoth if docx-preview fails
          try {
            const arrayBuffer = e.target?.result as ArrayBuffer;
            const result = await mammoth.convertToHtml({ arrayBuffer });

            const html = `
              <style>
                body { font-family: 'Times New Roman', serif; line-height: 1.6; color: #333; }
                h1, h2, h3, h4, h5, h6 { margin-top: 1.5rem; margin-bottom: 0.5rem; color: #333; }
                p { margin-bottom: 1rem; }
                table { border-collapse: collapse; width: 100%; margin: 1rem 0; }
                table, th, td { border: 1px solid #dee2e6; }
                th, td { padding: 0.5rem; text-align: left; }
                img { max-width: 100%; height: auto; }
              </style>
              ${result.value}
            `;

            resolve({
              type: 'html',
              content: html,
              fileName,
              fileType,
              fileSize: this.formatFileSize(file.size)
            });
          } catch (mammothError) {
            console.error('mammoth fallback also failed:', mammothError);
            reject(new Error(`Failed to process Word document: ${error}. Fallback also failed: ${mammothError}`));
          }
        }
      };
      reader.onerror = reject;
      reader.readAsArrayBuffer(file);
    });
  }

  private async handleExcelFile(file: File, fileName: string, fileType: string): Promise<FilePreviewResult> {
    return Promise.resolve({
      type: 'spreadsheet',
      content: `Excel file: ${fileName}\n\nThis file contains spreadsheet data. For full functionality, please open in Microsoft Excel, Google Sheets, or LibreOffice Calc.\n\nFile size: ${this.formatFileSize(file.size)}`,
      fileName,
      fileType,
      fileSize: this.formatFileSize(file.size)
    });
  }

  private async handlePowerPointFile(file: File, fileName: string, fileType: string): Promise<FilePreviewResult> {
    return Promise.resolve({
      type: 'presentation',
      content: `PowerPoint file: ${fileName}\n\nThis file contains presentation data. For full functionality, please open in Microsoft PowerPoint, Google Slides, or LibreOffice Impress.\n\nFile size: ${this.formatFileSize(file.size)}`,
      fileName,
      fileType,
      fileSize: this.formatFileSize(file.size)
    });
  }

  private async handleTextFile(file: File, fileName: string, fileType: string): Promise<FilePreviewResult> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const content = e.target?.result as string;
          resolve({
            type: 'text',
            content: content,
            fileName,
            fileType,
            fileSize: this.formatFileSize(file.size)
          });
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = reject;
      reader.readAsText(file, 'UTF-8');
    });
  }

  private async handleOdfFile(file: File, fileName: string): Promise<FilePreviewResult> {
    return Promise.resolve({
      type: 'text',
      content: `ODF file: ${fileName}\n\nODF (Open Document Format) files are not directly supported in this preview. Please convert to PDF or Word format for preview, or open in LibreOffice, OpenOffice, or other ODF-compatible applications.\n\nFile size: ${this.formatFileSize(file.size)}`,
      fileName,
      fileType: 'application/vnd.oasis.opendocument.formula',
      fileSize: this.formatFileSize(file.size)
    });
  }

  private formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  getSupportedFileTypes(): string[] {
    return [
      // Documents
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'application/vnd.ms-powerpoint',

      // Images
      'image/png',
      'image/jpeg',
      'image/jpg',
      'image/gif',
      'image/bmp',
      'image/webp',

      // Text files
      'text/plain',
      'text/markdown',
      'text/csv',
      'application/json',
      'application/xml',
      'text/html',

      // ODF
      'application/vnd.oasis.opendocument.formula',
      'application/vnd.oasis.opendocument.text',
      'application/vnd.oasis.opendocument.spreadsheet',
      'application/vnd.oasis.opendocument.presentation'
    ];
  }

  getSupportedExtensions(): string[] {
    return [
      // Documents
      'pdf', 'docx', 'doc', 'xlsx', 'xls', 'pptx', 'ppt',
      // Images
      'png', 'jpg', 'jpeg', 'gif', 'bmp', 'webp',
      // Text files
      'txt', 'md', 'csv', 'json', 'xml', 'html', 'htm',
      // ODF
      'odf', 'odt', 'ods', 'odp'
    ];
  }

  isFileSupported(file: File): boolean {
    const supportedTypes = this.getSupportedFileTypes();
    const supportedExtensions = this.getSupportedExtensions();
    const fileExtension = file.name.toLowerCase().split('.').pop() || '';

    return supportedTypes.includes(file.type.toLowerCase()) ||
      supportedExtensions.includes(fileExtension);
  }

  getFileTypeInfo(file: File): { type: string; description: string; icon: string } {
    const fileType = file.type.toLowerCase();
    const fileExtension = file.name.toLowerCase().split('.').pop() || '';

    // Document types
    if (fileType.includes('pdf') || fileExtension === 'pdf') {
      return { type: 'PDF Document', description: 'Portable Document Format', icon: '📄' };
    }
    if (fileType.includes('word') || fileType.includes('docx') || fileType.includes('doc') ||
      ['docx', 'doc'].includes(fileExtension)) {
      return { type: 'Word Document', description: 'Microsoft Word Document', icon: '📝' };
    }
    if (fileType.includes('excel') || fileType.includes('spreadsheet') ||
      ['xlsx', 'xls'].includes(fileExtension)) {
      return { type: 'Excel Spreadsheet', description: 'Microsoft Excel Spreadsheet', icon: '📊' };
    }
    if (fileType.includes('powerpoint') || fileType.includes('presentation') ||
      ['pptx', 'ppt'].includes(fileExtension)) {
      return { type: 'PowerPoint Presentation', description: 'Microsoft PowerPoint Presentation', icon: '📈' };
    }

    // Image types
    if (fileType.includes('image/') || ['png', 'jpg', 'jpeg', 'gif', 'bmp', 'webp'].includes(fileExtension)) {
      return { type: 'Image File', description: 'Image File', icon: '🖼️' };
    }

    // Text types
    if (fileType.includes('text/') || ['txt', 'md', 'csv', 'json', 'xml', 'html', 'htm'].includes(fileExtension)) {
      return { type: 'Text File', description: 'Text Document', icon: '📄' };
    }

    // ODF types
    if (fileType.includes('opendocument') || ['odf', 'odt', 'ods', 'odp'].includes(fileExtension)) {
      return { type: 'Open Document', description: 'Open Document Format', icon: '📋' };
    }

    return { type: 'Unknown File', description: 'Unknown file type', icon: '❓' };
  }
}
