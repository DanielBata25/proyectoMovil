// features/home/home.routes.ts
import { Routes } from '@angular/router';
import { HomeComponent } from './pages/home/home.component';
//import { OrdersPage } from './pages/orders/orders.page';

export const HOME_ROUTES: Routes = [
  { path: '', redirectTo: 'inicio', pathMatch: 'full' },
  { path: 'inicio', component: HomeComponent },
  //{ path: 'pedidos', component: OrdersPage }, // <- ya existe /home/pedidos
  { path: 'product', loadChildren: () => import('../products/product.routes').then(m => m.PRODUCTS_ROUTES) },
];
