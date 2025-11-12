import { Routes } from "@angular/router";
import { ProductComponent } from "./pages/product/product.component";
import { ProductDetailComponent } from "./pages/product-detail/product-detail.component";
import { ProducerProfileComponent } from "../producer-profile/producer-profile.component";


export const PRODUCTS_ROUTES: Routes=[
    {path:'',component:ProductComponent},
    {path:'profile/:code', component: ProducerProfileComponent},
    {path:':id', component: ProductDetailComponent},
];
