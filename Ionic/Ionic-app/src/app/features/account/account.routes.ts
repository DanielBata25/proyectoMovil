import { Routes } from '@angular/router';
import { InfoComponent } from './pages/info/info.component';

import { FavoriteComponent } from './pages/favorite/favorite.component';
import { SupportComponent } from './pages/support/support.component';

import { roleMatchGuard } from 'src/app/core/guards/role-match/role-match.guard';
import { FormChangePasswordComponent } from './components/form-change-password/form-change-password/form-change-password.component';
import { UpdatePersonComponent } from './components/update-person/update-person/update-person.component';

export const ACCOUNT_ROUTES: Routes = [
    {
        path: '',
        children: [
            {
                path: '',
                redirectTo: 'info',
                //canMatch: [roleMatchGuard],
                //data: { roles: ['Consumer'] },
                pathMatch: 'full',
            },
            // Home info + subrutas protegidas
            {
                path: 'info',
                canMatch: [roleMatchGuard],
                data: { roles: ['Consumer'] },
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
                canMatch: [roleMatchGuard],
                data: { roles: ['Consumer'] },
                component: FavoriteComponent,
            },

            {
                path: 'support',
                title: 'Soporte',
                canMatch: [roleMatchGuard],
                data: { roles: ['Consumer'] },
                component: SupportComponent,
            },

            // --- PRODUCER ---

            // Ruta pública de onboarding (NO canMatch)
            {
                path: 'become-producer',
                title: 'Convertirme en productor',
                loadComponent: () =>
                    import('../producer/pages/onboarding/onboarding.component').then(
                        (m) => m.OnboardingComponent
                    ),
            },
            // {
            //     path: 'register-producer',
            //     title: 'Crear en productor',
            //     loadComponent: () =>
            //         import(
            //             '../producer/pages/farm/farm-with-producer-form/farm-with-producer-form.component'
            //         ).then((m) => m.FarmWithProducerFormComponent),
            // },

            // {
            //     path: 'producer',
            //     canMatch: [roleMatchGuard],
            //     data: { roles: ['Producer'] },
            //     loadChildren: () =>
            //         import('../producer/producer.routes').then((m) => m.PRODUCER_ROUTES),
            // },
            //   {
            //     path: 'security',
            //     canMatch: [roleMatchGuard],
            //     data: { roles: ['Admin'] },
            //     loadChildren: () =>
            //       import('../security/security.routes').then((m) => m.SECURITY_ROUTES),
            //   },
            //   {
            //     path: 'parameters',
            //     canMatch: [roleMatchGuard],
            //     data: { roles: ['Admin'] },
            //     loadChildren: () =>
            //       import('../parameters/parameters.routes').then(
            //         (m) => m.PARAMETERS_ROUTES
            //       ),

        ],
    },
];
