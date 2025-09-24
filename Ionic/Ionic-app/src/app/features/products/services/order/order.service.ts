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
  private readonly base = '/Order';

  /** ------------------------------- CREATE ----------------------------------- */
  create(dto: OrderCreateModel): Observable<CreateOrderResponse> {
    const fd = new FormData();

    // Requeridos (PascalCase como en el backend)
    fd.append('ProductId', String(dto.productId));
    fd.append('QuantityRequested', String(dto.quantityRequested));
    fd.append('CityId', String(dto.cityId));

    // Archivo (opcional)
    if (dto.paymentImage) {
      const file = dto.paymentImage as File; // File o Blob compatible
      const name = (file as any)?.name ?? 'payment.jpg';
      fd.append('PaymentImage', file, name);
    }

    // Texto
    fd.append('RecipientName', (dto.recipientName ?? '').trim());
    fd.append('ContactPhone', (dto.contactPhone ?? '').trim());
    fd.append('AddressLine1', (dto.addressLine1 ?? '').trim());
    if (dto.addressLine2)    fd.append('AddressLine2', dto.addressLine2.trim());
    if (dto.additionalNotes) fd.append('AdditionalNotes', dto.additionalNotes.trim());

    // POST /Order
    return from(ApiNative.post<CreateOrderResponse>(`${this.base}`, fd));
  }

  /** ------------------------------ PRODUCER ---------------------------------- */
  // GET /Order
  getProducerOrders(): Observable<OrderListItemModel[]> {
    return from(ApiNative.get<OrderListItemModel[]>(`${this.base}`));
  }

  // GET /Order/pending
  getProducerPendingOrders(): Observable<OrderListItemModel[]> {
    return from(ApiNative.get<OrderListItemModel[]>(`${this.base}/pending`));
  }

  // GET /Order/{id}/for-producer
  getDetailForProducer(id: number): Observable<OrderDetailModel> {
    if (!Number.isFinite(id) || id <= 0) throw new Error('ID inválido');
    return from(ApiNative.get<OrderDetailModel>(`${this.base}/${id}/for-producer`));
  }

  /** --------------------------------- USER ----------------------------------- */
  // GET /Order/mine
  getMine(): Observable<OrderListItemModel[]> {
    return from(ApiNative.get<OrderListItemModel[]>(`${this.base}/mine`));
  }

  // GET /Order/{id}/for-user
  getDetailForUser(id: number): Observable<OrderDetailModel> {
    if (!Number.isFinite(id) || id <= 0) throw new Error('ID inválido');
    return from(ApiNative.get<OrderDetailModel>(`${this.base}/${id}/for-user`));
  }

  // POST /Order/{id}/confirm-received
  confirmReceived(id: number, body: OrderConfirmRequest): Observable<any> {
    if (!Number.isFinite(id) || id <= 0) throw new Error('ID inválido');
    return from(ApiNative.post<any>(`${this.base}/${id}/confirm-received`, body));
  }

  /** -------------------------- PRODUCER ACTIONS ------------------------------ */
  // POST /Order/{id}/accept
  acceptOrder(id: number, dto: OrderAcceptRequest): Observable<void> {
    if (!Number.isFinite(id) || id <= 0) throw new Error('ID inválido');
    return from(ApiNative.post<void>(`${this.base}/${id}/accept`, dto));
  }

  // POST /Order/{id}/reject
  rejectOrder(id: number, dto: OrderRejectRequest): Observable<void> {
    if (!Number.isFinite(id) || id <= 0) throw new Error('ID inválido');
    return from(ApiNative.post<void>(`${this.base}/${id}/reject`, dto));
  }
}
