import {HttpClient, HttpHeaders, HttpParams} from '@angular/common/http';
import {inject, Injectable} from '@angular/core';
import {Period} from '../models/period';
import {Observable} from 'rxjs';
import {BASE_URL} from '../app.tokens';
import {map} from 'rxjs/operators';
import {LocalStorageService} from './local-storage.service';
import {ResponseInterface, ResponseInterfaceE} from '../models/response.model';

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

  getYearsPeriod(){
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
}
