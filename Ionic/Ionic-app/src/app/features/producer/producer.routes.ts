import { Routes } from '@angular/router';

export const PRODUCER_ROUTES: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'summary' },
  {
    path: 'summary',
    loadComponent: () =>
      import('./pages/summary/summary.component').then((m) => m.SummaryPage),
  },
  {
    path: 'profile',
    loadComponent: () =>
      import('../producer-profile/producer-profile.component').then(
        (m) => m.ProducerProfileComponent,
      ),
  },
  {
    path: 'orders/:code',
    loadComponent: () =>
      import('./pages/producer-order-detail/producer-order-detail.component').then(
        (m) => m.ProducerOrderDetailComponent,
      ),
  },
  {
    path: 'orders',
    loadComponent: () =>
      import('./pages/producer-orders-list/producer-orders-list.component').then(
        (m) => m.ProducerOrdersListComponent,
      ),
  },
  {
    path: 'product',
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./pages/product/product-list/product-list.component').then(
            (m) => m.ProductListComponent,
          ),
      },
      {
        path: 'create',
        loadComponent: () =>
          import('./pages/product/product-form/product-form.component').then(
            (m) => m.ProductFormComponent,
          ),
      },
      {
        path: 'update/:id',
        loadComponent: () =>
          import('./pages/product/product-form/product-form.component').then(
            (m) => m.ProductFormComponent,
          ),
      },
    ],
  },
  {
    path: 'farm',
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./pages/farm/farm-list/farm-list.component').then(
            (m) => m.FarmListComponent,
          ),
      },
      {
        path: 'create',
        loadComponent: () =>
          import('./pages/farm/farm-form/farm-form.component').then(
            (m) => m.FarmFormComponent,
          ),
      },
      {
        path: 'update/:id',
        loadComponent: () =>
          import('./pages/farm/farm-form/farm-form.component').then(
            (m) => m.FarmFormComponent,
          ),
      },
    ],
  },
];
