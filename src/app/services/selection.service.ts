import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BASE_URL } from '../app.tokens';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SelectionService {

  private http = inject(HttpClient);
  private baseUrl = inject(BASE_URL);

  // 🔹 1. Contexte de navigation (comme dans PreselectionService)
  private _candidate = new BehaviorSubject<any>(null);
  candidate$ = this._candidate.asObservable();

  setCandidate(data: any): void {
    this._candidate.next(data);
  }

  getCandidate(): any {
    return this._candidate.value;
  }

  candidateSelections(interviewId: number, periodId: number, evaluations: { key: number; value: number }[]) {
    return this.http.post(`${this.baseUrl}/candidate/selections`, {
      interviewId,
      periodId,
      evaluations
    });
  }

}

