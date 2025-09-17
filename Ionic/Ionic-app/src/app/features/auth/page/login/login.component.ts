import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { take, switchMap, finalize } from 'rxjs/operators';

// Ionic standalone components & controllers
import {
  IonContent, IonGrid, IonRow, IonCol,
  IonCard, IonCardContent,
  IonItem, IonLabel, IonInput, IonNote,
  IonButton, IonIcon
} from '@ionic/angular/standalone';
import { LoadingController, ToastController } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { eye, eyeOff } from 'ionicons/icons';

// Servicios propios
import { AuthService } from 'src/app/core/services/auth/auth.service';
import { AuthState } from 'src/app/core/services/auth/auth.state';

@Component({
  standalone: true,
  selector: 'app-login',
  imports: [
    CommonModule, ReactiveFormsModule, RouterLink,
    IonContent,
    IonCard, IonCardContent,
    IonItem, IonInput, IonNote,
    IonButton, IonIcon
],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private authState = inject(AuthState);
  private router = inject(Router);
  private loadingCtrl = inject(LoadingController);
  private toastCtrl = inject(ToastController);

  loading = false;
  showPassword = false;

  constructor() {
    // registra iconos usados (evita warnings en algunos entornos)
    addIcons({ eye, eyeOff });
  }

  formLogin: FormGroup = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  getErrorMessage(field: 'email' | 'password'): string {
    const control = this.formLogin.get(field);
    if (control?.hasError('required')) {
      return field === 'email' ? 'El correo es requerido' : 'La contraseña es requerida';
    }
    if (control?.hasError('email')) return 'Ingrese un correo válido';
    if (control?.hasError('minlength')) return 'La contraseña debe tener al menos 6 caracteres';
    return '';
  }

  private async toast(message: string, color: 'success' | 'danger' | 'medium' = 'medium') {
    const t = await this.toastCtrl.create({ message, duration: 1800, color, position: 'top' });
    await t.present();
  }

  async login() {
    if (this.formLogin.invalid || this.loading) return;

    const payload = this.formLogin.value as { email: string; password: string };

    this.loading = true;
    const loading = await this.loadingCtrl.create({ message: 'Iniciando sesión...', spinner: 'circles' });
    await loading.present();

    this.auth.Login(payload).pipe(
      take(1),
      switchMap(() => this.authState.loadMe()),
      finalize(async () => {
        this.loading = false;
        await loading.dismiss();
      })
    ).subscribe({
      next: async (me) => {
        if (!me) {
          await this.toast('No se pudo cargar tu sesión. Intenta nuevamente.', 'danger');
          return;
        }
        await this.toast('Inicio de sesión exitoso.', 'success');
        this.router.navigateByUrl('/home/inicio');
      },
      error: async (err) => {
        const msg = err?.status === 401
          ? 'Credenciales inválidas.'
          : err?.error?.message || 'No se pudo iniciar sesión.';
        await this.toast(msg, 'danger');
      }
    });
  }
}
