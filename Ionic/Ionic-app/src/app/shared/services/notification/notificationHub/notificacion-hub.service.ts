import { Injectable, NgZone } from '@angular/core';
import {
    HubConnection,
    HubConnectionBuilder,
    HubConnectionState,
    LogLevel,
} from '@microsoft/signalr';
import { BehaviorSubject, Subject, Observable } from 'rxjs';
import { Capacitor } from '@capacitor/core';
import { environment } from '../../../../../environments/environment';
import { NotificationListItemDto } from 'src/app/shared/models/notificacions/notificacion.model';

type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'reconnecting';

@Injectable({
    providedIn: 'root',
})
export class NotificationHubService {
    private hub?: HubConnection;

    private readonly status$ = new BehaviorSubject<ConnectionStatus>('disconnected');
    private readonly notifications$ = new Subject<NotificationListItemDto>();

    constructor(private readonly zone: NgZone) { }

    /** Estado actual de la conexión */
    connectionStatus(): Observable<ConnectionStatus> {
        return this.status$.asObservable();
    }

    /** Flujo de notificaciones entrantes */
    onNotification(): Observable<NotificationListItemDto> {
        return this.notifications$.asObservable();
    }

    /** Inicializa la conexión */
    async connect(): Promise<void> {
        // 🔄 TEMPORAL: SignalR comentado por solicitud del usuario
        console.log('[NOTIFICATION-HUB] SignalR temporalmente deshabilitado');
        this.zone.run(() => this.status$.next('disconnected'));
        return;
        
        // Código original comentado
        /*
        if (!this.hub) {
            this.hub = this.buildConnection();
        }

        if (!this.hub) return;

        if (
            this.hub.state === HubConnectionState.Connected ||
            this.hub.state === HubConnectionState.Connecting
        ) {
            return;
        }

        this.zone.run(() => this.status$.next('connecting'));

        try {
            await this.hub.start();
            this.zone.run(() => this.status$.next('connected'));
            console.log('[NOTIFICATION-HUB] Conexión SignalR establecida');
        } catch (error) {
            console.error('Error al conectar con el hub de notificaciones', error);
            this.zone.run(() => this.status$.next('disconnected'));
            throw error;
        }
        */
    }

    /** Detiene la conexión */
    async disconnect(): Promise<void> {
        // 🔄 TEMPORAL: SignalR comentado por solicitud del usuario
        console.log('[NOTIFICATION-HUB] SignalR disconnect - conexión ya desactivada');
        this.zone.run(() => this.status$.next('disconnected'));
        this.hub = undefined;
        return;
        
        // Código original comentado
        /*
        if (!this.hub) return;

        try {
            await this.hub.stop();
        } finally {
            this.zone.run(() => this.status$.next('disconnected'));
            this.hub = undefined;
        }
        */
    }

    /** Construye la conexión */
    private buildConnection(): HubConnection {
        const hubUrl = this.buildHubUrl();

        const connection = new HubConnectionBuilder()
            .withUrl(hubUrl, {
                withCredentials: true,
            })
            .withAutomaticReconnect()
            .configureLogging(LogLevel.Information)
            .build();

        connection.on('NewNotification', (notification: NotificationListItemDto) => {
            this.zone.run(() => this.notifications$.next(notification));
        });

        connection.onreconnecting(() => {
            this.zone.run(() => this.status$.next('reconnecting'));
        });

        connection.onreconnected(() => {
            this.zone.run(() => this.status$.next('connected'));
        });

        connection.onclose(() => {
            this.zone.run(() => this.status$.next('disconnected'));
        });

        return connection;
    }

    /** Construye la URL del hub al estilo ApiNative */
    private buildHubUrl(): string {
        const isNative = Capacitor.isNativePlatform();

        // 1) Si es nativo → **SIEMPRE** usar URL absoluta real
        if (isNative) {
            return `${environment.apiUrl.replace(/\/+$/, '')}/hubs/notifications`;
        }

        // 2) Si es navegador → usar proxy si existe
        const base = environment.apiUrlBrowser || environment.apiUrl;

        return `${base.replace(/\/+$/, '')}/hubs/notifications`;
    }
}
