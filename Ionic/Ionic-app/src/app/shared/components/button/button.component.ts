import { CommonModule, Location } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Router } from '@angular/router';
import { IonicModule } from '@ionic/angular';

@Component({
  selector: 'app-button',
  standalone: true,
  imports: [CommonModule, IonicModule],
  templateUrl: './button.component.html',
  styleUrls: ['./button.component.scss'],
})
export class ButtonComponent {
  @Input() text: string = 'Botón';
  @Input() type: 'button' | 'submit' | 'reset' = 'button';
  @Input() disabled: boolean = false;
  @Input() color: 'primary' | 'secondary' | 'danger' | 'success' | 'warning' | 'tertiary' = 'primary';
  @Input() icon: string = '';
  @Input() loading = false;
  @Input() back: boolean = false;
  @Input() redirectTo: string | null = null;

  /** Acción del stepper (en Ionic no hay directiva; sólo controla qué template se muestra) */
  @Input() stepperAction: 'next' | 'previous' | null = null;

  /** (Opcional) para no romper usos existentes como size="sm" */
  @Input() size?: 'sm' | 'md' | 'lg';

  @Output() clicked = new EventEmitter<void>();

  constructor(private location: Location, private router: Router) {}

  onClick(): void {
    if (this.disabled) return;
    if (this.back) this.location.back();
    else if (this.redirectTo) this.router.navigate([this.redirectTo]);
    this.clicked.emit();
  }
}
