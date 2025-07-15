import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { BASE_URL } from '../app.tokens';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class PreselectionService {

  constructor() { }

  http: HttpClient = inject(HttpClient);
  baseUrl = inject(BASE_URL);

  preselectionCandidacy(data: Array<{ period_criteria_id: number; dispatch_preselections_id: number, valeur: boolean }>) {
    return this.http.post(`${this.baseUrl}/preselection`, data);
  }

  getPreselectionsForDispatch(dispatchId: number): Observable<any> {
    return this.http.get(`${this.baseUrl}/getPreselectionsForDispatch/${dispatchId}`);
  }

}
