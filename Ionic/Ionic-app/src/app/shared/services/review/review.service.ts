// src/app/shared/services/review/review.service.ts
import { Injectable } from '@angular/core';
import { from, Observable } from 'rxjs';
import { ApiNative } from 'src/app/core/services/http/api.native';
import {
  ReviewRegisterModel,
  ReviewSelectModel,
} from '../../models/product/product.model';

@Injectable({ providedIn: 'root' })
export class ReviewService {
  /** Base relativa, igual que Auth */
  private readonly base = '/Review';

  /** GET /Review/by-product/:id */
  getReviewByProduct(productId: number): Observable<ReviewSelectModel[]> {
    return from(
      ApiNative.get<ReviewSelectModel[]>(`${this.base}/by-product/${productId}`)
    );
  }

  /** POST /Review  (JSON) */
  createReview(data: ReviewRegisterModel): Observable<ReviewSelectModel> {
    return from(ApiNative.post<ReviewSelectModel>(`${this.base}`, data));
  }

  /** DELETE /Review/:id */
  deleteReview(reviewId: number): Observable<void> {
    return from(ApiNative.delete<void>(`${this.base}/${reviewId}`));
  }
}
