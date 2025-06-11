import {inject, Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {BASE_URL} from '../app.tokens';
import {ResponseInterface} from '../models/response.model';
import {Evaluator} from '../models/evaluator.model';

@Injectable({
  providedIn: 'root'
})
export class EvaluatorService {
  http: HttpClient = inject(HttpClient)
  baseUrl = inject(BASE_URL)

  getEvaluators(periodId: number | null, page = 1, perPage = 10, type: string | null = null) {
    let uriParameters = `?page=${page}&perPage=${perPage}`;

    if (type != null)
      uriParameters = `${uriParameters}&type${type}`

    if (periodId != null)
      uriParameters = `${uriParameters}&periodId=${periodId}`

    return this.http.get<ResponseInterface<Evaluator[]>>(`${this.baseUrl}/evaluators/${uriParameters}`)
  }

  getEvaluator(id: string) {
    return this.http.get<ResponseInterface<Evaluator>>(`${this.baseUrl}/evaluators/${id}`)
  }

  addEvaluator(data: { periodId: number, cuid: string, type: string }) {
    return this.http.post(`${this.baseUrl}/evaluators`, data)
  }
}
