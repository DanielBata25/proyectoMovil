import { Routes } from '@angular/router';
import { AppShellComponent } from './shared/components/app-shell/app-shell.component';
import { ForbiddenComponent } from './core/page/forbidden/forbidden.component';


export const routes: Routes = [
  /** 1) Arranque: mandar al login */
  { path: '', pathMatch: 'full', redirectTo: 'auth/login' },

  /** 2) Rutas sin barras (auth) */
  {
    path: 'auth',
    loadChildren: () =>
      import('./features/auth/auth.routes').then(m => m.AUTH_ROUTES),
  },

  /** 3) Shell con barras + niños (home, account, products) */
  {
    path: '',
    component: AppShellComponent,
    children: [
      // Si entras al shell “pelado”, te envía al home/inicio
      { path: '', pathMatch: 'full', redirectTo: 'home/inicio' },

      {
        path: 'home',
        loadChildren: () =>
          import('./features/home/home.routes').then(m => m.HOME_ROUTES),
      },
      {
        path: 'account',
        loadChildren: () =>
          import('./features/account/account.routes').then(m => m.ACCOUNT_ROUTES),
      },
      {
        path: 'products',
        loadChildren: () =>
          import('./features/products/product.routes').then(m => m.PRODUCTS_ROUTES),
      },
      {
        path: 'farms',
        loadChildren: () =>
          import('./features/farms/farm.routes').then(m => m.FARMS_ROUTES),
      },

      /** Páginas de sistema que SÍ deben verse con barras (si aplica) */
      { path: 'forbidden', component: ForbiddenComponent },
      {
        path: 'notifications-menu',
        loadComponent: () =>
          import('./shared/components/notifications-menu/notifications-page.component').then(m => m.NotificationsPageComponent),
      },
      //{ path: 'notFound', component: NotFoundComponent },
    ],
  },

  /** 4) 404 global como último recurso */
  // {
  //   path: 'notFound',
  //   loadComponent: () =>
  //     import('./core/pages/not-found/not-found.component').then(m => m.NotFoundComponent),
  // },
  { path: '**', redirectTo: 'notFound' },
];
