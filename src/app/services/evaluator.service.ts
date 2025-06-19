import {inject, Injectable} from '@angular/core';
import {HttpClient, HttpParams} from '@angular/common/http';
import {BASE_URL} from '../app.tokens';
import {ResponseInterface} from '../models/response.model';
import {Evaluator} from '../models/evaluator.model';

@Injectable({
  providedIn: 'root'
})
export class EvaluatorService {
  http: HttpClient = inject(HttpClient)
  baseUrl = inject(BASE_URL)

  getEvaluators(periodId: number | null, page = 1, perPage = 10, search: string | null, type: string | null = null) {
    let uriParameters = `?page=${page}&perPage=${perPage}`;

    let params = new HttpParams()
      .set('page', page)
      .set('perPage', perPage)

    if (search != null && search != '')
      params = params.set('search', search)

    if (type != null && type != '')
      params = params.set('type', type)

    if (periodId != null)
      params = params.set('periodId', periodId)

    return this.http.get<ResponseInterface<Evaluator[]>>(`${this.baseUrl}/evaluators`, {params})
  }

  getEvaluator(id: string) {
    return this.http.get<ResponseInterface<Evaluator>>(`${this.baseUrl}/evaluators/${id}`)
  }

  addEvaluator(data: { periodId: number, cuid: string, type: string }) {
    return this.http.post(`${this.baseUrl}/evaluators`, data)
  }

  dispatchEvaluators(periodId: string) {
    return this.http.post(`${this.baseUrl}/evaluators/${periodId}/dispatch`, {
      periodId: periodId
    })
  }

  hasEvaluatorBeenDispatched(periodId: string) {
    return this.http.get<{isDispatch: boolean}>(`${this.baseUrl}/evaluators/${periodId}/is-dispatched`)
  }
}
