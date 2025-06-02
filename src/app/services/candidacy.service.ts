import { Injectable } from '@angular/core';
import { Candidacy } from '../models/candidacy';
import { Response } from '../models/response';

@Injectable({
  providedIn: 'root',
})
export class CandidacyService {
  private token = '5|AslMM4JvVrPtKrHweDoEn1Mn1h8YLkAvMSIXhyCx316cadda';
  currentPage: number = 1;
  lastPage: number = 1;

  constructor() {}

  async getCandidacies(
    page: number = 1,
    search: string = '',
    ville: string = '',
    periodId: number = 1,
    per_page: number
  ): Promise<{ data: Candidacy[]; current_page: number; last_page: number }> {
    const url = new URL('http://localhost:8000/api/candidacies');
    url.searchParams.append('page', page.toString());
    url.searchParams.append('ville', ville.toString());
    url.searchParams.append('periodId', periodId.toString());
    url.searchParams.append('per_page', per_page.toString());
    if (search) url.searchParams.append('search', search);
    if (search) url.searchParams.append('ville', ville);
    if (periodId) url.searchParams.append('periodId', periodId.toString());
    if (per_page) url.searchParams.append('per_page', per_page.toString());

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${this.token}`,
        Accept: 'application/json',
      },
    });

    const rep = await response.json();

    const currentPage = rep.data.current_page;
    const lastPage = rep.data.last_page;
    const candidacies = rep.data.data;

    this.currentPage = currentPage;
    this.lastPage = lastPage;

    return {
      data: candidacies,
      current_page: currentPage,
      last_page: lastPage,
    };
  }
}
