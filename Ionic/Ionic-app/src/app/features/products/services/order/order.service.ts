// src/app/shared/services/order/order.service.ts
import { Injectable } from '@angular/core';
import { from, Observable } from 'rxjs';
import {
  OrderCreateModel,
  CreateOrderResponse,
  OrderAcceptRequest,
  OrderConfirmRequest,
  OrderDetailModel,
  OrderListItemModel,
  OrderRejectRequest
} from '../../models/order/order.model';
import { ApiNative } from 'src/app/core/services/http/api.native';

@Injectable({ providedIn: 'root' })
export class OrderService {
  /** Base relativa (ApiNative resuelve contra environment.apiUrl) */
  private readonly base = '/Order/';

  /** ------------------------------- CREATE ----------------------------------- */
  create(dto: OrderCreateModel): Observable<CreateOrderResponse> {
    const fd = new FormData();

    // --- Campos requeridos por el backend (PascalCase) ---
    fd.append('ProductId', String(dto.productId));
    fd.append('QuantityRequested', String(dto.quantityRequested));
    fd.append('CityId', String(dto.cityId));

    // Archivo (opcional pero recomendado)
    if (dto.paymentImage) {
      const file = dto.paymentImage as File; // asegúrate que el tipo sea File o Blob
      const name = file?.name ?? 'payment.jpg';
      fd.append('PaymentImage', file, name);
    }

    // Texto
    fd.append('RecipientName', (dto.recipientName ?? '').trim());
    fd.append('ContactPhone', (dto.contactPhone ?? '').trim());
    fd.append('AddressLine1', (dto.addressLine1 ?? '').trim());
    if (dto.addressLine2)    fd.append('AddressLine2', dto.addressLine2.trim());
    if (dto.additionalNotes) fd.append('AdditionalNotes', dto.additionalNotes.trim());

    // POST /Order  (sin forzar Content-Type)
    // Si tu backend exige sin el último slash, usa `${this.base.slice(0, -1)}`
    return from(ApiNative.post<CreateOrderResponse>(`${this.base}`, fd));
  }

  /** ------------------------------ PRODUCER ---------------------------------- */
  getProducerOrders(): Observable<OrderListItemModel[]> {
    return from(ApiNative.get<OrderListItemModel[]>(`${this.base}`));
  }

  getProducerPendingOrders(): Observable<OrderListItemModel[]> {
    return from(ApiNative.get<OrderListItemModel[]>(`${this.base}pending`));
  }

  getDetailForProducer(id: number): Observable<OrderDetailModel> {
    return from(ApiNative.get<OrderDetailModel>(`${this.base}${id}/for-producer`));
  }

  /** --------------------------------- USER ----------------------------------- */
  getMine(): Observable<OrderListItemModel[]> {
    return from(ApiNative.get<OrderListItemModel[]>(`${this.base}mine`));
  }

  getDetailForUser(id: number): Observable<OrderDetailModel> {
    return from(ApiNative.get<OrderDetailModel>(`${this.base}${id}/for-user`));
  }

  confirmReceived(id: number, body: OrderConfirmRequest): Observable<any> {
    return from(ApiNative.post<any>(`${this.base}${id}/confirm-received`, body));
  }

  /** -------------------------- PRODUCER ACTIONS ------------------------------ */
  acceptOrder(id: number, dto: OrderAcceptRequest): Observable<void> {
    return from(ApiNative.post<void>(`${this.base}${id}/accept`, dto));
  }

  rejectOrder(id: number, dto: OrderRejectRequest): Observable<void> {
    return from(ApiNative.post<void>(`${this.base}${id}/reject`, dto));
  }
}
