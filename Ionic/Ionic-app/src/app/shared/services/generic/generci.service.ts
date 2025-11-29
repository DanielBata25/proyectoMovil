// src/app/shared/services/generic.service.ts
import { from, Observable } from 'rxjs';
import { ApiNative } from 'src/app/core/services/http/api.native';

export class GenericService<TList, TCreate> {
  protected endpoint: string;

  /**
   * Usa endpoint relativo, ej: "/User", "/Order", "/Category"
   * ApiNative resuelve contra environment.apiUrl
   */
  constructor(endpointName: string) {
    this.endpoint = endpointName.startsWith('/')
      ? endpointName
      : `/${endpointName}`;
  }

  /** ----------------------------- CRUD básicos ----------------------------- */

  // GET /{endpoint}
  public getAll(): Observable<TList[]> {
    return from(ApiNative.get<TList[]>(`${this.endpoint}`));
  }

  // GET /{endpoint}/{id}
  public getById(id: number): Observable<TList> {
    return from(ApiNative.get<TList>(`${this.endpoint}/${id}`));
  }

  // POST /{endpoint}
  public create(item: TCreate): Observable<any> {
    return from(ApiNative.post<any>(`${this.endpoint}`, item));
  }

  // PUT /{endpoint}/{id}
  public update(id: number, item: TCreate): Observable<any> {
    return from(ApiNative.put<any>(`${this.endpoint}/${id}`, item));
  }

  // DELETE /{endpoint}/{id}
  public delete(id: number): Observable<any> {
    return from(ApiNative.delete<any>(`${this.endpoint}/${id}`));
  }

  // PATCH /{endpoint}/{id}
  public deleteLogic(id: number): Observable<any> {
    return from(ApiNative.patch<any>(`${this.endpoint}/${id}`, []));
  }
}
