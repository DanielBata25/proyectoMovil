import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { take, switchMap, finalize } from 'rxjs/operators';

// Ionic standalone components & controllers
import {
  IonContent, IonGrid, IonRow, IonCol,
  IonCard, IonCardContent,
  IonItem, IonLabel, IonInput, IonNote,
  IonButton, IonIcon
} from '@ionic/angular/standalone';
import { LoadingController, ToastController, NavController } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { eye, eyeOff } from 'ionicons/icons';

// Servicios propios
import { AuthService } from 'src/app/core/services/auth/auth.service';
import { AuthState } from 'src/app/core/services/auth/auth.state';
import { RouterLink } from '@angular/router';
import { ButtonComponent } from 'src/app/shared/components/button/button.component';

@Component({
  standalone: true,
  selector: 'app-login',
  imports: [
    CommonModule, ReactiveFormsModule, RouterLink,
    IonContent,
    IonCard, IonCardContent,
    IonItem, IonInput, IonNote,
    IonButton, IonIcon,
    ButtonComponent
],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private authState = inject(AuthState);
  private navCtrl = inject(NavController);
  private loadingCtrl = inject(LoadingController);
  private toastCtrl = inject(ToastController);

  loading = false;
  showPassword = false;

  constructor() {
    // registra iconos usados (evita warnings en algunos entornos)
    addIcons({ eye, eyeOff });
  }

  formLogin: FormGroup = this.fb.group({
    email: [
      '',
      [
        Validators.required,
        Validators.email,
        Validators.maxLength(150),
        LoginComponent.notBlank,
      ],
    ],
    password: [
      '',
      [
        Validators.required,
        Validators.minLength(6),
        LoginComponent.notBlank,
        LoginComponent.noSpaces,
      ],
    ],
  });

  getErrorMessage(field: 'email' | 'password'): string {
    const control = this.formLogin.get(field);
    if (control?.hasError('required')) {
      return field === 'email' ? 'El correo es requerido' : 'La contraseña es requerida';
    }
    if (control?.hasError('blank')) return field === 'email' ? 'El correo no puede estar en blanco.' : 'La contraseña no puede estar vacía.';
    if (control?.hasError('email')) return 'Ingrese un correo válido';
    if (control?.hasError('maxlength')) return 'El correo no debe superar 150 caracteres.';
    if (control?.hasError('minlength')) return 'La contraseña debe tener al menos 6 caracteres';
    if (control?.hasError('spaces')) return 'La contraseña no debe contener espacios.';
    return '';
  }

  private async toast(message: string, color: 'success' | 'danger' | 'medium' = 'medium') {
    const t = await this.toastCtrl.create({ message, duration: 1800, color, position: 'bottom' });
    await t.present();
  }

  async login() {
    if (this.loading) return;
    if (this.formLogin.invalid) {
      this.formLogin.markAllAsTouched();
      const err = this.getFirstLoginError();
      if (err) await this.toast(err, 'danger');
      return;
    }

    const payload = this.formLogin.value as { email: string; password: string };
    console.log(payload);
    

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
        await this.toast('Inicio de sesion exitoso.', 'success');
        await this.navCtrl.navigateRoot('/home/inicio');
      },
      error: async (err) => {
        const msg = err?.status === 401
          ? 'Credenciales inválidas.'
          : err?.error?.message || 'No se pudo iniciar sesión.';
        await this.toast(msg, 'danger');
      }
    });
  }

  private getFirstLoginError(): string | null {
    const fields: Array<'email' | 'password'> = ['email', 'password'];
    for (const field of fields) {
      const control = this.formLogin.get(field);
      if (control?.invalid) {
        return this.getErrorMessage(field);
      }
    }
    return null;
  }

  private static notBlank(control: AbstractControl): ValidationErrors | null {
    const value = (control.value ?? '').toString();
    return value.trim().length ? null : { blank: true };
  }

  private static noSpaces(control: AbstractControl): ValidationErrors | null {
    const value = (control.value ?? '').toString();
    return value.includes(' ') ? { spaces: true } : null;
  }
}


