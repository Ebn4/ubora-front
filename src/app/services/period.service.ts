import {HttpClient, HttpHeaders, HttpParams} from '@angular/common/http';
import {inject, Injectable} from '@angular/core';
import {Period} from '../models/period';
import {Observable} from 'rxjs';
import {BASE_URL} from '../app.tokens';
import {map} from 'rxjs/operators';
import {LocalStorageService} from './local-storage.service';
import {ResponseInterface, ResponseInterfaceE} from '../models/response.model';
import { PeriodStateResponse } from '../models/period-state';

@Injectable({
  providedIn: 'root',
})
export class PeriodService {
  localStorageService = inject(LocalStorageService);
  private token = this.localStorageService.getData('token');
  currentPage: number = 1;
  lastPage: number = 1;

  http = inject(HttpClient);
  baseUrl = inject(BASE_URL);

  constructor() {
  }

  createPeriod(data: { year: number }) {
    return this.http.post(`${this.baseUrl}/period`, data);
  }


  getOnePeriod(id: number) {
    return this.http.get<{ data: Period }>(`${this.baseUrl}/period/${id}`).pipe(
      map(response => response.data)
    );
  }

  getPeriod(
    page: number = 1,
    search: string = '',
    status: string = '',
    per_page: number
  ) {
    let params = new HttpParams().set('page', page).set('per_page', per_page);

    if (search != null && search != '') params = params.set('search', search);

    if (status != null && status != '') {
      params = params.set('status', status);
    }

    return this.http.get<ResponseInterfaceE<Period[]>>(
      `${this.baseUrl}/period`,
      {params}
    );
  }

  getYearsPeriod() {
    return this.http.get<Period[]>(
      `${this.baseUrl}/getYearsPeriod`
    );
  }

  changePeriodStatus(id: number, data: { status: string }) {
    return this.http.put(`${this.baseUrl}/periods/${id}/status`, data);
  }

  periodHasEvaluators(id: number) {
    return this.http.get<{
      hasEvaluators: boolean
    }>(`${this.baseUrl}/periods/${id}/has-evaluators`);
  }

  getSelectionCriteriaMaxScore(periodId: number): Observable<number> {
    return this.http.get<any>(
      `${this.baseUrl}/periods/${periodId}/selection-criteria-max-score`
    ).pipe(
      map((response: any) => {
        // Vérifier la structure de la réponse
        if (response.success && response.data && response.data.max_score !== undefined) {
          return response.data.max_score;
        }
        return 100; // Valeur par défaut si problème
      })
    );
  }


  getPeriodState(
    periodId: number | null,
    page: number = 1,
    perPage: number = 10,
    search: string = '',
    type: string = ''
  ): Observable<PeriodStateResponse> {
    if (!periodId) {
      throw new Error('Period ID is required');
    }

    let params = new HttpParams()
      .set('page', page.toString())
      .set('perPage', perPage.toString());

    if (search && search.trim()) {
      params = params.set('search', search.trim());
    }

    if (type && type.trim()) {
      params = params.set('type', type.trim());
    }

    return this.http.get<PeriodStateResponse>(
      `${this.baseUrl}/periods/${periodId}/state`,
      { params }
    );
  }
}
