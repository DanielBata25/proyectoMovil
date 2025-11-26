import { Routes } from '@angular/router';
import { AppShellComponent } from './shared/components/app-shell/app-shell.component';
import { ForbiddenComponent } from './core/page/forbidden/forbidden.component';

export const routes: Routes = [
  /** 1) Arranque: mandar al login */
  { path: '', pathMatch: 'full', redirectTo: 'auth/intro' },

  /** 2) Rutas sin barras (auth) */
  {
    path: 'auth',
    loadChildren: () =>
      import('./features/auth/auth.routes').then(m => m.AUTH_ROUTES),
  },

  /** 3) Shell con barras + hijos (home, account, products, notifications) */
  {
    path: '',
    component: AppShellComponent,
    children: [
      // Si entras al shell “pelado”, te envía al home/inicio
      { path: '', pathMatch: 'full', redirectTo: 'home/inicio' },

      // HOME
      {
        path: 'home',
        loadChildren: () =>
          import('./features/home/home.routes').then(m => m.HOME_ROUTES),
      },

      // ACCOUNT
      {
        path: 'account',
        loadChildren: () =>
          import('./features/account/account.routes').then(m => m.ACCOUNT_ROUTES),
      },

      // PRODUCTS
      {
        path: 'products',
        loadChildren: () =>
          import('./features/products/product.routes').then(m => m.PRODUCTS_ROUTES),
      },

      // FARMS
      {
        path: 'farms',
        loadChildren: () =>
          import('./features/farms/farm.routes').then(m => m.FARMS_ROUTES),
      },

      /** 🔔 NOTIFICATIONS - Página completa con navbar (Ionic) */
      {
        path: 'notifications',
        loadComponent: () =>
          import('./shared/components/notifications-page/notifications-page.component')
            .then(m => m.NotificationPageComponent),
      },

      /** Páginas de sistema */
      { path: 'forbidden', component: ForbiddenComponent },
    ],
  },

  /** 4) 404 global */
  { path: '**', redirectTo: 'notFound' },
];
