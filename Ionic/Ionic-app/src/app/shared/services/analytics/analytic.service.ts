// src/app/shared/services/analytics/analytic.service.ts
import { Injectable } from '@angular/core';
import { from, Observable } from 'rxjs';
import { ApiNative } from 'src/app/core/services/http/api.native';
import { TopProductsResponse } from '../../models/analytics/analytic.model';

@Injectable({
  providedIn: 'root'
})
export class AnalyticService {
  private readonly base = '/Analytics';

  /** GET /Analytics/top-products?limit={n} */
  getTopProducts(limit = 5): Observable<TopProductsResponse> {
    const query = `?limit=${limit}`;
    return from(
      ApiNative.get<TopProductsResponse>(`${this.base}/top-products${query}`)
    );
  }
}
