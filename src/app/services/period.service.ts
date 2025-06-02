import { HttpClient, HttpHeaders } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Period } from '../models/period';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class PeriodService {
  private token = '5|AslMM4JvVrPtKrHweDoEn1Mn1h8YLkAvMSIXhyCx316cadda';
  currentPage: number = 1;
  lastPage: number = 1;

  constructor() {}

  async createPeriod(year:number): Promise<Response> {
    const url = new URL('http://localhost:8000/api/period/');
    const rep = await await fetch(url.toString(), {
      method: "POST",
      body: JSON.stringify({ year: year }),
      headers: {
        'Authorization': `Bearer ${this.token}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    }).then(res=>res.json());
    return rep;
  }

  async getOnePeriod(id:number):Promise<Period | undefined>{
    const url = new URL('http://localhost:8000/api/period/'+id);
    let rep = await fetch(url.toString(), {
      method: "GET",
      headers: {
        'Authorization': `Bearer ${this.token}`,
        'Accept': 'application/json'
      }
    }).then(res=>res.json())
    const period = rep.data
    return period
  }

  async getPeriod(page: number = 1, search: string = '', status: string = '', per_page: number): Promise<{ data: Period[], current_page: number, last_page: number }> {
    const url = new URL('http://localhost:8000/api/period');
    url.searchParams.append('page', page.toString());
    if (search) url.searchParams.append('search', search);
    if (status) url.searchParams.append('status', status);
    if (per_page) url.searchParams.append('per_page', per_page.toString());

    const response = await fetch(url.toString(), {
      method: "GET",
      headers: {
        'Authorization': `Bearer ${this.token}`,
        'Accept': 'application/json'
      }
    });

    const rep = await response.json();

    const currentPage = rep.data.current_page;
    const lastPage = rep.data.last_page;
    const periods = rep.data.data;

    this.currentPage = currentPage;
    this.lastPage = lastPage;

    return {
      data: periods,
      current_page: currentPage,
      last_page: lastPage
    };
  }
}
