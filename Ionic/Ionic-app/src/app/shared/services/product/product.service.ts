import { Injectable } from '@angular/core';
import { from, Observable } from 'rxjs';
import { ApiNative } from 'src/app/core/services/http/api.native';
import {
  ProductRegisterModel,
  ProductSelectModel,
  ProductUpdateModel,
  ApiOk,
} from './../../models/product/product.model';

@Injectable({ providedIn: 'root' })
export class ProductService {
  /** Mantén la convención de Auth: bases relativas; ApiNative las resuelve contra environment.apiUrl */
  private readonly base = '/Product';
  private readonly categoriesBase = '/categories';

  /** ----------------------------- Home / Favorites ----------------------------- */
  // GET /Product/home  (con soporte opcional de limit)
  getAllHome(limit?: number): Observable<ProductSelectModel[]> {
    const url = limit ? `${this.base}/home?limit=${limit}` : `${this.base}/home`;
    return from(ApiNative.get<ProductSelectModel[]>(url));
  }

  // GET /Product/featured
  getFeatured(): Observable<ProductSelectModel[]> {
    return from(ApiNative.get<ProductSelectModel[]>(`${this.base}/featured`));
  }

  // GET /Product/favorites
  getFavorites(): Observable<ProductSelectModel[]> {
    return from(ApiNative.get<ProductSelectModel[]>(`${this.base}/favorites`));
  }

  /** ----------------------------- Categorías ----------------------------------- */
  // GET /categories/{categoryId}/products
  getByCategory(categoryId: number): Observable<ProductSelectModel[]> {
    if (!categoryId || categoryId <= 0) throw new Error('categoryId inválido');
    return from(
      ApiNative.get<ProductSelectModel[]>(`${this.categoriesBase}/${categoryId}/products`)
    );
  }

  /** --------------------------------- CRUD ------------------------------------ */
  // GET /Product
  getAll(): Observable<ProductSelectModel[]> {
    return from(ApiNative.get<ProductSelectModel[]>(`${this.base}`));
  }

  // GET /Product/by-producer
  getByProducerId(): Observable<ProductSelectModel[]> {
    return from(ApiNative.get<ProductSelectModel[]>(`${this.base}/by-producer`));
  }

  // GET /Product/by-producerCode/{code}
  getProductByCodeProducer(codeProducer: string): Observable<ProductSelectModel[]> {
    const safe = encodeURIComponent(codeProducer ?? '');
    return from(ApiNative.get<ProductSelectModel[]>(`${this.base}/by-producerCode/${safe}`));
  }

  // GET /Product/{id}
  getById(id: number): Observable<ProductSelectModel> {
    return from(ApiNative.get<ProductSelectModel>(`${this.base}/${id}`));
  }

  // DELETE /Product/{id}
  delete(id: number): Observable<void> {
    return from(ApiNative.delete<void>(`${this.base}/${id}`));
  }

  /** ------------------------------ Create / Update ---------------------------- */
  // POST /Product/register/product   (multipart/form-data)
  create(dto: ProductRegisterModel): Observable<ApiOk> {
    const fd = this.buildFormData(dto);
    return from(ApiNative.post<ApiOk>(`${this.base}/register/product`, fd));
  }

  // PUT /Product/{id}                 (multipart/form-data)
  update(dto: ProductUpdateModel): Observable<ApiOk> {
    if (!dto.id) throw new Error('ID del producto es obligatorio');
    const fd = this.buildFormData(dto);
    return from(ApiNative.put<ApiOk>(`${this.base}/${dto.id}`, fd));
  }

  /** ------------------------------- FormData ---------------------------------- */
  private buildFormData(dto: ProductRegisterModel | ProductUpdateModel): FormData {
    const data = new FormData();

    if ('id' in dto && dto.id !== undefined && dto.id !== null) {
      data.append('id', String(dto.id));
    }

    data.append('name', dto.name);
    data.append('description', dto.description);
    data.append('price', String(dto.price));
    data.append('unit', dto.unit);
    data.append('production', dto.production);
    data.append('stock', String(dto.stock));
    data.append('status', String(dto.status));
    data.append('categoryId', String(dto.categoryId));

    // << NUEVO: soporte para shippingIncluded (si existe en el dto como en Web)
    if ('shippingIncluded' in dto && dto.shippingIncluded !== undefined) {
      data.append('shippingIncluded', String((dto as any).shippingIncluded));
    }

    // Múltiples fincas
    (dto.farmIds ?? []).forEach((fid) => data.append('FarmIds', String(fid)));

    // Imágenes nuevas
    if (dto.images?.length) {
      dto.images.forEach((file) => {
        const name = (file as any).name ?? 'image';
        data.append('images', file as any, name);
      });
    }

    // Imágenes a borrar (PublicId)
    if ('imagesToDelete' in dto && dto.imagesToDelete?.length) {
      dto.imagesToDelete.forEach((pubId) => data.append('imagesToDelete', pubId));
    }

    return data;
  }
}
