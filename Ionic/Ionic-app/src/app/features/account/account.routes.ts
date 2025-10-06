import { Routes } from '@angular/router';
import { InfoComponent } from './pages/info/info.component';
import { FavoriteComponent } from './pages/favorite/favorite.component';
import { SupportComponent } from './pages/support/support.component';
import { FormChangePasswordComponent } from './components/form-change-password/form-change-password/form-change-password.component';
import { UpdatePersonComponent } from './components/update-person/update-person/update-person.component';

export const ACCOUNT_ROUTES: Routes = [
  {
    path: '',
    children: [
      {
        path: '',
        redirectTo: 'info',
        pathMatch: 'full',
      },
      {
        path: 'info',
        children: [
          {
            path: '',
            pathMatch: 'full',
            title: 'Informacion',
            component: InfoComponent,
          },
          {
            path: 'form-change-password',
            title: 'Cambiar Contraseña',
            component: FormChangePasswordComponent,
          },
          {
            path: 'update-person',
            title: 'Actualizar Datos Basicos',
            component: UpdatePersonComponent,
          },
        ],
      },
      {
        path: 'favorite',
        title: 'Ver Favoritos',
        component: FavoriteComponent,
      },
      {
        path: 'support',
        title: 'Soporte',
        component: SupportComponent,
      },
      {
        path: 'become-producer',
        title: 'Convertirme en productor',
        loadComponent: () =>
          import('../producer/pages/onboarding/onboarding.component').then(
            (m) => m.OnboardingComponent
          ),
      },
      {
        path: 'producer',
        loadChildren: () =>
          import('../producer/producer.routes').then((m) => m.PRODUCER_ROUTES),
      },
    ],
  },
];
