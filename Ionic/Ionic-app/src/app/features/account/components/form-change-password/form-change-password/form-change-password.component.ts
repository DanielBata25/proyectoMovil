import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import {
  IonContent, IonCard, IonCardHeader, IonCardTitle,
  IonCardContent, IonItem, IonLabel, IonInput,
  IonIcon, AlertController, ToastController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { save, close, eye, eyeOff } from 'ionicons/icons';

import { Router } from '@angular/router';
import { Location } from '@angular/common';
import { PasswordPolicyService } from 'src/app/shared/services/passwordPolicy/password-policy.service';
import { AuthService } from 'src/app/core/services/auth/auth.service';
import { ChangePasswordModel } from 'src/app/core/models/changePassword.model';
import { ButtonComponent } from 'src/app/shared/components/button/button.component';

@Component({
  selector: 'app-form-change-password',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule,
    IonContent, IonCard, IonCardHeader, IonCardTitle,
    IonCardContent, IonItem, IonLabel, IonInput, IonIcon,
    ButtonComponent
  ],
  templateUrl: './form-change-password.component.html',
  styleUrls: ['./form-change-password.component.scss']
})
export class FormChangePasswordComponent {
  private fb = inject(FormBuilder);
  private policy = inject(PasswordPolicyService);
  private auth = inject(AuthService);
  private router = inject(Router);
  private alertCtrl = inject(AlertController);
  private toastCtrl = inject(ToastController);
  private location = inject(Location);

  title = 'Cambiar Contraseña';

  // controles de visibilidad
  showCurrent = false;
  showNew = false;
  showConfirm = false;

  goBack(): void {
    this.location.back();
  }

  form = this.fb.group({
    currentPassword: ['', Validators.required],
    newPassword: ['', [this.policy.validator()]],
    confirmNewPassword: ['', Validators.required]
  }, { validators: this.policy.passwordsMatch('newPassword', 'confirmNewPassword') });

  get f() { return this.form.controls; }

  constructor() {
    addIcons({ save, close, eye, 'eye-off': eyeOff });
  }

  async save(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    if (this.f.currentPassword.value === this.f.newPassword.value) {
      const alert = await this.alertCtrl.create({
        header: 'Advertencia',
        message: 'La nueva contraseña no puede ser igual a la actual.',
        buttons: ['OK']
      });
      return alert.present();
    }

    const objeto: ChangePasswordModel = {
      currentPassword: this.f.currentPassword.value!,
      newPassword: this.f.newPassword.value!
    };

    this.auth.ChangePassword(objeto).subscribe({
      next: async () => {
        const toast = await this.toastCtrl.create({
          message: 'Contraseña actualizada correctamente ✅',
          duration: 2000,
          color: 'success'
        });
        toast.present();
        this.form.reset();
        this.goBack();
      },
      error: async (err) => {
        const alert = await this.alertCtrl.create({
          header: 'Error',
          message: err?.error?.message ?? 'No se pudo cambiar la contraseña.',
          buttons: ['OK']
        });
        alert.present();
      }
    });
  }

  // toggle de visibilidad
  toggle(field: 'current' | 'new' | 'confirm') {
    if (field === 'current') this.showCurrent = !this.showCurrent;
    if (field === 'new') this.showNew = !this.showNew;
    if (field === 'confirm') this.showConfirm = !this.showConfirm;
  }

}
