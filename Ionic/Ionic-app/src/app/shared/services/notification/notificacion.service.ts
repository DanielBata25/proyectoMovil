// src/app/shared/services/notifications/notification.service.ts
import { Injectable } from '@angular/core';
import { from, Observable } from 'rxjs';
import { ApiNative } from 'src/app/core/services/http/api.native';

import {
    NotificationListItemDto,
    CreateNotificationRequest
} from '../../models/notificacions/notificacion.model';

@Injectable({
    providedIn: 'root'
})
export class NotificationService {

    private readonly base = '/Notification';

    /** Obtiene las notificaciones no leídas del usuario */
    getUnread(take: number = 20): Observable<NotificationListItemDto[]> {
        return from(
            ApiNative.get<NotificationListItemDto[]>(`${this.base}/unread?take=${take}`)
        );
    }

    /** Obtiene el conteo de notificaciones no leídas */
    countUnread(): Observable<number> {
        return from(
            ApiNative.get<number>(`${this.base}/count`)
        );
    }

    /** Obtiene el historial paginado */
    getHistory(
        page: number = 1,
        pageSize: number = 20
    ): Observable<NotificationListItemDto[]> {
        const url = `${this.base}/history?page=${page}&pageSize=${pageSize}`;
        return from(
            ApiNative.get<NotificationListItemDto[]>(url)
        );
    }

    /** Marca una notificación como leída */
    markAsRead(id: number): Observable<void> {
        return from(
            ApiNative.put<void>(`${this.base}/${id}/read`, {})
        );
    }

    /** Crea una notificación manualmente (solo para pruebas o administración) */
    create(body: CreateNotificationRequest): Observable<number> {
        return from(
            ApiNative.post<number>(`${this.base}`, body)
        );
    }
}
