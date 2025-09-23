// src/app/core/services/product/product.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Capacitor } from '@capacitor/core';
import { from, Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import {
  ProductRegisterModel,
  ProductSelectModel,
  ProductUpdateModel,
  ApiOk,
} from './../../models/product/product.model';
import { ApiNative } from 'src/app/core/services/http/api.native';

@Injectable({ providedIn: 'root' })
export class ProductService {
  /**
   * Normalizamos la base para evitar dobles barras o rutas rotas.
   * Si environment.apiUrl es '/api/v1' (proxy) o 'http(s)://host/api/v1', ambos funcionan.
   */
  private static readonly API = environment.apiUrl.replace(/\/+$/, '');
  private readonly productBase = `${ProductService.API}/Product`;
  private readonly categoriesBase = `${ProductService.API}/categories`;

  // En web, asegura cookies/XSRF cuando aplique
  private readonly webOpts = { withCredentials: true };

  // Flag para decidir transporte
  private readonly isNative = Capacitor.isNativePlatform();

  constructor(private http: HttpClient) {}

  // ------------------------------ Helpers transporte ------------------------------

  private get$<T>(url: string): Observable<T> {
    return this.isNative
      ? from(ApiNative.get<T>(url))
      : this.http.get<T>(url, this.webOpts);
  }

  private delete$<T>(url: string): Observable<T> {
    return this.isNative
      ? from(ApiNative.delete<T>(url))
      : this.http.delete<T>(url, this.webOpts);
  }

  private post$<T>(url: string, body: any): Observable<T> {
    // ApiNative y HttpClient aceptan JSON o FormData.
    return this.isNative
      ? from(ApiNative.post<T>(url, body))
      : this.http.post<T>(url, body, this.webOpts);
  }

  private put$<T>(url: string, body: any): Observable<T> {
    return this.isNative
      ? from(ApiNative.put<T>(url, body))
      : this.http.put<T>(url, body, this.webOpts);
  }

  // -------------------------------- Favorites / Home --------------------------------

  getAllHome(): Observable<ProductSelectModel[]> {
    return this.get$<ProductSelectModel[]>(`${this.productBase}/home`);
  }

  getFavorites(): Observable<ProductSelectModel[]> {
    return this.get$<ProductSelectModel[]>(`${this.productBase}/favorites`);
  }

  // ----------------------------- Filtrado por categoría -----------------------------

  /**
   * Productos de la categoría indicada y sus subcategorías.
   * GET /api/v1/categories/{categoryId}/products
   */
  getByCategory(categoryId: number): Observable<ProductSelectModel[]> {
    if (!categoryId || categoryId <= 0) {
      throw new Error('categoryId inválido');
    }
    return this.get$<ProductSelectModel[]>(
      `${this.categoriesBase}/${categoryId}/products`
    );
  }

  // ------------------------------------- CRUD --------------------------------------

  getAll(): Observable<ProductSelectModel[]> {
    return this.get$<ProductSelectModel[]>(this.productBase);
  }

  getByProducerId(): Observable<ProductSelectModel[]> {
    return this.get$<ProductSelectModel[]>(`${this.productBase}/by-producer`);
  }

  /** Obtener productos de productor por código */
  getProductByCodeProducer(codeProducer: string): Observable<ProductSelectModel[]> {
    const safe = encodeURIComponent(codeProducer ?? '');
    return this.get$<ProductSelectModel[]>(
      `${this.productBase}/by-producerCode/${safe}`
    );
  }

  getById(id: number): Observable<ProductSelectModel> {
    if (!id || id <= 0) throw new Error('ID inválido');
    return this.get$<ProductSelectModel>(`${this.productBase}/${id}`);
  }

  delete(id: number): Observable<void> {
    if (!id || id <= 0) throw new Error('ID inválido');
    return this.delete$<void>(`${this.productBase}/${id}`);
  }

  // ----------------------------------- CREATE --------------------------------------

  create(dto: ProductRegisterModel): Observable<ApiOk> {
    const fd = this.buildFormData(dto);
    return this.post$<ApiOk>(`${this.productBase}/register/product`, fd);
  }

  // ----------------------------------- UPDATE --------------------------------------

  update(dto: ProductUpdateModel): Observable<ApiOk> {
    if (!dto?.id) throw new Error('ID del producto es obligatorio');
    const fd = this.buildFormData(dto);
    return this.put$<ApiOk>(`${this.productBase}/${dto.id}`, fd);
  }

  // --------------------------------- FormData --------------------------------------

  /**
   * Multipart FormData que el backend espera.
   *
   * Campos:
   * - id             (solo en Update)
   * - name
   * - description
   * - price
   * - unit
   * - production
   * - stock
   * - status
   * - categoryId
   * - FarmIds        (varias claves repetidas)
   * - images         (File[])
   * - imagesToDelete (varias claves repetidas con PublicId)
   */
  private buildFormData(
    dto: ProductRegisterModel | ProductUpdateModel
  ): FormData {
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

    // Múltiples fincas
    (dto.farmIds ?? []).forEach((fid) => {
      if (fid !== null && fid !== undefined) {
        data.append('FarmIds', String(fid));
      }
    });

    // Imágenes nuevas
    if (dto.images?.length) {
      dto.images.forEach((file) => {
        if (file) data.append('images', file, (file as any).name ?? 'image');
      });
    }

    // Imágenes a borrar (PublicId)
    if ('imagesToDelete' in dto && dto.imagesToDelete?.length) {
      dto.imagesToDelete.forEach((pubId) => {
        if (pubId) data.append('imagesToDelete', pubId);
      });
    }

    return data;
  }
}
