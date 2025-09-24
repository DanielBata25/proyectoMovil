// src/app/shared/services/location/location.service.ts
import { Injectable } from '@angular/core';
import { from, Observable } from 'rxjs';
import { ApiNative } from 'src/app/core/services/http/api.native';
import { CityModel, DepartmentModel } from '../../models/location/location.model';

@Injectable({ providedIn: 'root' })
export class LocationService {
  /** Base relativa (ApiNative resuelve contra environment.apiUrl) */
  private readonly base = '/location';

  /** -------------------------- Departamentos -------------------------- */
  // GET /location/Department
  getDepartment(): Observable<DepartmentModel[]> {
    return from(ApiNative.get<DepartmentModel[]>(`${this.base}/Department`));
  }

  /** ----------------------------- Ciudades ----------------------------- */
  // GET /location/Department/City/{id}
  getCity(id: number): Observable<CityModel[]> {
    if (!Number.isFinite(id) || id <= 0) throw new Error('ID de departamento inválido');
    return from(ApiNative.get<CityModel[]>(`${this.base}/Department/City/${id}`));
  }
}
