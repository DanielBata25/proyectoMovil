import { Routes } from "@angular/router";
import { LoginComponent } from "./page/login/login.component";
import { RecoverPasswordComponent } from "./page/recover-password/recover-password.component";
import { RegisterComponent } from "./page/register/register.component";

export const AUTH_ROUTES: Routes=[
    { path:'login', component: LoginComponent},
    { path: 'register', component: RegisterComponent},
    { path: 'recover-password', component:RecoverPasswordComponent},
    { path: '', pathMatch: 'full', redirectTo: 'login' }
];