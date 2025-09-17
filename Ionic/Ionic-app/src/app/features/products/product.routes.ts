import { Routes } from "@angular/router";
import { ProductComponent } from "../producer/pages/product/product.component";
import { ProductDetailComponent } from "./pages/product-detail/product-detail.component";


export const PRODUCTS_ROUTES: Routes=[
    {path:'',component:ProductComponent},
    {path:':id', component: ProductDetailComponent},
];