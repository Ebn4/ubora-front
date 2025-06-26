import { inject, Injectable } from '@angular/core';
import { Candidacy } from '../models/candidacy';
import { CandidaciesDispatchEvaluator } from '../models/candidacies-dispatch-evaluator';
import { HttpClient, HttpParams } from '@angular/common/http';
import { BASE_URL } from '../app.tokens';
import { ResponseInterface } from '../models/response.model';
import {CandidateEvaluation} from '../models/candidate-evaluation';

@Injectable({
  providedIn: 'root',
})
export class CandidacyService {
  http: HttpClient = inject(HttpClient);
  baseUrl = inject(BASE_URL);

  constructor() {}
  getCandidacies(
    page: number = 1,
    search: string = '',
    ville: string = '',
    periodId: number | undefined,
    per_page: number
  ) {
    let params = new HttpParams().set('page', page).set('per_page', per_page);

    if (search != null && search != '') params = params.set('search', search);

    if (ville != null && ville != '') {
      params = params.set('ville', ville);
    }

    if (periodId != null) params = params.set('periodId', periodId);

    return this.http.get<ResponseInterface<Candidacy[]>>(
      `${this.baseUrl}/candidacies`,
      {params}
    );
  }

  getOneCandidacy(userProfile: string, candidacyId: number) {
    let params = new HttpParams()
      .set('userProfile', userProfile)
      .set('candidacyId', candidacyId);

    return this.http.get<ResponseInterface<Candidacy>>(
      `${this.baseUrl}/getCandidacy`,
      {params}
    );
  }

  CandidaciesDispatchEvaluator(
    page: number = 1,
    search: string = '',
    ville: string = '',
    evaluateurId: number | undefined,
    per_page: number
  ) {
    let params = new HttpParams().set('page', page).set('per_page', per_page);

    if (search != null && search != '') params = params.set('search', search);

    if (ville != null && ville != '') {
      params = params.set('ville', ville);
    }

    if (evaluateurId != null) params = params.set('evaluateurId', evaluateurId);

    return this.http.get<ResponseInterface<CandidaciesDispatchEvaluator[]>>(
      `${this.baseUrl}/CandidaciesDispatchEvaluator`,
      {params}
    );
  }


  evaluateCandidate(data: { interviewId: number, periodId: number, evaluations: CandidateEvaluation[] }) {
    return this.http.post<{ errors: string | null, data: boolean }>(`${this.baseUrl}/candidate/selections`, data)
  }
}
