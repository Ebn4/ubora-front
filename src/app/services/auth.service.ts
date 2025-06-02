import {HttpClient} from '@angular/common/http';
import {inject, Injectable} from '@angular/core';
import {BASE_URL} from '../app.tokens';
import {ResponseInterface} from '../models/response.model';
import {User} from '../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class AuthServices {

  http: HttpClient = inject(HttpClient)
  baseUrl = inject(BASE_URL)

  async login(data: { cuid: string, password: string }) {
    return this.http.post<ResponseInterface<User>>(`${this.baseUrl}/login`, data)
  }

  async logout() {
    return this.http.post(`${this.baseUrl}/logout`, {})
  }

}
