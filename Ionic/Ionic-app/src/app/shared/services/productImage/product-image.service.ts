import { Injectable } from '@angular/core';
import { from, Observable } from 'rxjs';
import { ApiNative } from 'src/app/core/services/http/api.native';
import { ProductImageSelectModel } from '../../models/product/product.model';

@Injectable({
  providedIn: 'root',
})
export class ProductImageService {
  /** Mantiene rutas relativas; ApiNative arma la URL completa */
  private readonly base = '/ProductImage';

  /** Obtener imagenes de un producto */
  getImagesByProductId(id: number): Observable<ProductImageSelectModel[]> {
    return from(ApiNative.get<ProductImageSelectModel[]>(`${this.base}/${id}`));
  }

  /** Eliminar varias imagenes mediante sus publicId */
  deleteImagesByPublicIds(publicIds: string[]): Observable<void> {
    return from(ApiNative.request<void>('DELETE', `${this.base}/multiple`, publicIds));
  }

  /** Eliminar logicamente una imagen por su publicId */
  logicalDeleteImage(publicId: string): Observable<void> {
    const safe = encodeURIComponent(publicId ?? '');
    return from(ApiNative.patch<void>(`${this.base}/logical-delete?publicId=${safe}`, null));
  }
}
