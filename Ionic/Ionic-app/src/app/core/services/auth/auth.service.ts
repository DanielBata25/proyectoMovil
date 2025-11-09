// src/app/core/services/auth/auth.service.ts
import { Injectable } from '@angular/core';
import { from, map, Observable, switchMap } from 'rxjs';
import { RegisterUserModel } from '../../models/register.user.model';
import { LoginModel, UserMeDto } from '../../models/login.model';
import { PersonUpdateModel, UserSelectModel } from '../../models/user.model';
import {
  ChangePasswordModel,
  RecoverPasswordConfirmModel,
  RecoverPasswordModel
} from '../../models/changePassword.model';
import { Preferences } from '@capacitor/preferences';
import { CapacitorCookies, CapacitorHttp, HttpResponse } from '@capacitor/core';
import { environment } from 'src/environments/environment';
import { ApiNative } from '../http/api.native';
import { HttpErrorResponse } from '@angular/common/http';

const API_ORIGIN = new URL(environment.apiUrl.replace(/\/+$/, '') + '/').origin;

@Injectable({ providedIn: 'root' })
export class AuthService {
  private base = '/Auth/';
  private baseLogin = environment.apiUrl + 'Auth/login';


  Register(obj: RegisterUserModel) {
    return from(ApiNative.post<void>(`${this.base}Register`, obj));
  }

  // Login(obj: LoginModel) {
  //   return from(ApiNative.post<void>(`${this.base}Login`, obj)).pipe(map(() => void 0));
  // }
  private async buildHeaders(): Promise<Record<string, string>> {
    return {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };
  }

  Login(obj: LoginModel): Observable<any> {
    return from(
      this.buildHeaders().then(headers =>
        CapacitorHttp.post({
          url: this.baseLogin,
          data: obj,
          headers
        })
      )
    ).pipe(
      switchMap((response: HttpResponse) => {
        if (response.status >= 200 && response.status < 300) {
          return this.GetMe();
        } else {
          throw new HttpErrorResponse({
            status: response.status,
            statusText: 'Login failed', // ⚠️ CapacitorHttp no tiene `statusText`
            url: this.base + 'login',
            error: response.data || { message: 'Credenciales inválidas' }
          });
        }
      })
    );
  }

  ChangePassword(obj: ChangePasswordModel) {
    return from(ApiNative.put<void>(`${this.base}ChangePassword`, obj));
  }

  GetMe() {
    return from(ApiNative.get<UserMeDto>(`${this.base}me`));
  }

  GetDataBasic() {
    return from(ApiNative.get<UserSelectModel>(`${this.base}DataBasic`));
  }

  LogOut() {
    return from(ApiNative.post<void>(`${this.base}logout`, {})).pipe(
      // Limpieza local de XSRF (no HttpOnly)
      switchMap(async () => {
        await Preferences.remove({ key: 'XSRF' });
        await CapacitorCookies.deleteCookie({ key: 'XSRF-TOKEN', url: API_ORIGIN }).catch(() => {});
      }),
      map(() => void 0)
    );
  }

  RefreshToken() {
    // Mantén el patrón: refresh y luego /me
    return from(ApiNative.refresh()).pipe(
      switchMap(() => from(ApiNative.get<UserMeDto>(`${this.base}me`)))
    );
  }

  UpdatePerson(obj: PersonUpdateModel) {
    // En tu back es [HttpPut("updatePerson")] (minúsculas)
    return from(ApiNative.put<void>(`${this.base}updatePerson`, obj));
  }

  RequestRecoverPassword(obj: RecoverPasswordModel) {
    return from(ApiNative.post<void>(`${this.base}recover/send-code`, obj));
  }

  ConfirmRecoverPassword(obj: RecoverPasswordConfirmModel) {
    return from(ApiNative.post<void>(`${this.base}recover/confirm`, obj));
  }
}
