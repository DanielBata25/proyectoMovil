import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  IonContent, IonIcon,
  IonCard, IonCardContent, IonSpinner,
  ToastController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  mail, call, idCard, location,
  bagHandleOutline, createOutline, lockClosedOutline,
  logOutOutline, nutritionOutline, readerOutline,
  helpCircleOutline, mailOutline, chevronForward
} from 'ionicons/icons';

import { Router, RouterModule } from '@angular/router';
import { Location } from '@angular/common';

import { AuthService } from 'src/app/core/services/auth/auth.service';
import { AuthState } from 'src/app/core/services/auth/auth.state';
import { UserSelectModel } from 'src/app/core/models/user.model';
import { AlertController } from '@ionic/angular';

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
  private router = inject(Router);
  private authState = inject(AuthState);
  private toastCtrl = inject(ToastController);
  private alertCtrl = inject(AlertController);
  private location = inject(Location);

  person?: UserSelectModel;
  loading = true;
  loggingOut = false;

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

  goBack(): void {
    this.location.back();
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

  // 👉 método oficial con navigateByUrl (más seguro)
  goto(path: string) {
    this.router.navigateByUrl(path);
  }

  get displayName(): string {
    const p: any = this.person || {};
    return (
      p.name || p.fullName || p.personName || p.username ||
      (p.firstName && p.lastName ? `${p.firstName} ${p.lastName}` : '') ||
      this.person?.email || 'Usuario'
    );
  }

  async logout() {
    if (this.loggingOut) return;

    const alert = await this.alertCtrl.create({
      header: 'Cerrar sesion',
      message: 'Seguro que quieres cerrar tu sesion?',
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Si, salir',
          role: 'confirm',
        },
      ],
    });
    await alert.present();

    const { role } = await alert.onDidDismiss();
    if (role !== 'confirm') {
      return;
    }

    this.loggingOut = true;

    this.authService.LogOut().subscribe({
      next: async () => {
        await this.authState.clear();
        const toast = await this.toastCtrl.create({
          message: 'Sesión cerrada correctamente ✅',
          duration: 2000,
          color: 'success',
          position: 'bottom'
        });
        await toast.present();
        this.router.navigateByUrl('/auth/login');
      },
      error: async (err) => {
        const toast = await this.toastCtrl.create({
          message: err?.error?.message ?? 'No se pudo cerrar sesión.',
          duration: 2500,
          color: 'danger',
          position: 'bottom'
        });
        await toast.present();
        this.loggingOut = false;
      },
      complete: () => { this.loggingOut = false; }
    });
  }
}
