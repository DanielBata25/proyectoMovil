// src/app/core/http/api.native.ts
import { CapacitorHttp } from '@capacitor/core'; // o: import { Http as CapacitorHttp } from '@capacitor/http';
import { CapacitorCookies } from '@capacitor/core';
import { Preferences } from '@capacitor/preferences';
import { environment } from 'src/environments/environment';

const API = environment.apiUrl.replace(/\/+$/, '');
const API_ORIGIN = new URL(API + '/').origin;

const XSRF_PREF_KEY = 'XSRF';
const XSRF_COOKIE_KEY = 'XSRF-TOKEN';

async function getXsrf(): Promise<string | null> {
  const { value } = await Preferences.get({ key: XSRF_PREF_KEY });
  return value ?? null;
}

async function syncXsrfFromCookies(): Promise<void> {
  const res = await CapacitorCookies.getCookies({ url: API_ORIGIN });
  const cookiesMap = ((res as unknown as { cookies?: any }).cookies ??
    {}) as Record<string, string>;
  const xsrf = cookiesMap[XSRF_COOKIE_KEY];
  if (xsrf) await Preferences.set({ key: XSRF_PREF_KEY, value: xsrf });
}

type Method = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export class ApiNative {
  static async request<T>(
    method: Method,
    path: string,
    body?: any,
    extraHeaders: Record<string, string> = {},
    tryRefresh = true
  ): Promise<T> {
    const xsrf = await getXsrf();

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(xsrf ? { 'X-XSRF-TOKEN': xsrf } : {}),
      ...extraHeaders,
    };

    const url = path.startsWith('http') ? path : `${API}${path}`;
    // const resp = await CapacitorHttp.request({ method, url, data: body, headers });
    console.log('[API][REQ]', { method, url, headers, body });

    const resp = await CapacitorHttp.request({
      method,
      url,
      data: body,
      headers,
    });

    console.log('[API][RESP]', {
      url,
      status: resp.status,
      data: resp.data,
      headers: resp.headers,
    });

    await syncXsrfFromCookies();

    const status = resp.status ?? 200;
    if (status === 401 && tryRefresh) {
      await this.refresh();
      return await this.request<T>(method, path, body, extraHeaders, false);
    }
    if (status >= 400) {
      const err: any = new Error((resp.data as any)?.message ?? 'HTTP error');
      err.status = status;
      err.data = resp.data;
      throw err;
    }
    return resp.data as T;
  }

  static get<T>(path: string, headers?: Record<string, string>) {
    return this.request<T>('GET', path, undefined, headers);
  }
  static post<T>(path: string, body?: any, headers?: Record<string, string>) {
    return this.request<T>('POST', path, body, headers);
  }
  static put<T>(path: string, body?: any, headers?: Record<string, string>) {
    return this.request<T>('PUT', path, body, headers);
  }
  static patch<T>(path: string, body?: any, headers?: Record<string, string>) {
    return this.request<T>('PATCH', path, body, headers);
  }
  static delete<T>(path: string, headers?: Record<string, string>) {
    return this.request<T>('DELETE', path, undefined, headers);
  }

  static async refresh(): Promise<void> {
    const xsrf = await getXsrf();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(xsrf ? { 'X-XSRF-TOKEN': xsrf } : {}),
    };
    const resp = await CapacitorHttp.post({
      url: `${API}Auth/refresh`,
      data: {},
      headers,
    });
    await syncXsrfFromCookies();

    const status = resp.status ?? 200;
    if (status >= 400) {
      const err: any = new Error(
        (resp.data as any)?.message ?? 'Refresh failed'
      );
      err.status = status;
      err.data = resp.data;
      throw err;
    }
  }
}
