import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize, take } from 'rxjs';
import { IonicModule, ToastController, AlertController } from '@ionic/angular';

import { RecoverPasswordModel, RecoverPasswordConfirmModel } from '../../../../core/models/changePassword.model';

import { PasswordPolicyService } from '../../../../shared/services/passwordPolicy/password-policy.service';
import { AuthService } from 'src/app/core/services/auth/auth.service';
import { ButtonComponent } from 'src/app/shared/components/button/button.component';

@Component({
  selector: 'app-recover-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, IonicModule, ButtonComponent],
  templateUrl: './recover-password.component.html',
  styleUrls: ['./recover-password.component.scss'],
})
export class RecoverPasswordComponent implements OnInit {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private auth = inject(AuthService);
  private pwdPolicy = inject(PasswordPolicyService);

  private toastCtrl = inject(ToastController);
  private alertCtrl = inject(AlertController);

  loading = signal(false);
  step = signal<1 | 2>(1);

  // Form principal con 2 grupos: step1 y step2
  form: FormGroup = this.fb.group({
    step1: this.fb.group({
      email: ['', [Validators.required, Validators.email]],
    }),
    step2: this.fb.group(
      {
        emailConfirm: ['', [Validators.required, Validators.email]],
        code: ['', [Validators.required, Validators.minLength(4)]],
        newPassword: ['', [this.pwdPolicy.validator()]],
        confirmNewPassword: ['', [Validators.required]],
      },
      { validators: [this.pwdPolicy.passwordsMatch('newPassword', 'confirmNewPassword')] }
    ),
  });

  // Atajos a controles
  s1 = this.form.get('step1') as FormGroup;
  s2 = this.form.get('step2') as FormGroup;

  sameEmail = computed(() => {
    const e1 = (this.s1.get('email')?.value || '').trim().toLowerCase();
    const e2 = (this.s2.get('emailConfirm')?.value || '').trim().toLowerCase();
    return !!e1 && !!e2 && e1 === e2;
  });

  ngOnInit(): void {}

  // Mensajes de error centralizados
  getErrorMessage(group: 'step1' | 'step2', field: string): string {
    const fg = group === 'step1' ? this.s1 : this.s2;
    const control = fg.get(field);
    if (!control) return '';

    if (control.hasError('required')) return 'Campo requerido';
    if (control.hasError('email')) return 'Email no válido';
    if (control.hasError('minlength')) return 'Longitud mínima no cumplida';
    if (control.hasError('passwordPolicy')) return 'La contraseña debe tener al menos 6 caracteres y una mayúscula';
    if (fg.hasError('passwordMismatch') && (field === 'confirmNewPassword' || field === 'newPassword')) {
      return 'Las contraseñas no coinciden';
    }
    return '';
  }

  // Helpers UI
  private async toast(message: string, color: 'success' | 'danger' | 'medium' = 'success') {
    const t = await this.toastCtrl.create({ message, duration: 1800, position: 'bottom', color });
    await t.present();
  }
  private async alert(header: string, message: string) {
    const a = await this.alertCtrl.create({ header, message, buttons: ['OK'] });
    await a.present();
  }

  // PASO 1: enviar código
  async sendCode(): Promise<void> {
    if (this.loading() || this.s1.invalid) {
      this.s1.markAllAsTouched();
      return;
    }

    const payload: RecoverPasswordModel = { email: this.s1.value.email };

    this.loading.set(true);

    this.auth
      .RequestRecoverPassword(payload)
      .pipe(take(1), finalize(() => { this.loading.set(false); }))
      .subscribe({
        next: async () => {
          this.s2.get('emailConfirm')?.setValue(this.s1.value.email);
          this.step.set(2);
          await this.toast('Código enviado. Revisa tu correo.', 'success');
        },
        error: async (err) => {
          const msg = err?.error?.message || 'No se pudo enviar el código.';
          await this.toast(msg, 'danger');
        },
      });
  }

  // PASO 2: confirmar con código y nueva contraseña
  async confirm(): Promise<void> {
    if (this.loading() || this.s2.invalid) {
      this.s2.markAllAsTouched();
      return;
    }

    // Validación adicional: emails deben coincidir
    const email1 = (this.s1.value.email || '').trim().toLowerCase();
    const email2 = (this.s2.value.emailConfirm || '').trim().toLowerCase();
    if (email1 !== email2) {
      await this.alert('Correos distintos', 'El correo del Paso 1 debe coincidir con el del Paso 2.');
      return;
    }

    const newPwd: string = this.s2.value.newPassword;
    if (!this.pwdPolicy.isValid(newPwd)) {
      await this.alert('Contraseña inválida', 'Debe tener al menos 6 caracteres y una mayúscula.');
      return;
    }

    const payload: RecoverPasswordConfirmModel = {
      email: email2,
      code: this.s2.value.code,
      newPassword: newPwd,
    };

    this.loading.set(true);

    this.auth
      .ConfirmRecoverPassword(payload)
      .pipe(take(1), finalize(() => { this.loading.set(false); }))
      .subscribe({
        next: async (resp: any) => {
          if (resp?.isSuccess === false) {
            await this.toast('No se pudo actualizar la contraseña.', 'danger');
            return;
          }
          this.router.navigate(['/auth/login'], { replaceUrl: true });
          await this.toast('Contraseña actualizada. Inicia sesión con tu nueva contraseña.', 'success');
        },
        error: async (err) => {
          const msg = err?.error?.message || 'No se pudo actualizar la contraseña.';
          await this.toast(msg, 'danger');
        },
      });
  }

  goBackToStep1(): void {
    this.step.set(1);
  }
}
