import {inject, Injectable} from '@angular/core';
import {Candidacy} from '../models/candidacy';
import {CandidaciesDispatchEvaluator} from '../models/candidacies-dispatch-evaluator';
import {HttpClient, HttpParams} from '@angular/common/http';
import {BASE_URL} from '../app.tokens';
import {CandidateEvaluation} from '../models/candidate-evaluation';
import {ResponseInterface, ResponseInterfaceE} from '../models/response.model';
import {Interview} from '../models/interview';
import {User} from '../models/user.model';
import {UserService} from './user.service';
import {switchMap} from 'rxjs/operators';
import {Evaluator} from '../models/evaluator.model';
import {CandidacySelectionResult} from '../models/candidacy-selection-result';

@Injectable({
  providedIn: 'root',
})
export class CandidacyService {
  http: HttpClient = inject(HttpClient);
  baseUrl = inject(BASE_URL);
  user!: User
  userService: UserService = inject(UserService);
  evaluator_id!: number

  constructor() {
  }

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

    return this.http.get<ResponseInterfaceE<Candidacy[]>>(
      `${this.baseUrl}/candidacies`,
      {params}
    );
  }

  getCandidaciesRejected(
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

    return this.http.get<ResponseInterfaceE<Candidacy[]>>(
      `${this.baseUrl}/rejeted_candidacies`,
      {params}
    );
  }

  getOneCandidacy(candidacyId: number) {
    return this.userService.getUser().pipe(
      switchMap((user) => {
        const evaluatorId = user.id;
        let params = new HttpParams().set('evaluator_id', evaluatorId);
        if (evaluatorId != null && evaluatorId != null) {
          params = params.set('evaluator_id', evaluatorId);
        }

        return this.http.get<ResponseInterface<Candidacy>>(
          `${this.baseUrl}/candidacies/${candidacyId}`,
          {params}
        );
      })
    );
  }

  CandidaciesDispatchEvaluator(
    periodId: number,
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
    if (periodId != null) params = params.set('periodId', periodId);

    return this.http.get<ResponseInterface<CandidaciesDispatchEvaluator[]>>(
      `${this.baseUrl}/CandidaciesDispatchEvaluator`,
      {params}
    );
  }


  evaluateCandidate(data: { interviewId: number, periodId: number, evaluations: CandidateEvaluation[] }) {
    return this.http.post<{ errors: string | null, data: boolean }>(`${this.baseUrl}/candidate/selections`, data)
  }

  getCandidateInterview(candidateId: number) {
    return this.http.get<ResponseInterface<Interview>>(
      `${this.baseUrl}/candidates/${candidateId}/interviews`
    );
  }

  candidateHasSelected(candidateId: number) {
    return this.http.get<{ hasSelection: boolean }>(
      `${this.baseUrl}/candidates/${candidateId}/has-selection`
    );
  }

  getCandidateEvaluators(candidateId: number) {
    return this.http.get<ResponseInterface<Evaluator[]>>(
      `${this.baseUrl}/candidates/${candidateId}/evaluators`
    );
  }

  getPreselectedCandidates(page: number = 1, search: string = '', per_page: number, periodId: number | null = null) {
    let params = new HttpParams()
      .set('per_page', per_page)
      .set('page', page)

    if (search != '') {
      params = params.set('search', search)
    }

    if (periodId != null) {
      params = params.set('periodId', periodId)
    }

    return this.http.get<ResponseInterfaceE<Candidacy[]>>(
      `${this.baseUrl}/candidates/interviews`,
      {params}
    );
  }

  getSelectionCandidates(periodId: number, page: number = 1, search: string = '', per_page: number) {
    let params = new HttpParams()
      .set('per_page', per_page)
      .set('page', page)

    if (search != '') {
      params = params.set('search', search)
    }

    return this.http.get<ResponseInterfaceE<Candidacy[]>>(
      `${this.baseUrl}/periods/${periodId}/candidates/selection`,
      {params}
    );
  }

  getCandidateSelectionResultByCriteria(interviewId: number, criteriaId: number) {
    return this.http.get<ResponseInterface<CandidacySelectionResult>>(`${this.baseUrl}/candidates/${interviewId}/criterias/${criteriaId}/result`);
  }

  getAllSelectedStats(periodId: number) {
    let params = new HttpParams()
      .set('periodId', periodId);

    return this.http.get<any>(`${this.baseUrl}/candidacies/selection-stats`, { params });
  }
}
