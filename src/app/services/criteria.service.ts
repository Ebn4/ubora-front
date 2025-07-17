import {inject, Injectable} from '@angular/core';
import {Criteria} from '../models/criteria';
import {Response} from '../models/response';
import {LocalStorageService} from './local-storage.service';
import {CriteriaPeriod} from '../models/criteria-period';
import {HttpClient, HttpParams} from '@angular/common/http';
import {BASE_URL} from '../app.tokens';
import {ResponseInterface} from '../models/response.model';
import {PeriodStatus} from '../enum/period-status.enum';

@Injectable({
  providedIn: 'root',
})
export class CriteriaService {
  http: HttpClient = inject(HttpClient);
  baseUrl = inject(BASE_URL);

  constructor() {
  }

  getCriteria(
    page: number = 1,
    search: string = '',
    type: string = '',
    per_page: number,
    periodId: number | undefined
  ) {
    let params = new HttpParams().set('page', page).set('per_page', per_page);

    if (search != null && search != '') params = params.set('search', search);

    if (type != null && type != '') {
      params = params.set('type', type);
    }

    if (periodId != null && periodId != 0)
      params = params.set('periodId', periodId);

    return this.http.get<ResponseInterface<Criteria[]>>(
      `${this.baseUrl}/criteria`,
      {params}
    );
  }

  getOneCriteria(id: number) {
    return this.http.get<Criteria>(
      `${this.baseUrl}/criteria/${id}`
    );
  }

  createCriteria(data: { name: string; description: string }) {
    return this.http.post(`${this.baseUrl}/criteria`, data);
  }

  updateCriteria(id: number, data: { description: string }) {
    return this.http.put(`${this.baseUrl}/criteria/${id}`, data);
  }

  deleteCriteria(id: number) {
    return this.http.delete(`${this.baseUrl}/criteria/${id}`);
  }

  attachCriteriaToPeriod(
    periodId: number,
    data: { criteria: { id: number; ponderation: number }[]; type: string }
  ) {
    return this.http.post(
      `${this.baseUrl}/periods/attach-criteria/${periodId}`,
      data
    );
  }

  getPeriodCriterias(
    periodId: number,
    search: string
  ) {
    let params = new HttpParams().set('period_id', periodId);
    if (search != null && search != '') params = params.set('search', search);

    return this.http.get<ResponseInterface<CriteriaPeriod[]>>(
      `${this.baseUrl}/period/join/criteria`,
      {params}
    );
  }

  loadCriteriasByPeriodId(periodId: number, status: string) {
    let params = new HttpParams().set('status', status);

    return this.http.get<ResponseInterface<Criteria[]>>(
      `${this.baseUrl}/periods/criteria/${periodId}`,
      {params}
    );
  }
}
