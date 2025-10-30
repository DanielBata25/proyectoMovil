import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, ToastController, AlertController } from '@ionic/angular';
import { Router } from '@angular/router';
import { FavoriteFacadeService } from 'src/app/shared/services/favorite/favorite-facade.service';
import { ProductSelectModel } from 'src/app/shared/models/product/product.model';
import { IfLoggedInDirective } from 'src/app/core/directives/if-logged-in.directive';



@Component({
  selector: 'app-card',
  standalone: true,
  imports: [CommonModule, IonicModule, IfLoggedInDirective],
  templateUrl: './card.component.html',
  styleUrls: ['./card.component.scss'],
})
export class CardComponent {
  private fav = inject(FavoriteFacadeService);
  private router = inject(Router);
  private toastCtrl = inject(ToastController);
  private alertCtrl = inject(AlertController); // (opcional si quieres confirmar borrar)

  @Input({ required: true }) product!: ProductSelectModel;
  @Input() showActions = false;
  @Input() showFavorite = false;

  @Output() edit = new EventEmitter<ProductSelectModel>();
  @Output() delete = new EventEmitter<ProductSelectModel>();
  @Output() view = new EventEmitter<ProductSelectModel>();

  // Asegúrate de tener esta imagen en src/assets/img/cargaImagen.png
  private readonly placeholder = 'assets/img/cargaImagen.png';

  get imageUrl(): string {
    const url = this.product?.images?.[0]?.imageUrl;
    return url && url.trim() ? url : this.placeholder;
  }

  get disabledFavorite(): boolean {
    return this.fav.isToggling(this.product?.id);
  }

  onImgError(ev: Event) {
    (ev.target as HTMLImageElement).src = this.placeholder;
  }

  onDetail(item: ProductSelectModel) {
    this.router.navigate(['/home/product', item.id]);
  }

  onEditClick(ev: Event) {
    ev.stopPropagation();
    this.edit.emit(this.product);
  }

  onViewClick(ev: Event) {
    ev.stopPropagation();
    this.view.emit(this.product);
  }

  onDeleteClick(ev: Event) {
    ev.stopPropagation();
    this.delete.emit(this.product);
    // Si quieres confirmación nativa antes de emitir, usa confirmDelete() de abajo.
  }

  async onFavoriteClick(ev: Event) {
    ev.stopPropagation();
    this.fav.toggle(this.product).subscribe({
      next: async (isFav) => {
        const t = await this.toastCtrl.create({
          message: isFav ? 'Añadido a favoritos' : 'Quitado de favoritos',
          duration: 1400,
          position: 'top',
          color: 'success',
        });
        await t.present();
      },
      error: async () => {
        const t = await this.toastCtrl.create({
          message: 'No se pudo actualizar el favorito',
          duration: 1800,
          position: 'top',
          color: 'danger',
        });
        await t.present();
      },
    });
  }

  // (OPCIONAL) Confirmación nativa para eliminar
  // Llama a esto desde onDeleteClick si lo deseas
  private async confirmDelete() {
    const alert = await this.alertCtrl.create({
      header: 'Eliminar producto',
      message: '¿Seguro que deseas eliminar este producto?',
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Eliminar',
          role: 'destructive',
          handler: () => this.delete.emit(this.product),
        },
      ],
    });
    await alert.present();
  }
}
