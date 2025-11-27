import { inject, Injectable, NgZone } from '@angular/core';
import * as signalR from '@microsoft/signalr';
import { environment } from '../../../../environments/environment';
import { from, Observable } from 'rxjs';
import {
  OrderChatMessageCreateDto,
  OrderChatMessageDto,
  OrderChatMessagesPageDto
} from '../../models/chat/chat.model';
import { ApiNative } from 'src/app/core/services/http/api.native';

@Injectable({
  providedIn: 'root',
})
export class OrderChatService {

  private hubConnection?: signalR.HubConnection;
  private currentOrderCode?: string;
  private readonly base = '/orders';
  private readonly zone = inject(NgZone);

  constructor() {}

  // =====================================================
  // =============== MÉTODOS HTTP: ApiNative =============
  // =====================================================

  /** Obtiene mensajes paginados del chat */
  getMessages(
    orderCode: string,
    skip = 0,
    take = 50
  ): Observable<OrderChatMessagesPageDto> {

    const url = `${this.base}/${orderCode}/chat/messages?skip=${skip}&take=${take}`;

    return from(
      ApiNative.get<OrderChatMessagesPageDto>(url)
    );
  }

  /** Envía un mensaje al chat de un pedido */
  sendMessage(
    orderCode: string,
    payload: OrderChatMessageCreateDto
  ): Observable<OrderChatMessageDto> {

    const url = `${this.base}/${orderCode}/chat/messages`;

    return from(
      ApiNative.post<OrderChatMessageDto>(url, payload)
    );
  }

  // =====================================================
  // ======================= SIGNALR ======================
  // =====================================================

  startConnection(
    orderCode: string,
    onMessage: (msg: OrderChatMessageDto) => void
  ): Promise<void> {

    this.currentOrderCode = orderCode;

    // Si ya existe la conexión, sólo nos aseguramos de que esté activa y en la sala
    if (this.hubConnection) {
      if (this.hubConnection.state === signalR.HubConnectionState.Connected) {
        return this.joinRoom(orderCode);
      }
      if (this.hubConnection.state === signalR.HubConnectionState.Reconnecting) {
        // Cuando reconecte, onreconnected volverá a unir la sala
        return Promise.resolve();
      }
    } else {
      // Construcción del HUB URL (igual que antes)
      const hubUrl = (environment as any).hubUrl
        ? (environment as any).hubUrl + 'orders/chat'
        : environment.apiUrl.replace('/api/v1/', '/hubs/orders/chat');

      this.hubConnection = new signalR.HubConnectionBuilder()
        .withUrl(hubUrl, {
          withCredentials: true,
        })
        .withAutomaticReconnect()
        .build();

      // Evento de mensaje recibido
      this.hubConnection.on(
        'ReceiveMessage',
        (orderCodeFromHub: string, message: OrderChatMessageDto) => {

          if (orderCodeFromHub !== this.currentOrderCode) {
            return;
          }

          this.zone.run(() => onMessage(message));
        }
      );

      // Al reconectar, volvemos a unir la sala para seguir recibiendo mensajes
      this.hubConnection.onreconnected(() => {
        if (!this.currentOrderCode) return;
        this.joinRoom(this.currentOrderCode).catch((err) =>
          console.warn('No se pudo re-unir al room del pedido tras reconectar', err)
        );
      });
    }

    return this.hubConnection
      .start()
      .then(() => this.joinRoom(orderCode))
      .catch((err) => {
        console.error('Error al conectar al hub de chat', err);
        this.hubConnection = undefined;
        throw err;
      });
  }

  /** Detiene la conexión SignalR */
  async stopConnection(orderCode: string): Promise<void> {
    if (!this.hubConnection) {
      return;
    }

    try {
      await this.hubConnection.invoke('LeaveOrderRoom', orderCode);
    } catch (err) {
      console.warn('Error al salir del room del pedido', err);
    }

    await this.hubConnection.stop();
    this.hubConnection = undefined;
    this.currentOrderCode = undefined;
  }

  private joinRoom(orderCode: string): Promise<void> {
    return this.hubConnection!.invoke('JoinOrderRoom', orderCode);
  }
}
