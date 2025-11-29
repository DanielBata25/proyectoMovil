// src/app/shared/services/favorite/favorite.service.ts
import { Injectable } from '@angular/core';
import { from, Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { ApiNative } from 'src/app/core/services/http/api.native';

@Injectable({ providedIn: 'root' })
export class FavoriteService {
  private readonly base = '/Product';

  /** POST /Product/register/favorite  { productId }  -> boolean */
  addFavorite(productId: number): Observable<boolean> {
    return from(ApiNative.post<void>(`${this.base}/register/favorite`, { productId }))
      .pipe(
        map(() => true),
        catchError(() => of(false))
      );
  }

  /** DELETE /Product/favorite/{productId} -> boolean */
  remove(productId: number): Observable<boolean> {
    return from(ApiNative.delete<void>(`${this.base}/favorite/${productId}`))
      .pipe(
        map(() => true),
        catchError(() => of(false))
      );
  }

  /**
   * Toggle: devuelve el nuevo estado (true = ahora es favorito).
   * Si la llamada falla, conserva el estado anterior.
   */
  toggle(productId: number, currentlyFavorite: boolean): Observable<boolean> {
    return (currentlyFavorite ? this.remove(productId) : this.addFavorite(productId))
      .pipe(
        map(ok => ok ? !currentlyFavorite : currentlyFavorite),
        catchError(() => of(currentlyFavorite))
      );
  }
}
