// src/app/core/http/api.native.ts
import { CapacitorCookies, CapacitorHttp } from '@capacitor/core'; // o: import { Http as CapacitorHttp } from '@capacitor/http';
import { Preferences } from '@capacitor/preferences';
import { environment } from 'src/environments/environment';

const hasWindow = typeof window !== 'undefined';
const isHttpOrigin = hasWindow && /^https?:/i.test(window.location?.protocol ?? '');
const useBrowserProxy = isHttpOrigin && !!environment.apiUrlBrowser;
const rawApi = useBrowserProxy ? environment.apiUrlBrowser : environment.apiUrl;

const API = (rawApi ?? '').replace(/\/+$/, '');
const API_IS_ABSOLUTE = /^https?:\/\//i.test(API);
const API_ABSOLUTE = (() => {
  if (API_IS_ABSOLUTE) return API;
  if (hasWindow && window.location) {
    const prefix = API.startsWith('/') ? '' : '/';
    return `${window.location.origin}${prefix}${API}`;
  }
  return API;
})();
const API_BASE = API_ABSOLUTE.replace(/\/+$/, '');

const API_ORIGIN = (() => {
  if (API_IS_ABSOLUTE) return new URL(`${API}/`).origin;
  if (hasWindow && window.location) return window.location.origin;
  try {
    return new URL(`${API_ABSOLUTE}/`).origin;
  } catch {
    return '';
  }
})();

const XSRF_PREF_KEY = 'XSRF';
const XSRF_COOKIE_KEY = 'XSRF-TOKEN';

async function getXsrf(): Promise<string | null> {
  const { value } = await Preferences.get({ key: XSRF_PREF_KEY });
  return value ?? null;
}

async function syncXsrfFromCookies(): Promise<void> {
  if (!API_ORIGIN) return;
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

    const isFormData =
      typeof FormData !== 'undefined' && body instanceof FormData;
    console.log('[API][FormData check]', { isFormData, body });
    if (isFormData) {
      delete headers['Content-Type'];
    }

    const url = path.startsWith('http')
      ? path
      : `${API_BASE}${path.startsWith('/') ? '' : '/'}${path}`;
    // const resp = await CapacitorHttp.request({ method, url, data: body, headers });
    console.log('[API][REQ]', { method, url, headers, body });

    const resp = isFormData
      ? await this.requestWithFetch(method, url, body, headers)
      : await CapacitorHttp.request({
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

  private static async requestWithFetch(
    method: Method,
    url: string,
    body: FormData,
    headers: Record<string, string>
  ): Promise<{ data: any; status: number; headers: Record<string, string>; url: string }> {
    // Permitir que fetch genere el boundary automáticamente
    const fetchHeaders = { ...headers };
    delete fetchHeaders['Content-Length'];
    delete fetchHeaders['content-length'];
    delete fetchHeaders['content-type'];
    const response = await fetch(url, {
      method,
      body,
      headers: fetchHeaders,
      credentials: 'include',
    });

    const resultHeaders: Record<string, string> = {};
    response.headers.forEach((value, key) => {
      resultHeaders[key] = value;
    });

    const contentType = response.headers.get('content-type') ?? '';
    let data: any = null;
    try {
      if (contentType.includes('application/json')) data = await response.json();
      else if (contentType.includes('text/')) data = await response.text();
      else if (contentType.includes('application/octet-stream')) data = await response.arrayBuffer();
      else data = await response.text();
    } catch {
      data = null;
    }

    return {
      data,
      status: response.status,
      headers: resultHeaders,
      url: response.url,
    };
  }

  static async refresh(): Promise<void> {
    const xsrf = await getXsrf();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(xsrf ? { 'X-XSRF-TOKEN': xsrf } : {}),
    };
    const refreshUrl = `${API_BASE}/Auth/refresh`;
    const resp = await CapacitorHttp.post({
      url: refreshUrl,
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
