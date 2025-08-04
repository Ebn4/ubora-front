import {inject, Injectable} from '@angular/core';
import {CandidacyUpload} from '../models/candidacy-upload';
import {DocumentUpload} from '../models/document-upload';
import {HttpClient} from '@angular/common/http';
import {BASE_URL} from '../app.tokens';
import {Observable} from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ImportService {
  http: HttpClient = inject(HttpClient);
  baseUrl = inject(BASE_URL);

  constructor() {
  }

  private token = '5|AslMM4JvVrPtKrHweDoEn1Mn1h8YLkAvMSIXhyCx316cadda';
  private apiUrl = 'http://localhost:8000/api/uploadCandidaciesDocs';

  uploadCandidacies(data: { rows: any; periodId: number, year: number }) {
    return this.http.post(`${this.baseUrl}/uploadCandidacies`, data);
  }

  uploadDocument(file: File) {
    const formData = new FormData();
    formData.append('zip_file', file);
    return this.http.post<{ message: string }>(`${this.baseUrl}/upload-documents`, formData)
  }

  getDocument(docName: string): Observable<Blob> {
    const url = `http://localhost:8000/api/getDoc?docName=${encodeURIComponent(
      docName
    )}`;
    return this.http.get(url, {responseType: 'blob'});
  }
}
