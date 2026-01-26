import {inject, Injectable} from '@angular/core';
import {HttpClient, HttpParams} from '@angular/common/http';
import {BASE_URL} from '../app.tokens';
import {ResponseInterface, ResponseInterfaceE} from '../models/response.model';
import {LdapUser} from '../models/ldap-user.model';
import {User} from '../models/user.model';
import { map } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class UserService {

  http: HttpClient = inject(HttpClient)
  baseUrl = inject(BASE_URL)

  getUsers(page = 1, perPage = 10, search: string | null, role: string | null = null) {

    let params = new HttpParams()
      .set('page', page)
      .set('perPage', perPage)

    if (search != null && search != '')
      params = params.set('search', search)

    if (role != null && role != '')
      params = params.set('role', role)

    return this.http.get<ResponseInterfaceE<User[]>>(`${this.baseUrl}/users`, {params})
  }

  deleteUser(userId: number) {
    return this.http.delete(`${this.baseUrl}/users/${userId}`)
  }

  searchUserFromLdap(query: string) {
    return this.http.get<ResponseInterface<LdapUser[]>>(`${this.baseUrl}/users/ldap/${query}`)
  }

  hasAdminRole() {
    return this.http.get<{ hasAdminRole: boolean }>(`${this.baseUrl}/has-admin-role`)
  }

  getUser() {
    return this.http.get<{data : User}>(`${this.baseUrl}/user`).pipe(
      map(response => response.data)
    )
  }

}
