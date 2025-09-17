// src/app/core/http/auth.interceptor.ts
import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, switchMap, throwError } from 'rxjs';

import { AuthState } from '../../services/auth/auth.state';
import { AuthService } from '../../services/auth/auth.service';
import { environment } from 'src/environments/environment';

/** Lee un cookie por nombre (útil para CSRF/XSRF si tu backend lo usa) */
function getCookie(name: string): string | null {
  const m = document.cookie.match(new RegExp('(?:^|; )' + name + '=([^;]*)'));
  return m ? decodeURIComponent(m[1]) : null;
}

/** Intenta obtener el access token desde tu store o storage */
function getTokenFallback(userStore?: AuthState): string | null {
  // Si tu AuthState expone una propiedad token/accessToken, úsala aquí
  const fromStore =
    (userStore as any)?.token ??
    (userStore as any)?.accessToken ??
    null;

  return (
    fromStore ||
    localStorage.getItem('token') ||
    localStorage.getItem('access_token') ||
    sessionStorage.getItem('token') ||
    sessionStorage.getItem('access_token')
  );
}

/** Interceptor principal funcional */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const userStore   = inject(AuthState);
  const router      = inject(Router);

  const isApiRequest = req.url.startsWith(environment.apiUrl);
  const isRefreshEndpoint = /\/auth\/refresh$/i.test(req.url);

  // Solo tocamos requests que van a TU API
  if (isApiRequest) {
    const csrfCookie = getCookie('XSRF-TOKEN');
    const token      = getTokenFallback(userStore);

    const setHeaders: Record<string, string> = {};
    if (csrfCookie) setHeaders['X-XSRF-TOKEN']  = csrfCookie;
    if (token)      setHeaders['Authorization'] = `Bearer ${token}`;

    req = req.clone({
      withCredentials: true, // si usas cookies para CSRF/refresh
      setHeaders
    });
  }

  return next(req).pipe(
    catchError((error) => {
      // Ante 401 (y que NO sea el endpoint de refresh), intentamos refrescar
      if (
        error instanceof HttpErrorResponse &&
        error.status === 401 &&
        isApiRequest &&
        !isRefreshEndpoint
      ) {
        return authService.RefreshToken().pipe(
          switchMap(() => {
            // Reintentamos la request con el token nuevo
            const newToken = getTokenFallback(userStore);
            const hdrs: Record<string, string> = {};
            if (newToken) hdrs['Authorization'] = `Bearer ${newToken}`;

            const retried = newToken ? req.clone({ setHeaders: hdrs }) : req;
            return next(retried);
          }),
          catchError((refreshError) => {
            // Si el refresh falla, limpiamos sesión y redirigimos a login
            try { userStore.clear?.(); } catch {}
            router.navigate(['/auth/login']);
            return throwError(() => refreshError);
          })
        );
      }

      // Otros errores siguen su curso
      return throwError(() => error);
    })
  );
};
