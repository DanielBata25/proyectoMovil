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
  /** Base relativa */
  private readonly base = '/Review';

  /** GET /Review/by-product/:id */
  getReviewByProduct(productId: number): Observable<ReviewSelectModel[]> {
    return from(
      ApiNative.get<ReviewSelectModel[]>(`${this.base}/by-product/${productId}`)
    );
  }

  /** POST /Review/create (JSON) */
  createReview(data: ReviewRegisterModel): Observable<ReviewSelectModel> {
    const comment = (data.comment ?? '').trim();
    const rating = Math.max(1, Math.min(5, Math.round(Number(data.rating ?? 0))));
    const payload = {
      ProductId: data.productId,
      Rating: rating,
      Comment: comment,
    } as const;

    console.log('[ReviewService][createReview] Payload enviado:', payload);

    return from(ApiNative.post<ReviewSelectModel>(`${this.base}/create`, payload));
  }

  /** DELETE /Review/:id */
  deleteReview(reviewId: number): Observable<void> {
    return from(ApiNative.delete<void>(`${this.base}/${reviewId}`));
  }
}
