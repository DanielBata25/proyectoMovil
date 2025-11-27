import {
  Component,
  ElementRef,
  Input,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import {
  OrderChatMessageDto,
  OrderChatMessagesPageDto,
} from '../../models/chat/chat.model';
import { OrderChatService } from '../../services/orderChat/order-chat.service';

@Component({
  selector: 'app-order-chat',
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule],
  templateUrl: './order-chat.component.html',
  styleUrls: ['./order-chat.component.scss'],
})
export class OrderChatComponent implements OnInit, OnDestroy {
  @Input({ required: true }) orderCode!: string;
  @ViewChild('scrollContainer') scrollContainer?: ElementRef<HTMLDivElement>;

  loading = false;
  sending = false;
  error?: string;

  messages: OrderChatMessageDto[] = [];
  hasMore = false;
  total = 0;

  private pageSize = 50;
  private skip = 0;

  newMessage = '';

  isChatEnabled = false;
  isChatClosed = false;
  canSendMessages = false;
  chatDisabledReason?: string | null;
  chatClosedReason?: string | null;
  chatEnabledAt?: string | null;
  chatClosedAt?: string | null;

  constructor(private chatSrv: OrderChatService) {}

  ngOnInit(): void {
    if (!this.orderCode) {
      this.error = 'No se pudo cargar el chat: falta el código de pedido.';
      return;
    }
    this.loadInitial();
  }

  ngOnDestroy(): void {
    if (this.orderCode) {
      this.chatSrv.stopConnection(this.orderCode).catch(() => {});
    }
  }

  private loadInitial(): void {
    this.loading = true;
    this.error = undefined;

    this.chatSrv.getMessages(this.orderCode, this.skip, this.pageSize).subscribe({
      next: (page: OrderChatMessagesPageDto) => {
        this.applyPage(page);
        this.loading = false;

        if (this.isChatEnabled && !this.isChatClosed) {
          this.setupSignalR();
        }

        setTimeout(() => this.scrollToBottom(), 0);
      },
      error: (err) => {
        this.loading = false;
        this.error = err?.error?.message ?? 'No se pudo cargar el chat.';
      },
    });
  }

  private applyPage(page: OrderChatMessagesPageDto): void {
    this.messages = page.messages ?? [];
    this.total = page.total;
    this.hasMore = page.hasMore;
    this.skip = this.messages.length;

    this.isChatEnabled = page.isChatEnabled;
    this.isChatClosed = page.isChatClosed;
    this.canSendMessages = page.canSendMessages;
    this.chatDisabledReason = page.chatDisabledReason;
    this.chatClosedReason = page.chatClosedReason;
    this.chatEnabledAt = page.chatEnabledAt || undefined;
    this.chatClosedAt = page.chatClosedAt || undefined;
  }

  private setupSignalR(): void {
    this.chatSrv
      .startConnection(this.orderCode, (message) => this.onRealtimeMessage(message))
      .catch((err) => console.error('No se pudo iniciar la conexión de chat', err));
  }

  private onRealtimeMessage(message: OrderChatMessageDto): void {
    const exists = this.messages.some((m) => m.id === message.id);
    if (!exists) {
      this.messages.push(message);
      this.total++;
      setTimeout(() => this.scrollToBottom(), 0);
    }
  }

  loadMore(): void {
    if (!this.hasMore || this.loading) {
      return;
    }

    this.loading = true;

    this.chatSrv.getMessages(this.orderCode, this.skip, this.pageSize).subscribe({
      next: (page) => {
        this.messages = this.messages.concat(page.messages ?? []);
        this.total = page.total;
        this.hasMore = page.hasMore;
        this.skip = this.messages.length;

        this.isChatEnabled = page.isChatEnabled;
        this.isChatClosed = page.isChatClosed;
        this.canSendMessages = page.canSendMessages;
        this.chatDisabledReason = page.chatDisabledReason;
        this.chatClosedReason = page.chatClosedReason;
        this.chatEnabledAt = page.chatEnabledAt || undefined;
        this.chatClosedAt = page.chatClosedAt || undefined;

        this.loading = false;
      },
      error: (err) => {
        this.loading = false;
        this.error = err?.error?.message ?? 'No se pudieron cargar más mensajes.';
      },
    });
  }

  send(): void {
    const text = this.newMessage.trim();
    if (!text || this.sending) {
      return;
    }

    this.sending = true;
    this.error = undefined;

    const pendingText = this.newMessage;

    this.chatSrv.sendMessage(this.orderCode, { message: text }).subscribe({
      next: () => {
        this.newMessage = '';
        this.sending = false;
      },
      error: (err) => {
        this.sending = false;
        this.error =
          err?.error?.message ?? 'No se pudo enviar el mensaje. Intenta nuevamente.';
        this.newMessage = pendingText;
      },
    });
  }

  trackById(_: number, item: OrderChatMessageDto): number {
    return item.id;
  }

  getInitials(msg: OrderChatMessageDto): string {
    if (msg.isSystem) return '•';
    if (msg.isMine) return 'Yo';
    const fromType = (msg.senderType || '').toUpperCase();
    if (fromType === 'CUSTOMER' || fromType === 'CONSUMER') return 'C';
    if (fromType === 'PRODUCER') return 'P';
    return (msg.senderType || 'U').slice(0, 1).toUpperCase();
  }

  onEnter(ev: Event): void {
    const e = ev as KeyboardEvent;
    if (e.shiftKey) {
      return;
    }
    e.preventDefault();
    this.send();
  }

  private scrollToBottom(): void {
    if (!this.scrollContainer?.nativeElement) return;
    const native = this.scrollContainer.nativeElement;
    native.scrollTop = native.scrollHeight;
  }

  closeChat(): void {
    // Emitir evento para cerrar el chat desde el componente padre
    const event = new CustomEvent('closeChat');
    document.dispatchEvent(event);
  }
}
