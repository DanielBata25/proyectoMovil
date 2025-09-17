// src/app/shared/services/review/review.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import {
  ReviewRegisterModel,
  ReviewSelectModel,
} from '../../models/product/product.model';

@Injectable({ providedIn: 'root' })
export class ReviewService {
  private http = inject(HttpClient);

  // si environment.apiUrl ya termina en '/api/v1/', esto queda: .../api/v1/Review
  // (asegúrate de que NO tenga doble slash al final)
  private baseUrl = `${environment.apiUrl}Review`;

  /** GET /api/v1/Review/by-product/:id */
  getReviewByProduct(productId: number): Observable<ReviewSelectModel[]> {
    return this.http.get<ReviewSelectModel[]>(
      `${this.baseUrl}/by-product/${productId}`
    );
  }

  /** POST /api/v1/Review  (SIN /create) */
  createReview(data: ReviewRegisterModel): Observable<ReviewSelectModel> {
    return this.http.post<ReviewSelectModel>(this.baseUrl, data);
  }

  /** DELETE /api/v1/Review/:id */
  deleteReview(reviewId: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${reviewId}`);
  }
}
