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
  OrderRejectRequest,
  UploadPaymentRequest
} from '../../models/order/order.model';
import { ApiNative } from 'src/app/core/services/http/api.native';

@Injectable({ providedIn: 'root' })
export class OrderService {
  /** Bases relativas (ApiNative resuelve contra environment.apiUrl) */
  private readonly userBase = 'OrderUser';
  private readonly producerBase = 'OrderProducer';

  /** ------------------------------- CREATE ----------------------------------- */
  create(dto: OrderCreateModel): Observable<CreateOrderResponse> {
    // POST /OrderUser
    return from(ApiNative.post<CreateOrderResponse>(`${this.userBase}`, dto));
  }

  /** ------------------------------- USER ------------------------------------ */
  // POST /OrderUser/{id}/payment
  uploadPayment(id: number, req: UploadPaymentRequest): Observable<any> {
    if (!Number.isFinite(id) || id <= 0) throw new Error('ID inválido');
    const fd = new FormData();
    fd.append('RowVersion', req.rowVersion);
    const file = req.paymentImage;
    const fileName = (file as any)?.name ?? 'payment.jpg';
    fd.append('PaymentImage', file, fileName);
    return from(ApiNative.post<any>(`${this.userBase}/${id}/payment`, fd));
  }

  // GET /OrderUser/mine
  getMine(): Observable<OrderListItemModel[]> {
    return from(ApiNative.get<OrderListItemModel[]>(`${this.userBase}/mine`));
  }

  // GET /OrderUser/{id}/detail
  getDetailForUser(id: number): Observable<OrderDetailModel> {
    if (!Number.isFinite(id) || id <= 0) throw new Error('ID inválido');
    return from(ApiNative.get<OrderDetailModel>(`${this.userBase}/${id}/detail`));
  }

  // POST /OrderUser/{id}/confirm-received
  confirmReceived(id: number, body: OrderConfirmRequest): Observable<any> {
    if (!Number.isFinite(id) || id <= 0) throw new Error('ID inválido');
    return from(ApiNative.post<any>(`${this.userBase}/${id}/confirm-received`, body));
  }

  // POST /OrderUser/{id}/cancel
  cancelByUser(id: number, rowVersion: string): Observable<any> {
    if (!Number.isFinite(id) || id <= 0) throw new Error('ID inválido');
    return from(
      ApiNative.post<any>(
        `${this.userBase}/${id}/cancel`,
        JSON.stringify(rowVersion)
      )
    );
  }

  /** ------------------------------ PRODUCER ---------------------------------- */
  // GET /OrderProducer
  getProducerOrders(): Observable<OrderListItemModel[]> {
    return from(ApiNative.get<OrderListItemModel[]>(`${this.producerBase}`));
  }

  // GET /OrderProducer/pending
  getProducerPendingOrders(): Observable<OrderListItemModel[]> {
    return from(ApiNative.get<OrderListItemModel[]>(`${this.producerBase}/pending`));
  }

  // GET /OrderProducer/{id}/detail
  getDetailForProducer(id: number): Observable<OrderDetailModel> {
    if (!Number.isFinite(id) || id <= 0) throw new Error('ID inválido');
    return from(ApiNative.get<OrderDetailModel>(`${this.producerBase}/${id}/detail`));
  }

  /** -------------------------- PRODUCER ACTIONS ------------------------------ */
  // POST /OrderProducer/{id}/accept
  acceptOrder(id: number, dto: OrderAcceptRequest): Observable<void> {
    if (!Number.isFinite(id) || id <= 0) throw new Error('ID inválido');
    return from(ApiNative.post<void>(`${this.producerBase}/${id}/accept`, dto));
  }

  // POST /OrderProducer/{id}/reject
  rejectOrder(id: number, dto: OrderRejectRequest): Observable<void> {
    if (!Number.isFinite(id) || id <= 0) throw new Error('ID inválido');
    return from(ApiNative.post<void>(`${this.producerBase}/${id}/reject`, dto));
  }

  // POST /OrderProducer/{id}/preparing
  markPreparing(id: number, rowVersion: string): Observable<any> {
    if (!Number.isFinite(id) || id <= 0) throw new Error('ID inválido');
    return from(
      ApiNative.post<any>(
        `${this.producerBase}/${id}/preparing`,
        JSON.stringify(rowVersion)
      )
    );
  }

  // POST /OrderProducer/{id}/dispatched
  markDispatched(id: number, rowVersion: string): Observable<any> {
    if (!Number.isFinite(id) || id <= 0) throw new Error('ID inválido');
    return from(
      ApiNative.post<any>(
        `${this.producerBase}/${id}/dispatched`,
        JSON.stringify(rowVersion)
      )
    );
  }

  // POST /OrderProducer/{id}/delivered
  markDelivered(id: number, rowVersion: string): Observable<any> {
    if (!Number.isFinite(id) || id <= 0) throw new Error('ID inválido');
    return from(
      ApiNative.post<any>(
        `${this.producerBase}/${id}/delivered`,
        JSON.stringify(rowVersion)
      )
    );
  }
}
