import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  IonContent, IonIcon,
  IonCard, IonCardContent, IonSpinner
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  mail, call, idCard, location,
  bagHandleOutline, createOutline, lockClosedOutline,
  logOutOutline, nutritionOutline, readerOutline,
  helpCircleOutline, mailOutline, chevronForward
} from 'ionicons/icons';

import { Router, RouterModule } from '@angular/router';

import { AuthService } from 'src/app/core/services/auth/auth.service';
import { UserSelectModel } from 'src/app/core/models/user.model';

@Component({
  selector: 'app-info',
  standalone: true,
  imports: [
    CommonModule, RouterModule,
    IonContent, IonIcon,
    IonCard, IonCardContent, IonSpinner,
  ],
  templateUrl: './info.component.html',
  styleUrls: ['./info.component.scss'],
})
export class InfoComponent implements OnInit {
  private authService = inject(AuthService);
  private router = inject(Router);   // ✅ usamos Router oficial

  person?: UserSelectModel;
  loading = true;

  constructor() {
    addIcons({
      mail, call, idCard, location,
      'bag-handle-outline': bagHandleOutline,
      'create-outline': createOutline,
      'lock-closed-outline': lockClosedOutline,
      'log-out-outline': logOutOutline,
      'nutrition-outline': nutritionOutline,
      'reader-outline': readerOutline,
      'help-circle-outline': helpCircleOutline,
      'mail-outline': mailOutline,
      'chevron-forward': chevronForward,
    });
  }

  ngOnInit(): void {
    this.loadPerson();
  }

  private loadPerson() {
    this.loading = true;
    this.authService.GetDataBasic().subscribe({
      next: (data) => { this.person = data; this.loading = false; },
      error: () => { this.person = undefined; this.loading = false; },
    });
  }

  // 👉 método oficial para navegar
  goto(path: string) {
    this.router.navigate([path]);
  }

  // Nombre amigable sin romper tipos
  get displayName(): string {
    const p: any = this.person || {};
    return (
      p.name || p.fullName || p.personName || p.username ||
      (p.firstName && p.lastName ? `${p.firstName} ${p.lastName}` : '') ||
      this.person?.email || 'Usuario'
    );
  }

  logout() {
    try { (this.authService as any)?.Logout?.(); } catch {}
  }
}
