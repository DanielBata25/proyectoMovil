import { Routes } from '@angular/router';
import { FarmComponent } from './pages/farm/farm.component';
import { FarmDetailComponent } from './pages/farm-detail/farm-detail.component';

export const FARMS_ROUTES: Routes = [
  { path: '', component: FarmComponent },
  { path: ':id', component: FarmDetailComponent },
];
