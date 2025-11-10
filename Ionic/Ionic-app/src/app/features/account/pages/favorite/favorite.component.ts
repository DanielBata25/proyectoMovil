import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  IonContent, IonHeader, IonToolbar, IonTitle, IonRefresher, IonRefresherContent,
  IonGrid, IonRow, IonCol, IonCard, IonCardContent, IonImg, IonIcon, IonSkeletonText
} from '@ionic/angular/standalone';
import { Router } from '@angular/router';
import { addIcons } from 'ionicons';
// Ya los registraste globalmente en main.ts, pero por si acaso:
import { heart, heartDislike } from 'ionicons/icons';

import { ProductService } from '../../../../shared/services/product/product.service';
import { FavoriteFacadeService } from '../../../../shared/services/favorite/favorite-facade.service';
import { ProductSelectModel } from '../../../../shared/models/product/product.model';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-favorite',
  standalone: true,
  imports: [
    CommonModule,
    IonContent, IonRefresher, IonRefresherContent,
    IonGrid, IonRow, IonCol, IonCard, IonCardContent, IonImg, IonIcon, IonSkeletonText
],
  templateUrl: './favorite.component.html',
  styleUrls: ['./favorite.component.scss'],
})
export class FavoriteComponent implements OnInit, OnDestroy {
  private productService = inject(ProductService);
  private fav = inject(FavoriteFacadeService);
  private router = inject(Router);
  private destroy$ = new Subject<void>();

  loading = true;
  products: ProductSelectModel[] = [];

  constructor() {
    addIcons({ heart, heartDislike }); // el corazón verde lo pinta el CSS
  }

  ngOnInit(): void {
    this.loadFavorites();

    // Reflejar cambios globales
    this.fav.changes$
      .pipe(takeUntil(this.destroy$))
      .subscribe(({ id, isFavorite }) => {
        if (!isFavorite) this.products = this.products.filter(p => p.id !== id);
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  trackById = (_: number, p: ProductSelectModel) => p.id;

  refresh(ev: CustomEvent) {
    this.loadFavorites(() => (ev.target as HTMLIonRefresherElement).complete());
  }

  private loadFavorites(done?: () => void): void {
    this.loading = true;
    this.productService.getFavorites().subscribe({
      next: data => {
        this.products = (data ?? []).map(p => ({ ...p, isFavorite: true }));
        this.loading = false; done?.();
      },
      error: () => { this.products = []; this.loading = false; done?.(); }
    });
  }

  gotoProduct(p: ProductSelectModel) {
    this.router.navigate(['/home/product', p.id]);
  }

  toggleFavorite(p: ProductSelectModel, ev?: Event) {
    ev?.stopPropagation();
    this.fav.toggle(p);
    this.products = this.products.filter(x => x.id !== p.id); // feedback inmediato
  }
}
