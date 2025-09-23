// src/app/shared/services/review/review.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Capacitor } from '@capacitor/core';
import { from, Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import {
  ReviewRegisterModel,
  ReviewSelectModel,
} from '../../models/product/product.model';
import { ApiNative } from 'src/app/core/services/http/api.native';

@Injectable({ providedIn: 'root' })
export class ReviewService {
  private http = inject(HttpClient);

  /**
   * Base normalizada:
   * - Soporta '/api/v1' (proxy) o 'http(s)://host/api/v1'
   * - Sin barras al final para evitar '//'
   */
  private static readonly API = environment.apiUrl.replace(/\/+$/, '');
  private readonly baseUrl = `${ReviewService.API}/Review`;

  // Web: enviar cookies / XSRF si aplica
  private readonly webOpts = { withCredentials: true };

  // ¿Estamos en plataforma nativa (Capacitor)?
  private readonly isNative = Capacitor.isNativePlatform();

  // ---------------------- Helpers de transporte (opción C) ----------------------
  private get$<T>(url: string): Observable<T> {
    return this.isNative
      ? from(ApiNative.get<T>(url))
      : this.http.get<T>(url, this.webOpts);
  }

  private post$<T>(url: string, body: any): Observable<T> {
    return this.isNative
      ? from(ApiNative.post<T>(url, body))
      : this.http.post<T>(url, body, this.webOpts);
  }

  private delete$<T>(url: string): Observable<T> {
    return this.isNative
      ? from(ApiNative.delete<T>(url))
      : this.http.delete<T>(url, this.webOpts);
  }

  // -------------------------------- Endpoints ----------------------------------

  /** GET /api/v1/Review/by-product/:id */
  getReviewByProduct(productId: number): Observable<ReviewSelectModel[]> {
    if (!Number.isFinite(productId) || productId <= 0) {
      throw new Error('productId inválido');
    }
    return this.get$<ReviewSelectModel[]>(
      `${this.baseUrl}/by-product/${productId}`
    );
  }

  /** POST /api/v1/Review  (cuerpo JSON) */
  createReview(data: ReviewRegisterModel): Observable<ReviewSelectModel> {
    // Si en algún momento el back exige multipart, me dices y lo cambio a FormData.
    return this.post$<ReviewSelectModel>(this.baseUrl, data);
  }

  /** DELETE /api/v1/Review/:id */
  deleteReview(reviewId: number): Observable<void> {
    if (!Number.isFinite(reviewId) || reviewId <= 0) {
      throw new Error('reviewId inválido');
    }
    return this.delete$<void>(`${this.baseUrl}/${reviewId}`);
  }
}
