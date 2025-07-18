import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BASE_URL } from '../app.tokens';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class PreselectionService {

  http = inject(HttpClient);
  baseUrl = inject(BASE_URL);

  private candidacy: any;

  setCandidacy(data: any) {
    this.candidacy = data;
    sessionStorage.setItem('candidacy', JSON.stringify(data));
  }

  getCandidacy(): any {
    if (this.candidacy) {
      return this.candidacy;
    }

    const stored = sessionStorage.getItem('candidacy');
    if (stored) {
      this.candidacy = JSON.parse(stored);
      return this.candidacy;
    }

    return null;
  }

  canValidate(periodId: number) {
    return this.http.get<{ canValidate: boolean }>(
      `${this.baseUrl}/preselection/periods/${periodId}/validate`
    );
  }

  validatePreselection(periodId: number) {
    return this.http.post<{ message: string }>(
      `${this.baseUrl}/preselection/periods/${periodId}/validate`, {}
    );
  }

  preselectionCandidacy(data: Array<{
    period_criteria_id: number;
    dispatch_preselections_id: number,
    valeur: boolean
  }>) {
    return this.http.post(`${this.baseUrl}/preselection`, data);
  }

  getPreselectionsForDispatch(dispatchId: number): Observable<any> {
    return this.http.get(`${this.baseUrl}/getPreselectionsForDispatch/${dispatchId}`);
  }

  sendDispatchNotification(): Observable<any> {
    return this.http.post(`${this.baseUrl}/sendDispatchNotification`, {});
  }
}
