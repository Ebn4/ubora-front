import {inject, Injectable} from '@angular/core';
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

  uploadCandidacies(data: { rows: any; id: number, year: number }) {
    return this.http.post(`${this.baseUrl}/uploadCandidacies`, data);
  }

  uploadDocument(file: File) {
    const formData = new FormData();
    formData.append('zip_file', file);
    return this.http.post<{ message: string }>(`${this.baseUrl}/upload-documents`, formData)
  }

  getDocument(docName: string): Observable<Blob> {
    const url = `${this.baseUrl}/getDoc?docName=${encodeURIComponent(
      docName
    )}`;
    return this.http.get(url, {responseType: 'blob'});
  }
}
