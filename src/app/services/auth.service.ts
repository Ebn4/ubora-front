import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { BASE_URL } from '../app.tokens';
import { ApiResponse, ResponseInterface } from '../models/response.model';
import { loginResponse, User, VerifyOtpResponse } from '../models/user.model';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthServices {

  http: HttpClient = inject(HttpClient)
  baseUrl = inject(BASE_URL)

  login(data: { cuid: string, password: string }) {
    return this.http.post<ApiResponse<loginResponse>>(`${this.baseUrl}/login`, data);
  }

  logout() {
    return this.http.post(`${this.baseUrl}/logout`, {})
  }

  verifyOtp(data: { cuid: string; otp: string }): Observable<VerifyOtpResponse> {
    return this.http.post<VerifyOtpResponse>(`${this.baseUrl}/verify-otp`, data);
  }

  resendOtp(cuid: string): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/resend-otp`, { cuid });
  }
}
