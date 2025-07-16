import {inject, Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {BASE_URL} from '../app.tokens';
import {ResponseInterface} from '../models/response.model';
import {LdapUser} from '../models/ldap-user.model';

@Injectable({
  providedIn: 'root'
})
export class UserService {

  http: HttpClient = inject(HttpClient)
  baseUrl = inject(BASE_URL)

  searchUserFromLdap(query: string) {
    return this.http.get<ResponseInterface<LdapUser[]>>(`${this.baseUrl}/users/ldap/${query}`)
  }

  hasAdminRole() {
    return this.http.get<{ hasAdminRole: boolean }>(`${this.baseUrl}/has-admin-role`)
  }

}
