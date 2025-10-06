import { Routes } from '@angular/router';
import { ManagementPage } from './pages/management/management.component';

export const PRODUCER_ROUTES: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'summary' },
  {
    path: 'summary',
    loadComponent: () =>
      import('./pages/summary/summary.component').then((m) => m.SummaryPage),
  },
  {
    path: 'management',
    component: ManagementPage,
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'product' },
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
              import('./pages/product/product-create/product-create.component').then(
                (m) => m.ProductCreateComponent,
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
        loadComponent: () =>
          import('./pages/farm/farm-list/farm-list.component').then(
            (m) => m.FarmListComponent,
          ),
      },
    ],
  },
];
