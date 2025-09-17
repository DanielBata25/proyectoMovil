import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { IonicModule, ToastController, AlertController } from '@ionic/angular';

// Swiper web components
import { register } from 'swiper/element/bundle';
register();

import {
  ProductSelectModel
} from 'src/app/shared/models/product/product.model';
import {
  ReviewRegisterModel,
  ReviewSelectModel,
} from 'src/app/shared/models/product/product.model';

import { ProductService } from 'src/app/shared/services/product/product.service';
import { ReviewService } from 'src/app/shared/services/review/review.service';
import { AuthState } from 'src/app/core/services/auth/auth.state';
import { UserMeDto } from 'src/app/core/models/login.model';

import { Observable, of, firstValueFrom } from 'rxjs';

import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { ButtonComponent } from 'src/app/shared/components/button/button.component';

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule, ButtonComponent],
  templateUrl: './product-detail.component.html',
  styleUrls: ['./product-detail.component.scss'],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class ProductDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private productService = inject(ProductService);
  private reviewService = inject(ReviewService);
  private authState = inject(AuthState);

  private toastCtrl = inject(ToastController);
  private alertCtrl = inject(AlertController);

  // Usuario actual
  me$: Observable<UserMeDto | null> = of(null);

  // Producto
  productId!: number;
  product!: ProductSelectModel;
  loadingProduct = true;

  // (opcional) por si quieres usar fuera del carrusel
  selectedImage: string | null = null;

  // Reseñas
  reviews: ReviewSelectModel[] = [];
  loadingReviews = true;

  // Nueva reseña
  newReview = '';
  selectedRating = 0;
  stars = Array(5).fill(0);

  // Métricas
  averageRating = 0;
  distribution: { star: number; count: number; percentage: number }[] = [];
  totalReviews = 0;

  Math = Math; // para usar Math en el template

  ngOnInit(): void {
    // Usuario actual
    this.authState.hydrateFromStorage();
    this.me$ = this.authState.loadMe();

    // Id de producto
    this.productId = Number(this.route.snapshot.paramMap.get('id'));
    if (!this.productId) return;

    // Carga de datos
    this.loadProduct();
    this.loadReviews();
  }

  private loadProduct(): void {
    this.loadingProduct = true;
    this.productService.getById(this.productId).subscribe({
      next: (data) => {
        const images = Array.isArray(data.images)
          ? data.images.filter(i => !!i?.imageUrl)
          : [];
        this.product = { ...data, images };
        this.selectedImage = this.product.images[0]?.imageUrl ?? null;
        this.loadingProduct = false;
      },
      error: () => {
        this.loadingProduct = false;
      },
    });
  }

  private loadReviews(): void {
    this.loadingReviews = true;
    this.reviewService.getReviewByProduct(this.productId).subscribe({
      next: (list) => {
        this.reviews = list ?? [];
        this.recomputeStats();
        this.loadingReviews = false;
      },
      error: () => {
        this.loadingReviews = false;
      },
    });
  }

  onImgError(ev: Event): void {
    (ev.target as HTMLImageElement).src = 'assets/icon/shapes.svg';
  }

  setRating(value: number): void {
    this.selectedRating = value;
  }

  async submitReview(): Promise<void> {
    if (this.selectedRating < 1 || this.selectedRating > 5) return;
    const comment = this.newReview.trim();
    if (!comment) return;

    const payload: ReviewRegisterModel = {
      productId: this.productId,
      rating: this.selectedRating,
      comment,
    };

    this.reviewService.createReview(payload).subscribe({
      next: async (created) => {
        this.reviews.unshift(created);
        this.newReview = '';
        this.selectedRating = 0;
        this.recomputeStats();

        const toast = await this.toastCtrl.create({
          message: 'Reseña publicada',
          duration: 1500,
          position: 'bottom',
          color: 'success',
        });
        await toast.present();
      },
      error: async (err) => {
        const toast = await this.toastCtrl.create({
          message: err?.error?.message ?? 'No se pudo publicar la reseña',
          duration: 2000,
          position: 'top',
          color: 'danger',
        });
        await toast.present();
      },
    });
  }

  async deleteReview(reviewId: number): Promise<void> {
    const alert = await this.alertCtrl.create({
      header: '¿Eliminar reseña?',
      message: 'Esta acción no se puede deshacer.',
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Eliminar',
          role: 'destructive',
          handler: async () => {
            try {
              await firstValueFrom(this.reviewService.deleteReview(reviewId));
              this.reviews = this.reviews.filter(r => r.id !== reviewId);
              this.recomputeStats();

              const ok = await this.toastCtrl.create({
                message: 'Reseña eliminada',
                duration: 1500,
                position: 'bottom',
                color: 'success',
              });
              await ok.present();
            } catch (err: any) {
              const errAlert = await this.alertCtrl.create({
                header: 'No se pudo eliminar la reseña',
                message: err?.error?.message ?? 'Inténtalo de nuevo',
                buttons: ['OK'],
              });
              await errAlert.present();
            }
          },
        },
      ],
    });
    await alert.present();
  }

  private recomputeStats(): void {
    const n = this.reviews.length;
    this.totalReviews = n;

    if (n === 0) {
      this.averageRating = 0;
      this.distribution = [5, 4, 3, 2, 1].map(star => ({ star, count: 0, percentage: 0 }));
      return;
    }

    const sum = this.reviews.reduce((acc, r) => acc + (r.rating || 0), 0);
    this.averageRating = sum / n;

    const counts: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    for (const r of this.reviews) counts[r.rating] = (counts[r.rating] ?? 0) + 1;

    this.distribution = [5, 4, 3, 2, 1].map(star => {
      const count = counts[star] ?? 0;
      return { star, count, percentage: (count / n) * 100 };
    });
  }

  trackByReview = (_: number, r: ReviewSelectModel) => r.id;
}
