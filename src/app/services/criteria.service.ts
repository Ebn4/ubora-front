import { Injectable } from '@angular/core';
import { Criteria } from '../models/criteria';
import { Response } from '../models/response';

@Injectable({
  providedIn: 'root',
})
export class CriteriaService {
  private token = '5|AslMM4JvVrPtKrHweDoEn1Mn1h8YLkAvMSIXhyCx316cadda';
  currentPage: number = 1;
  lastPage: number = 1;

  constructor() {}

  async getCriteria(
    page: number = 1,
    search: string = '',
    per_page: number
  ): Promise<{ data: Criteria[]; current_page: number; last_page: number }> {
    const url = new URL('http://localhost:8000/api/criteria');
    url.searchParams.append('page', page.toString());
    if (search) url.searchParams.append('search', search);
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
    const criterias = rep.data.data;

    this.currentPage = currentPage;
    this.lastPage = lastPage;

    return {
      data: criterias,
      current_page: currentPage,
      last_page: lastPage,
    };
  }

  async getOneCriteria(id: number): Promise<Criteria | undefined> {
    const url = new URL('http://localhost:8000/api/criteria/' + id);
    let rep = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${this.token}`,
        Accept: 'application/json',
      },
    }).then((res) => res.json());
    const criteria = rep.data;
    return criteria;
  }

  async createCriteria(name: string, description: string): Promise<Response> {
    const url = new URL('http://localhost:8000/api/criteria');
    const rep = await await fetch(url.toString(), {
      method: 'POST',
      body: JSON.stringify({ name: name, description: description }),
      headers: {
        Authorization: `Bearer ${this.token}`,
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
    }).then((res) => res.json());
    return rep;
  }

  async updateCriteria(
    id: number,
    name: string,
    description: string
  ): Promise<Response> {
    const url = new URL('http://localhost:8000/api/criteria/' + id);
    const rep = await await fetch(url.toString(), {
      method: 'PUT',
      body: JSON.stringify({ name: name, description: description }),
      headers: {
        Authorization: `Bearer ${this.token}`,
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
    }).then((res) => res.json());
    return rep;
  }

  async deleteCriteria(id: number): Promise<Response> {
    const url = new URL('http://localhost:8000/api/criteria/' + id);
    const rep = await await fetch(url.toString(), {
      method: 'DELETE',
      body: JSON.stringify({ id: id }),
      headers: {
        Authorization: `Bearer ${this.token}`,
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
    }).then((res) => res.json());
    return rep;
  }

  async attachCriteriaToPeriod(
    periodId: number,
    criteriaIds: number[]
  ): Promise<any> {
    const response = await fetch(
      'http://localhost:8000/api/periods/attach-criteria/' + periodId,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.token}`,
        },
        body: JSON.stringify({ criteria_ids: criteriaIds }),
      }
    );

    const data = response.json();
    return data;
  }
}
