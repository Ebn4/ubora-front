import { Component, signal, computed, inject, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { CsvData } from '../../models/csv-data';
import { ImportService } from '../../services/import.service';
import { Router } from '@angular/router';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { ListeningChangeService } from '../../services/listening-change.service';
import {MatSnackBar} from '@angular/material/snack-bar';


@Component({
  selector: 'app-import-file-candidacies',
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatTableModule,
  ],
  templateUrl: './import-file-candidacies.component.html',
})
export class ImportFileCandidaciesComponent {
  selectedFile = signal<File | null>(null);
  csvData = signal<CsvData | null>(null);
  isProcessing = signal<boolean>(false);
  error = signal<string | null>(null);
  message: string = '';
  isLoading = false;
  isLoadingDoc = false;
  importService: ImportService = inject(ImportService);
  readonly snackbar = inject(MatSnackBar)
  router: Router = inject(Router);
  periodId: number;
  year!: number;
  result = false

  constructor(
    public dialogRef: MatDialogRef<ImportFileCandidaciesComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private modalService: ListeningChangeService
  ) {
    this.periodId = data.periodId;
    this.year = data.year
  }

  displayedColumns = computed(() => {
    const data = this.csvData();
    return data ? data.headers : [];
  });

  dataSource = computed(() => {
    const data = this.csvData();
    if (!data) return [];

    // Normalize rows to match header count
    const normalizedRows = this.normalizeRowsToHeaders(
      data.rows,
      data.headers.length
    );

    const res = normalizedRows.map((row) => {
      const obj: any = {};
      data.headers.forEach((header, index) => {
        obj[header] = row[index] || '';
      });
      return obj;
    });

    //console.log('dataSource', res);
    res.forEach((e, i) => {
      //console.log(i, '=>', Object.keys(e).length);
    });

    return res;
  });

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;

    if (input.files && input.files.length > 0) {
      const file = input.files[0];

      // Validate file type
      if (!file.name.toLowerCase().endsWith('.csv')) {
        this.error.set('Please select a CSV file');
        return;
      }

      this.selectedFile.set(file);
      this.error.set(null);
      this.processFile(file);
    }
  }

  private processFile(file: File): void {
    this.isProcessing.set(true);
    this.csvData.set(null);

    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        // Try to fix malformed CSV content
        const fixedText = this.fixMalformedCsv(text);
        const parsed = this.parseCsv(fixedText);
        this.csvData.set(parsed);
      } catch (error) {
        this.error.set('Error parsing CSV file. Please check the file format.');
      } finally {
        this.isProcessing.set(false);
      }
    };

    reader.onerror = () => {
      this.error.set('Error reading file');
      this.isProcessing.set(false);
    };

    reader.readAsText(file);
  }

  private fixMalformedCsv(text: string): string {
    const semicolonCount = (text.match(/;/g) || []).length;
    const commaCount = (text.match(/,/g) || []).length;
    const delimiter = semicolonCount > commaCount ? ';' : ',';

    let lines = text.split('\n');

    if (lines.length > 0) {
      let headerLine = lines[0];

      headerLine = headerLine
        .replace(/""([^"]*)""/g, '$1')
        .replace(/^"/, '')
        .replace(/"$/, '')
        .replace(/";"/g, delimiter)
        .replace(/","/, delimiter);

      lines[0] = headerLine;
    }

    lines = lines.map((line, index) => {
      if (index === 0) return line;

      let fixedLine = line;

      if (fixedLine.startsWith('"') && fixedLine.includes(';')) {
        const match = fixedLine.match(/^"([^"]*(?:""[^"]*)*)"(.*)/);
        if (match) {
          const quotedContent = match[1];
          const trailing = match[2];

          const cleanedContent = quotedContent
            .replace(/""/g, '"')
            .replace(/;"/g, ';')
            .replace(/";/g, ';')
            .replace(/^"/, '')
            .replace(/"$/, '');

          fixedLine = cleanedContent;

          if (trailing && trailing.includes(',')) {
            const trailingFields = trailing.split(',').length - 1;
            for (let i = 0; i < trailingFields; i++) {
              fixedLine += ';';
            }
          }
        }
      }

      if (delimiter === ';') {
        fixedLine = this.replaceDelimiterOutsideQuotes(fixedLine, ',', ';');
      } else {
        fixedLine = this.replaceDelimiterOutsideQuotes(fixedLine, ';', ',');
      }

      return fixedLine;
    });

    return lines.join('\n');
  }

  private replaceDelimiterOutsideQuotes(
    line: string,
    from: string,
    to: string
  ): string {
    let result = '';
    let inQuotes = false;
    let quoteChar = '';

    for (let i = 0; i < line.length; i++) {
      const char = line[i];

      if ((char === '"' || char === "'") && !inQuotes) {
        inQuotes = true;
        quoteChar = char;
        result += char;
      } else if (char === quoteChar && inQuotes) {
        if (line[i + 1] === quoteChar) {
          result += char + char;
          i++;
        } else {
          inQuotes = false;
          quoteChar = '';
          result += char;
        }
      } else if (char === from && !inQuotes) {
        result += to;
      } else {
        result += char;
      }
    }

    return result;
  }

  private parseCsv(text: string): CsvData {
    const lines = text.split('\n').filter((line) => line.trim());

    if (lines.length === 0) {
      throw new Error('Empty CSV file');
    }

    const firstLine = lines[0];
    const semicolonCount = (firstLine.match(/;/g) || []).length;
    const commaCount = (firstLine.match(/,/g) || []).length;
    const delimiter = semicolonCount > commaCount ? ';' : ',';

    const headers = this.parseCsvLine(lines[0], delimiter);
    const rows = lines
      .slice(1)
      .map((line) => this.parseCsvLine(line, delimiter));

    return {
      headers: headers.map((h) => this.cleanHeaderName(h)),
      rows: rows.filter((row) => row.some((cell) => cell.trim())),
    };
  }

  private cleanHeaderName(header: string): string {
    return header
      .replace(/^["']|["']$/g, '')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '')
      .trim();
  }

  private parseCsvLine(line: string, delimiter: string = ','): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    let quoteChar = '';

    let cleanLine = line;

    for (let i = 0; i < cleanLine.length; i++) {
      const char = cleanLine[i];

      if ((char === '"' || char === "'") && !inQuotes) {
        inQuotes = true;
        quoteChar = char;
      } else if (char === quoteChar && inQuotes) {
        if (cleanLine[i + 1] === quoteChar) {
          current += quoteChar;
          i++;
        } else {
          inQuotes = false;
          quoteChar = '';
        }
      } else if (char === delimiter && !inQuotes) {
        result.push(this.cleanCellValue(current));
        current = '';
      } else {
        current += char;
      }
    }

    result.push(this.cleanCellValue(current));
    return result;
  }

  private normalizeRowsToHeaders(
    rows: string[][],
    expectedLength: number
  ): string[][] {
    return rows.map((row, rowIndex) => {
      const normalizedRow = [...row];

      while (normalizedRow.length < expectedLength) {
        const randomSuffix = Math.random()
          .toString(36)
          .substring(2, 6)
          .toUpperCase();
        normalizedRow.push(``);
      }

      if (normalizedRow.length > expectedLength) {
        normalizedRow.splice(expectedLength);
      }

      return normalizedRow;
    });
  }

  private cleanCellValue(value: string): string {
    return value
      .trim()
      .replace(/^["']|["']$/g, '')
      .replace(/""/g, '"')
      .replace(/''/g, "'");
  }

  clearFile(): void {
    this.selectedFile.set(null);
    this.csvData.set(null);
    this.error.set(null);

    const fileInput = document.getElementById(
      'csvFileInput'
    ) as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  }

  getFileSize(): string {
    const file = this.selectedFile();
    if (!file) return '';

    const bytes = file.size;
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  triggerFileInput(): void {
    const fileInput = document.getElementById(
      'csvFileInput'
    ) as HTMLInputElement;
    if (fileInput) {
      fileInput.click();
    }
  }
  onCloseTable(event: Event): void {
    event.stopPropagation();
    this.clearFile();
  }

  onImportClick() {
    if (!this.dataSource || this.dataSource().length === 0) {
      alert('Aucune donnée à envoyer.');
      return;
    }

    this.isLoading = true;

    try {
      this.importService
        .uploadCandidacies({
          rows: this.dataSource(),
          periodId: this.periodId,
          year: this.year
        })
        .subscribe({
          next: (response) => {
            this.snackbar.open("Candidatures uploadées avec succè", "Fermer", {duration:3000})
            this.closeModal();
          },
          error: (error) => {
            console.error("Erreur lors de l'envoi des données:", error);
            "Une erreur est survenue lors de l'envoi des données : " + error.message;
          },
        });
    } catch (error) {
      console.error(error);
      alert("Une erreur est survenue lors de l'envoi des données :");
    } finally {
      this.isLoading = false;
    }
  }
  closeModal() {
    this.dialogRef.close();
    this.modalService.notifyModalClosed();
  }
}
