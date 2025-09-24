import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../../../environments/environment';
import { Observable } from 'rxjs';
import { CityModel, DepartmentModel } from '../../models/location/location.model';

@Injectable({ providedIn: 'root' })
export class LocationService {
  private readonly http = inject(HttpClient);
  private readonly apiBase = environment.apiUrl.replace(/\/+$/, '');
  private readonly urlBase = `${this.apiBase}/location`;
  private readonly opts = { withCredentials: true } as const;

  getDepartment(): Observable<DepartmentModel[]> {
    return this.http.get<DepartmentModel[]>(`${this.urlBase}/Department`, this.opts);
  }

  getCity(id: number): Observable<CityModel[]> {
    return this.http.get<CityModel[]>(`${this.urlBase}/Department/City/${id}`, this.opts);
  }
}
