// src/app/shared/services/order/order.service.ts
import { Injectable } from '@angular/core';
import { from, map, Observable } from 'rxjs';
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
import { ConsumerRatingCreateModel, ConsumerRatingModel } from '../../models/consumerRating/consumerRating.model';

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
  uploadPayment(code: string, req: UploadPaymentRequest): Observable<any> {
    const fd = new FormData();
    fd.append('RowVersion', req.rowVersion);
    const file = req.paymentImage;
    const fileName = (file as any)?.name ?? 'payment.jpg';
    fd.append('PaymentImage', file, fileName);
    return from(ApiNative.post<any>(`${this.userBase}/${code}/payment`, fd));
  }

  // GET /OrderUser/mine
  getMine(): Observable<OrderListItemModel[]> {
    return from(ApiNative.get<OrderListItemModel[]>(`${this.userBase}/mine`));
  }

  // GET /OrderUser/{id}/detail
  getDetailForUser(code: string): Observable<OrderDetailModel> {
    return from(ApiNative.get<OrderDetailModel>(`${this.userBase}/${code}/detail`));
  }

  // POST /OrderUser/{id}/confirm-received
  confirmReceived(code: string, body: OrderConfirmRequest): Observable<any> {
    return from(ApiNative.post<any>(`${this.userBase}/${code}/confirm-received`, body));
  }

  // POST /OrderUser/{id}/cancel
  cancelByUser(code: string, rowVersion: string): Observable<any> {
    return from(
      ApiNative.post<any>(
        `${this.userBase}/${code}/cancel`,
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
  getDetailForProducer(code: string): Observable<OrderDetailModel> {
    return from(ApiNative.get<OrderDetailModel>(`${this.producerBase}/${code}/detail`));
  }

  /** -------------------------- PRODUCER ACTIONS ------------------------------ */
  // POST /OrderProducer/{id}/accept
  acceptOrder(code: string, dto: OrderAcceptRequest): Observable<void> {
    return from(ApiNative.post<void>(`${this.producerBase}/${code}/accept`, dto));
  }

  // POST /OrderProducer/{id}/reject
  rejectOrder(code: string, dto: OrderRejectRequest): Observable<void> {
    return from(ApiNative.post<void>(`${this.producerBase}/${code}/reject`, dto));
  }

  // POST /OrderProducer/{id}/preparing
  markPreparing(code: string, rowVersion: string): Observable<any> {
    return from(
      ApiNative.post<any>(
        `${this.producerBase}/${code}/preparing`,
        JSON.stringify(rowVersion)
      )
    );
  }

  // POST /OrderProducer/{code}/dispatched
  markDispatched(code: string, rowVersion: string): Observable<any> {
    return from(
      ApiNative.post<any>(
        `${this.producerBase}/${code}/dispatched`,
        JSON.stringify(rowVersion)
      )
    );
  }

  // POST /OrderProducer/{code}/delivered
  markDelivered(code: string, rowVersion: string): Observable<any> {
    return from(
      ApiNative.post<any>(
        `${this.producerBase}/${code}/delivered`,
        JSON.stringify(rowVersion)
      )
    );
  }
  // ========== CALIFICACIÓN DEL CLIENTE (PRODUCTOR) ==========

/**
 * POST /Producer/{code}/rate-customer
 * Crea o actualiza la calificación del cliente hecha por el productor
 */
rateCustomer(
  code: string,
  dto: ConsumerRatingCreateModel
): Observable<{ isSuccess: boolean; data: ConsumerRatingModel }> {
  return from(
    ApiNative.post<{ isSuccess: boolean; data: ConsumerRatingModel }>(
      `${this.producerBase}/${code}/rate-customer`,
      dto
    )
  );
}

/**
 * GET /Producer/{code}/rate-customer
 * Obtiene la calificación del cliente hecha por el productor
 */
getCustomerRating(code: string): Observable<ConsumerRatingModel | null> {
  return from(
    ApiNative.get<{ isSuccess: boolean; data: ConsumerRatingModel | null }>(
      `${this.producerBase}/${code}/rate-customer`
    )
  ).pipe(map(r => r.data));
}

}

 

