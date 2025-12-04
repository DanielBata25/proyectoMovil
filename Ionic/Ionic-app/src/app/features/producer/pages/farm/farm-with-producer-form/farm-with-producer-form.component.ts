import { Component, inject } from '@angular/core';
import { IonicModule, ToastController } from '@ionic/angular';
import { Router } from '@angular/router';
import { take } from 'rxjs/operators';

import { FarmFormComponent } from '../farm-form/farm-form.component';
import { FarmSelectModel } from 'src/app/shared/models/farm/farm.model';
import { AuthState } from 'src/app/core/services/auth/auth.state';

@Component({
  selector: 'app-farm-with-producer-form',
  standalone: true,
  imports: [IonicModule, FarmFormComponent],
  templateUrl: './farm-with-producer-form.component.html',
  styleUrls: ['./farm-with-producer-form.component.scss'],
})
export class FarmWithProducerFormComponent  {
  private readonly auth = inject(AuthState);
  private readonly router = inject(Router);
  private readonly toastCtrl = inject(ToastController);

  // El formulario de finca maneja la creación combinada; aquí solo reaccionamos al resultado.
  onSaved(farm: FarmSelectModel | null): void {
    this.auth.loadMe().pipe(take(1)).subscribe({
      next: async () => {
        const toast = await this.toastCtrl.create({
          message: 'Tu cuenta ahora es de productor.',
          duration: 2200,
          color: 'success',
          position: 'bottom',
        });
        await toast.present();
        this.router.navigateByUrl('/account/producer/summary');
      },
      error: () => {
        this.router.navigateByUrl('/account/producer/summary');
      },
    });
  }
}
