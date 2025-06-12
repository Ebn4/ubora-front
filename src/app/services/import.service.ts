import { Injectable } from '@angular/core';
import { CandidacyUpload } from '../models/candidacy-upload';
import { DocumentUpload } from '../models/document-upload';

@Injectable({
  providedIn: 'root',
})
export class ImportService {
  constructor() {}
  private token = '5|AslMM4JvVrPtKrHweDoEn1Mn1h8YLkAvMSIXhyCx316cadda';

  async uploadCandidacies(file: File, year: string): Promise<CandidacyUpload> {
    const formData = new FormData();
    formData.append('fichier', file);
    formData.append('year', Number(year).toString());

    const response = await fetch(
      'http://localhost:8000/api/uploadCandidacies',
      {
        method: 'POST',
        body: formData,
        headers: {
          Authorization: `Bearer ${this.token}`,
        },
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Erreur API: ${response.status} - ${errorText}`);
    }

    return await response.json();
  }

  private apiUrl = 'http://localhost:8000/api/uploadCandidaciesDocs';

  async uploadDocument(file: File): Promise<DocumentUpload> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('docName', file.name);

    const response = await fetch(this.apiUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.token}`,
        Accept: 'application/json',
      },
      body: formData,
    });

    const data = await response.json();
    return data as DocumentUpload;
  }
}
