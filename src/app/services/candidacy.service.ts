import { inject, Injectable } from '@angular/core';
import { Candidacy, CandidacyResponse } from '../models/candidacy';
import { Response } from '../models/response';
import { LocalStorageService } from './local-storage.service';
import { CandidaciesDispatchEvaluator } from '../models/candidacies-dispatch-evaluator';
import { HttpClient, HttpParams } from '@angular/common/http';
import { BASE_URL } from '../app.tokens';
import { ResponseInterface } from '../models/response.model';

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
      { params }
    );
  }

  getOneCandidacy(userProfile: string, candidacyId: number) {
    let params = new HttpParams()
      .set('userProfile', userProfile)
      .set('candidacyId', candidacyId);

    return this.http.get<ResponseInterface<CandidacyResponse>>(
      `${this.baseUrl}/getCandidacy`,
      { params }
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
      { params }
    );
  }

  // async getOneCandidacy(
  //   userProfile: string,
  //   candidacyId: number
  // ): Promise<CandidacyResponse> {
  //   const baseUrl = 'http://localhost:8000/api/getCandidacy';
  //   const queryParams = new URLSearchParams({
  //     userProfile: userProfile,
  //     candidacyId: candidacyId.toString(),
  //   });

  //   const url = `${baseUrl}?${queryParams.toString()}`;

  //   const response = await fetch(url, {
  //     method: 'GET',
  //     headers: {
  //       Authorization: `Bearer ${this.token}`,
  //       Accept: 'application/json',
  //     },
  //   });

  //   const result: CandidacyResponse = await response.json();
  //   return result;
  // }
}
