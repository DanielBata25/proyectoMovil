import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { Params, RouterLink } from '@angular/router';

@Component({
  selector: 'app-stat-card',
  standalone: true,
  imports: [CommonModule, IonicModule, RouterLink],
  templateUrl: './stat-card.component.html',
  styleUrls: ['./stat-card.component.scss'],
})
export class StatCardComponent {
  /** Icono de Ionic (ej: 'hourglass-outline', 'checkmark-circle') */
  @Input() icon: string = 'information-circle-outline';

  /** Texto descriptivo */
  @Input() text: string = '';

  /** Cantidad a mostrar (se formatea si es numérico) */
  @Input() count: number | string = 0;

  /** Hace la tarjeta clicable */
  @Input() clickable = false;

  /** Variante de color */
  @Input() color: 'success' | 'warning' | 'info' | 'neutral' = 'success';

  /** Estado de carga (skeleton) */
  @Input() loading = false;

  /** Navegación opcional */
  @Input() to?: string | any[];
  @Input() queryParams?: Params;
  @Input() fragment?: string;

  /** Evento si no hay routerLink */
  @Output() clicked = new EventEmitter<void>();

  get isLink(): boolean {
    return Array.isArray(this.to) || typeof this.to === 'string';
  }

  get formattedCount(): string {
    if (typeof this.count === 'number') {
      return new Intl.NumberFormat('es-CO').format(this.count);
    }
    return String(this.count ?? '');
  }

  onActivateClick() {
    if (!this.isLink) this.clicked.emit();
  }

  onKeyDown(e: KeyboardEvent) {
    if (!this.clickable || this.isLink) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      this.clicked.emit();
    }
  }
}
