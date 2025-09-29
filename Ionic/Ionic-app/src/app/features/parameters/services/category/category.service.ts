import { Injectable } from '@angular/core';
import {
  CategoryNodeModel,
  CategoryRegistertModel,
  CategorySelectModel,
} from '../../models/category/category.model';
import { Observable, from, shareReplay } from 'rxjs';

// 🔥 CORREGIDO: ruta real al servicio genérico

import { ApiNative } from 'src/app/core/services/http/api.native';
import { GenericService } from 'src/app/shared/services/generic/generci.service';

@Injectable({
  providedIn: 'root',
})
export class CategoryService extends GenericService<
  CategorySelectModel,
  CategoryRegistertModel
> {
  private cache = new Map<string, Observable<CategoryNodeModel[]>>();

  constructor() {
    super('Category'); // ✅ solo endpoint
  }

  /**
   * GET /api/v1/categories/node?parentId=
   * - parentId omitido/null => categorías raíz.
   * - parentId con valor    => hijas de esa categoría.
   */
  public getNodes(parentId?: number | null): Observable<CategoryNodeModel[]> {
    const url = `${this.endpoint}/node`;

    let params: any = {};
    if (parentId !== null && parentId !== undefined) {
      params.parentId = String(parentId);
    }

    const key =
      parentId !== null && parentId !== undefined
        ? `node:${parentId}`
        : 'node:root';

    if (!this.cache.has(key)) {
      const req$ = from(ApiNative.get<CategoryNodeModel[]>(url, { params })).pipe(
        shareReplay(1)
      );
      this.cache.set(key, req$);
    }
    return this.cache.get(key)!;
  }
}
