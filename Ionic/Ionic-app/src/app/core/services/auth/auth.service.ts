import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable, switchMap } from 'rxjs';
import { environment } from 'src/environments/environment';

import { RegisterUserModel } from '../../models/register.user.model';
import { LoginModel, UserMeDto } from '../../models/login.model';
import { PersonUpdateModel, UserSelectModel } from '../../models/user.model';
import {
  ChangePasswordModel,
  RecoverPasswordConfirmModel,
  RecoverPasswordModel
} from '../../models/changePassword.model';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private http = inject(HttpClient);
  private urlBase = environment.apiUrl + 'Auth/';

  constructor() {}

  Register(Objeto: RegisterUserModel): Observable<any> {
    return this.http.post<any>(this.urlBase + 'Register', Objeto);
  }

  /** Login: importante withCredentials para que guarde la cookie */
  Login(Objeto: LoginModel): Observable<any> {
    return this.http.post<any>(this.urlBase + 'login', Objeto, {
      withCredentials: true,
    });
  }

  ChangePassword(Objeto: ChangePasswordModel): Observable<any> {
    return this.http.put<any>(this.urlBase + 'ChangePassword', Objeto, {
      withCredentials: true,
    });
  }

  /** Auth/me requiere credenciales */
  GetMe(): Observable<UserMeDto> {
    return this.http.get<UserMeDto>(this.urlBase + 'me', {
      withCredentials: true,
    });
  }

  GetDataBasic(): Observable<UserSelectModel> {
    return this.http.get<UserSelectModel>(this.urlBase + 'DataBasic');
  }

  /** logout también necesita credenciales */
  LogOut(): Observable<any> {
    return this.http.post<any>(this.urlBase + 'logout', [], {
      withCredentials: true,
    });
  }

  RefreshToken(): Observable<UserMeDto> {
    return this.http
      .post<any>(this.urlBase + 'refresh', {}, { withCredentials: true })
      .pipe(switchMap(() => this.GetMe()));
  }

  UpdatePerson(objeto: PersonUpdateModel): Observable<any> {
    return this.http.put<any>(this.urlBase + 'UpdatePerson', objeto, {
      withCredentials: true,
    });
  }

  RequestRecoverPassword(objeto: RecoverPasswordModel): Observable<any> {
    return this.http.post<any>(
      this.urlBase + 'recover/send-code',
      objeto,
      { withCredentials: true }
    );
  }

  ConfirmRecoverPassword(objeto: RecoverPasswordConfirmModel): Observable<any> {
    return this.http.post<any>(
      this.urlBase + 'recover/confirm',
      objeto,
      { withCredentials: true }
    );
  }
}
